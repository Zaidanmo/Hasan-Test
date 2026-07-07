using LinkUp.Core.Entities;

namespace LinkUp.Api.Features.Catalogs;

public sealed class CatalogHandler : ICatalogHandler
{
    private readonly ICatalogCache _catalogCache;

    public CatalogHandler(ICatalogCache catalogCache)
    {
        _catalogCache = catalogCache;
    }

    public Task<List<CatalogItemDto>> GetHobbiesAsync(CancellationToken cancellationToken)
        => GetCatalogAsync<Hobby>(cancellationToken);

    public Task<List<CatalogItemDto>> GetLearningGoalsAsync(CancellationToken cancellationToken)
        => GetCatalogAsync<LearningGoal>(cancellationToken);

    public Task<List<CatalogItemDto>> GetTandemFormsAsync(CancellationToken cancellationToken)
        => GetCatalogAsync<TandemForm>(cancellationToken);

    public Task<List<CatalogItemDto>> GetTandemFrequenciesAsync(CancellationToken cancellationToken)
        => GetCatalogAsync<TandemFrequency>(cancellationToken);

    public Task<List<CatalogItemDto>> GetLanguagesAsync(CancellationToken cancellationToken)
        => GetCatalogAsync<Language>(cancellationToken);

    private async Task<List<CatalogItemDto>> GetCatalogAsync<T>(CancellationToken cancellationToken)
        where T : CatalogEntity
    {
        var entries = await _catalogCache.GetActiveAsync<T>(cancellationToken);

        return entries.ToList();
    }
}
