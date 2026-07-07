namespace LinkUp.Api.Features.Catalogs;

// Public (anonymous) read access to the admin-managed catalogs so clients can populate
// the registration / profile forms before the user is authenticated.
public class CatalogModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var catalogs = app.MapGroup("/catalogs").WithTags("Catalogs");

        catalogs.MapGet("/hobbies",
                async Task<Ok<List<CatalogItemDto>>> (ICatalogHandler handler, HttpContext httpContext) =>
                    TypedResults.Ok(await handler.GetHobbiesAsync(httpContext.RequestAborted)))
            .Produces<List<CatalogItemDto>>()
            .WithName("GetHobbies")
            .IncludeInOpenApi();

        catalogs.MapGet("/learning-goals",
                async Task<Ok<List<CatalogItemDto>>> (ICatalogHandler handler, HttpContext httpContext) =>
                    TypedResults.Ok(await handler.GetLearningGoalsAsync(httpContext.RequestAborted)))
            .Produces<List<CatalogItemDto>>()
            .WithName("GetLearningGoals")
            .IncludeInOpenApi();

        catalogs.MapGet("/tandem-forms",
                async Task<Ok<List<CatalogItemDto>>> (ICatalogHandler handler, HttpContext httpContext) =>
                    TypedResults.Ok(await handler.GetTandemFormsAsync(httpContext.RequestAborted)))
            .Produces<List<CatalogItemDto>>()
            .WithName("GetTandemForms")
            .IncludeInOpenApi();

        catalogs.MapGet("/tandem-frequencies",
                async Task<Ok<List<CatalogItemDto>>> (ICatalogHandler handler, HttpContext httpContext) =>
                    TypedResults.Ok(await handler.GetTandemFrequenciesAsync(httpContext.RequestAborted)))
            .Produces<List<CatalogItemDto>>()
            .WithName("GetTandemFrequencies")
            .IncludeInOpenApi();

        catalogs.MapGet("/languages",
                async Task<Ok<List<CatalogItemDto>>> (ICatalogHandler handler, HttpContext httpContext) =>
                    TypedResults.Ok(await handler.GetLanguagesAsync(httpContext.RequestAborted)))
            .Produces<List<CatalogItemDto>>()
            .WithName("GetLanguages")
            .IncludeInOpenApi();
    }
}