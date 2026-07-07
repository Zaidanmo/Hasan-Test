using LinkUp.Core.Interfaces;

namespace LinkUp.Api.Features.ProfilePictures;

public class ProfilePictureModule : ICarterModule
{
    private const long MaxUploadBytes = 5 * 1024 * 1024;

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/user/profile-picture",
                async Task<Results<UnauthorizedHttpResult, BadRequest<object>, Ok>> (
                    IProfilePictureHandler handler,
                    ClaimsPrincipal claimsPrincipal,
                    IFormFile? file,
                    HttpContext httpContext) =>
                {
                    if (!Guid.TryParse(claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier), out var id))
                    {
                        return TypedResults.Unauthorized();
                    }

                    if (file is null || file.Length == 0)
                    {
                        return TypedResults.BadRequest<object>(new { message = "No image file was uploaded." });
                    }

                    if (file.Length > MaxUploadBytes)
                    {
                        return TypedResults.BadRequest<object>(new { message = "Image is too large (max 5 MB)." });
                    }

                    try
                    {
                        await using var stream = file.OpenReadStream();
                        await handler.UploadAsync(id, stream, file.Length, httpContext.RequestAborted);

                        return TypedResults.Ok();
                    }
                    catch (ProfilePictureValidationException ex)
                    {
                        return TypedResults.BadRequest<object>(new { message = ex.Message });
                    }
                })
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status200OK)
            .WithTags("Profile Picture")
            .WithName("UploadProfilePicture")
            .RequireAuthorization()
            .DisableAntiforgery()
            .IncludeInOpenApi();

        app.MapGet("/users/{userId:guid}/profile-picture",
                async Task<Results<UnauthorizedHttpResult, NotFound, PhysicalFileHttpResult>> (
                    IProfilePictureHandler handler,
                    ClaimsPrincipal claimsPrincipal,
                    Guid userId,
                    HttpContext httpContext) =>
                {
                    if (!Guid.TryParse(claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier), out _))
                    {
                        return TypedResults.Unauthorized();
                    }

                    var path = await handler.GetFilePathAsync(userId, httpContext.RequestAborted);

                    if (path is null)
                    {
                        return TypedResults.NotFound();
                    }

                    httpContext.Response.Headers["X-Content-Type-Options"] = "nosniff";
                    return TypedResults.PhysicalFile(path, "image/webp");
                })
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK, contentType: "image/webp")
            .WithTags("Profile Picture")
            .WithName("GetProfilePicture")
            .RequireAuthorization()
            .IncludeInOpenApi();

        app.MapDelete("/user/profile-picture",
                async Task<Results<UnauthorizedHttpResult, NoContent>> (
                    IProfilePictureHandler handler,
                    ClaimsPrincipal claimsPrincipal,
                    HttpContext httpContext) =>
                {
                    if (!Guid.TryParse(claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier), out var id))
                    {
                        return TypedResults.Unauthorized();
                    }

                    await handler.DeleteAsync(id, httpContext.RequestAborted);

                    return TypedResults.NoContent();
                })
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status204NoContent)
            .WithTags("Profile Picture")
            .WithName("DeleteProfilePicture")
            .RequireAuthorization()
            .IncludeInOpenApi();
    }
}
