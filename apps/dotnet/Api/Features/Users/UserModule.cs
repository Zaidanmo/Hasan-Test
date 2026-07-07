using LinkUp.Core.DTOs;
using Serilog;

namespace LinkUp.Api.Features.Users;

public class UserModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/user",
                async Task<Results<UnauthorizedHttpResult, NotFound<object>, Ok<UserEnvelope<UserProfileDto>>>> (
                    IUserHandler userHandler,
                    ClaimsPrincipal claimsPrincipal,
                    HttpContext httpContext) =>
                {
                    var idValue = claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);

                    if (!Guid.TryParse(idValue, out var id))
                    {
                        return TypedResults.Unauthorized();
                    }

                    try
                    {
                        var user = await userHandler.GetUserAsync(id, httpContext.RequestAborted);

                        return TypedResults.Ok(new UserEnvelope<UserProfileDto>(user));
                    }
                    catch (InvalidOperationException ex)
                    {
                        return TypedResults.NotFound<object>(new { message = ex.Message });
                    }
                })
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status404NotFound)
            .Produces<UserEnvelope<UserProfileDto>>()
            .WithTags("User")
            .WithName("GetCurrentUser")
            .RequireAuthorization()
            .IncludeInOpenApi();

        app.MapGet("/users/{userId:guid}",
                async Task<Results<
                    UnauthorizedHttpResult,
                    NotFound<object>,
                    Ok<UserEnvelope<PublicUserProfileDto>>>> (
                    IUserHandler userHandler,
                    ClaimsPrincipal claimsPrincipal,
                    Guid userId,
                    HttpContext httpContext) =>
                {
                    var idValue = claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);

                    if (!Guid.TryParse(idValue, out _))
                    {
                        return TypedResults.Unauthorized();
                    }

                    try
                    {
                        var user = await userHandler.GetPublicUserAsync(
                            userId,
                            httpContext.RequestAborted);

                        return TypedResults.Ok(new UserEnvelope<PublicUserProfileDto>(user));
                    }
                    catch (InvalidOperationException ex)
                    {
                        return TypedResults.NotFound<object>(new { message = ex.Message });
                    }
                })
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status404NotFound)
            .Produces<UserEnvelope<PublicUserProfileDto>>()
            .WithTags("User")
            .WithName("GetPublicUserById")
            .RequireAuthorization()
            .IncludeInOpenApi();
        
        app.MapPost("/users/login",
                async Task<Results<BadRequest<object>, UnauthorizedHttpResult, Ok<AuthEnvelope<AuthDto>>>> (
                    IUserHandler userHandler,
                    IValidator<UserEnvelope<LoginUserDto>> validator,
                    UserEnvelope<LoginUserDto>? request,
                    HttpContext httpContext) =>
                {
                    if (request is null)
                    {
                        return TypedResults.BadRequest<object>(ValidationErrorResponse.MissingRequestBody());
                    }

                    var validationResult = await validator.ValidateAsync(request, httpContext.RequestAborted);

                    if (!validationResult.IsValid)
                    {
                        return TypedResults.BadRequest<object>(ValidationErrorResponse.From(validationResult));
                    }

                    try
                    {
                        var auth = await userHandler.LoginAsync(request.User, httpContext.RequestAborted);

                        return TypedResults.Ok(new AuthEnvelope<AuthDto>(auth));
                    }
                    catch (InvalidOperationException ex)
                    {
                        Log.Warning("Login failed: {Message}", ex.Message);

                        return TypedResults.Unauthorized();
                    }
                })
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces<AuthEnvelope<AuthDto>>()
            .WithTags("User")
            .WithName("LoginUser")
            .RequireRateLimiting("login")
            .IncludeInOpenApi();

        app.MapPost("/user", async Task<Results<BadRequest<object>, Conflict<object>, Ok<AuthenticatedUserEnvelope>>> (
                IUserHandler userHandler,
                IValidator<UserEnvelope<NewUserDto>> validator,
                UserEnvelope<NewUserDto>? request,
                HttpContext httpContext) =>
            {
                if (request is null)
                {
                    return TypedResults.BadRequest<object>(ValidationErrorResponse.MissingRequestBody());
                }

                var validationResult = await validator.ValidateAsync(request, httpContext.RequestAborted);

                if (!validationResult.IsValid)
                {
                    return TypedResults.BadRequest<object>(ValidationErrorResponse.From(validationResult));
                }

                try
                {
                    var result = await userHandler.CreateUserAsync(request.User, httpContext.RequestAborted);

                    return TypedResults.Ok(new AuthenticatedUserEnvelope(
                        result.Auth,
                        result.User
                    ));
                }
                catch (InvalidOperationException ex)
                {
                    return TypedResults.Conflict<object>(new { message = ex.Message });
                }
            })
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status409Conflict)
            .Produces<AuthenticatedUserEnvelope>()
            .WithTags("User")
            .WithName("CreateUser")
            .RequireRateLimiting("register")
            .IncludeInOpenApi();

        app.MapPut("/user", async Task<Results<UnauthorizedHttpResult, BadRequest<object>, Conflict<object>, Ok<UserEnvelope<UserProfileDto>>>> (
                IUserHandler userHandler,
                IValidator<UserEnvelope<UpdateUserDto>> validator,
                ClaimsPrincipal claimsPrincipal,
                UserEnvelope<UpdateUserDto>? request,
                HttpContext httpContext) =>
            {
                var idValue = claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);

                if (!Guid.TryParse(idValue, out var id))
                {
                    return TypedResults.Unauthorized();
                }

                if (request is null)
                {
                    return TypedResults.BadRequest<object>(ValidationErrorResponse.MissingRequestBody());
                }

                var validationResult = await validator.ValidateAsync(request, httpContext.RequestAborted);

                if (!validationResult.IsValid)
                {
                    return TypedResults.BadRequest<object>(ValidationErrorResponse.From(validationResult));
                }

                try
                {
                    var user = await userHandler.UpdateUserAsync(id, request.User, httpContext.RequestAborted);

                    return TypedResults.Ok(new UserEnvelope<UserProfileDto>(user));
                }
                catch (InvalidOperationException ex)
                {
                    return TypedResults.Conflict<object>(new { message = ex.Message });
                }
                catch (DbUpdateException)
                {
                    return TypedResults.Conflict<object>(new { message = "Username or email is already in use." });
                }
            })
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status409Conflict)
            .Produces<UserEnvelope<UserProfileDto>>()
            .WithTags("User")
            .WithName("UpdateUser")
            .RequireAuthorization()
            .IncludeInOpenApi();

        app.MapDelete("/user",
                async Task<Results<UnauthorizedHttpResult, NotFound<object>, NoContent>> (
                    IUserHandler userHandler,
                    ClaimsPrincipal claimsPrincipal,
                    HttpContext httpContext) =>
                {
                    var idValue = claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);

                    if (!Guid.TryParse(idValue, out var id))
                    {
                        return TypedResults.Unauthorized();
                    }

                    try
                    {
                        await userHandler.DeleteUserAsync(id, httpContext.RequestAborted);

                        return TypedResults.NoContent();
                    }
                    catch (InvalidOperationException ex)
                    {
                        return TypedResults.NotFound<object>(new { message = ex.Message });
                    }
                })
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status204NoContent)
            .WithTags("User")
            .WithName("DeleteUser")
            .RequireAuthorization()
            .IncludeInOpenApi();
    }
}