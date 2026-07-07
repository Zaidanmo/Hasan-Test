namespace LinkUp.Api.Features.Matching;

public class MatchingModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet("/matches", async (
                IMatchingHandler matchingHandler,
                ClaimsPrincipal claimsPrincipal,
                HttpContext httpContext,
                int page = 1,
                int pageSize = 20) =>
            {
                var idValue = claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);

                if (!Guid.TryParse(idValue, out var userId))
                {
                    return Results.Unauthorized();
                }

                var matches = await matchingHandler.GetMatchesAsync(
                    userId,
                    page,
                    pageSize,
                    httpContext.RequestAborted);

                return Results.Ok(matches);
            })
            .Produces<PagedResult<MatchDto>>()
            .WithTags("Matching")
            .WithName("GetMatches")
            .RequireAuthorization()
            .IncludeInOpenApi();
        
        app.MapGet("/matches/mutual", async Task<Results<UnauthorizedHttpResult, Ok<List<MutualMatchDto>>>> (
                IMatchingHandler matchingHandler,
                ClaimsPrincipal claimsPrincipal,
                HttpContext httpContext) =>
            {
                var idValue = claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);

                if (!Guid.TryParse(idValue, out var userId))
                {
                    return TypedResults.Unauthorized();
                }

                var mutualMatches = await matchingHandler.GetMutualMatchesAsync(
                    userId,
                    httpContext.RequestAborted);

                return TypedResults.Ok(mutualMatches);
            })
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces<List<MutualMatchDto>>()
            .WithTags("Matching")
            .WithName("GetMutualMatches")
            .RequireAuthorization()
            .RequireRateLimiting("authenticated")
            .IncludeInOpenApi();
        
        app.MapPost("/matches/{favoriteUserId:guid}/favorite",
                async Task<Results<
                    UnauthorizedHttpResult,
                    BadRequest<object>,
                    NotFound<object>,
                    Ok<FavoriteResultDto>>> (
                    IMatchingHandler matchingHandler,
                    ClaimsPrincipal claimsPrincipal,
                    Guid favoriteUserId,
                    HttpContext httpContext) =>
                {
                    var idValue = claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);

                    if (!Guid.TryParse(idValue, out var userId))
                    {
                        return TypedResults.Unauthorized();
                    }

                    try
                    {
                        var result = await matchingHandler.FavoriteUserAsync(
                            userId,
                            favoriteUserId,
                            httpContext.RequestAborted);

                        return TypedResults.Ok(result);
                    }
                    catch (InvalidOperationException ex)
                    {
                        if (ex.Message.Contains("yourself", StringComparison.OrdinalIgnoreCase))
                        {
                            return TypedResults.BadRequest<object>(new { message = ex.Message });
                        }

                        return TypedResults.NotFound<object>(new { message = ex.Message });
                    }
                })
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces<FavoriteResultDto>()
            .WithTags("Matching")
            .WithName("FavoriteUser")
            .RequireAuthorization()
            .RequireRateLimiting("authenticated")
            .IncludeInOpenApi();
    }
}