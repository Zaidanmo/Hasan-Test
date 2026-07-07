namespace LinkUp.Api.Features.Catalogs;

public interface ICatalogHandler
{
    Task<List<CatalogItemDto>> GetHobbiesAsync(CancellationToken cancellationToken);
    Task<List<CatalogItemDto>> GetLearningGoalsAsync(CancellationToken cancellationToken);
    Task<List<CatalogItemDto>> GetTandemFormsAsync(CancellationToken cancellationToken);
    Task<List<CatalogItemDto>> GetTandemFrequenciesAsync(CancellationToken cancellationToken);
    Task<List<CatalogItemDto>> GetLanguagesAsync(CancellationToken cancellationToken);
}