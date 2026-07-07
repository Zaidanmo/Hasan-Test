using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using LinkUp.Api.Features.Users;
using LinkUp.Api.Features.Matching;
using LinkUp.Api.Features.Catalogs;
using LinkUp.Api.Features.ProfilePictures;
using LinkUp.Core.Interfaces;
using LinkUp.Data.Contexts;
using LinkUp.Data.Repositories;
using LinkUp.Infrastructure.Authentication;
using LinkUp.Infrastructure.Storage;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.Events;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.AspNetCore.Hosting", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.AspNetCore.Mvc", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.AspNetCore.Routing", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate:
        "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

try
{
    Log.Information("Start configuring http request pipeline");

    var builder = WebApplication.CreateBuilder(args);

    builder.Services.AddSerilog();

    builder.Services.ConfigureHttpJsonOptions(options =>
    {
        options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

    builder.Services.AddControllers().AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

    builder.Services.AddEndpointsApiExplorer();

    /*
     * Carter auto-discovers IValidator implementations and registers them as singletons by default.
     * Our user validators now depend on the scoped repository (for catalog code checks), so they must
     * be registered as scoped — otherwise the container fails with a captive-dependency error on build.
     */
    builder.Services.AddCarter(configurator: configurator =>
        configurator.WithValidatorLifetime(ServiceLifetime.Scoped));

    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "LinkUp API",
            Version = "v1"
        });

        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            In = ParameterLocation.Header,
            Description = "Enter a JWT token in the form: Bearer {token}",
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT"
        });

        options.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
    });

    builder.Services.Configure<JwtOptions>(
        builder.Configuration.GetSection(JwtOptions.SectionName));

    /*
     * Program does not execute unless JWT secret key, issuer and audience are present.
     * I saw this online and implemented, I do not know how significant of a role it plays.
     */
    var jwtOptions = builder.Configuration
                         .GetSection(JwtOptions.SectionName)
                         .Get<JwtOptions>()
                     ?? throw new InvalidOperationException("JWT configuration is missing.");

    if (string.IsNullOrWhiteSpace(jwtOptions.SecretKey) || Encoding.UTF8.GetByteCount(jwtOptions.SecretKey) < 32)
    {
        throw new InvalidOperationException("JWT secret key is missing or too short (must be at least 32 bytes).");
    }

    if (string.IsNullOrWhiteSpace(jwtOptions.Issuer))
    {
        throw new InvalidOperationException("JWT issuer is missing.");
    }

    if (string.IsNullOrWhiteSpace(jwtOptions.Audience))
    {
        throw new InvalidOperationException("JWT audience is missing.");
    }

    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                           ?? throw new InvalidOperationException("Default database connection string is missing.");
    
    Log.Information("Database connection configured.");
    
    /*
     * Better to use than AddDBContext as it shows improvement in single row fetching.
     */
    builder.Services.AddDbContextPool<LinkUpContext>(options =>
        options.UseSqlite(connectionString));

    builder.Services.AddMemoryCache();

    builder.Services.AddScoped<IUserHandler, UserHandler>();
    builder.Services.AddScoped<IMatchingHandler, MatchingHandler>();
    builder.Services.AddScoped<ICatalogHandler, CatalogHandler>();
    builder.Services.AddScoped<ICatalogCache, CatalogCache>();
    builder.Services.AddScoped<ILinkUpRepository, LinkUpRepository>();
    builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

    builder.Services.Configure<ProfilePictureOptions>(options =>
    {
        builder.Configuration.GetSection(ProfilePictureOptions.SectionName).Bind(options);
        if (!Path.IsPathRooted(options.StoragePath))
        {
            options.StoragePath = Path.Combine(builder.Environment.ContentRootPath, options.StoragePath);
        }
    });
    builder.Services.AddSingleton<IProfilePictureStorage, FileSystemProfilePictureStorage>();
    builder.Services.AddScoped<IProfilePictureHandler, ProfilePictureHandler>();
    builder.Services.Configure<FormOptions>(options => options.MultipartBodyLengthLimit = 5 * 1024 * 1024);

    builder.Services.AddScoped<IValidator<UserEnvelope<LoginUserDto>>, LoginUserEnvelopeValidator>();
    builder.Services.AddScoped<IValidator<UserEnvelope<NewUserDto>>, NewUserEnvelopeValidator>();
    builder.Services.AddScoped<IValidator<UserEnvelope<UpdateUserDto>>, UpdateUserEnvelopeValidator>();
    
    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtOptions.Issuer,
                ValidAudience = jwtOptions.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtOptions.SecretKey)),
                ClockSkew = TimeSpan.Zero
            };
        });

    builder.Services.AddAuthorization();
    
    // Rate Limiting on login & registration requests
    
    /*
        WARNING: the current rate limiters is shared between all users.
        TODO: Need to implement per IP or per User Limiters that works with server proxies. 
     */
    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

        options.AddFixedWindowLimiter("login", limiterOptions =>
        {
            limiterOptions.PermitLimit = 5;
            limiterOptions.Window = TimeSpan.FromMinutes(1);
            limiterOptions.QueueLimit = 0;
            limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        });

        options.AddFixedWindowLimiter("register", limiterOptions =>
        {
            limiterOptions.PermitLimit = 3;
            limiterOptions.Window = TimeSpan.FromMinutes(10);
            limiterOptions.QueueLimit = 0;
            limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        });
        
        // TODO: This should be applied to GET /matches but I have it removed for testing purposes. 
        options.AddFixedWindowLimiter("authenticated", limiterOptions =>
        {
            limiterOptions.PermitLimit = 60;
            limiterOptions.Window = TimeSpan.FromMinutes(1);
            limiterOptions.QueueLimit = 0;
            limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        });
    });

    var app = builder.Build();
    
    app.UseSerilogRequestLogging();

    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<LinkUpContext>();
        //dbContext.Database.EnsureDeleted();                                      //DELETES THE DB//
        
        dbContext.Database.Migrate();
        
        dbContext.Database.ExecuteSqlRaw("PRAGMA journal_mode=WAL;");
        dbContext.Database.ExecuteSqlRaw("PRAGMA busy_timeout=5000;");
    }

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }
    
    app.UseHttpsRedirection();
    app.UseAuthentication();
    app.UseAuthorization();

    app.UseRateLimiter();
    app.MapControllers();
    app.MapCarter();
    
    app.Run();
}
// This catch block used to trigger just because of migrations so these conditions should stop it from doing that
catch (Exception ex) when (ex.GetType().Name is not "HostAbortedException" && ex.GetType().Name is not "StopTheHostException")
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}