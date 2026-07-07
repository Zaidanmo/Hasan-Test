using Microsoft.Extensions.Caching.Memory;
using LinkUp.Core.Entities;
using LinkUp.Core.Interfaces;

namespace LinkUp.Api.Features.Catalogs;

/*
    Caches the 5 different catalogs via admin endpoints as asking the DB for it
    everytime is very costly.
    
    Made the backend run WAAAAY faster. 
*/
public interface ICatalogCache
{
    Task<IReadOnlyList<CatalogItemDto>> GetActiveAsync<T>(CancellationToken cancellationToken) where T : CatalogEntity;

    Task<bool> ActiveCodeExistsAsync<T>(string? code, CancellationToken cancellationToken) where T : CatalogEntity;

    Task<bool> AllActiveCodesExistAsync<T>(IEnumerable<string>? codes, CancellationToken cancellationToken) where T : CatalogEntity;

    Task<IReadOnlyDictionary<int, string>> GetIdToCodeAsync<T>(CancellationToken cancellationToken) where T : CatalogEntity;
}

public sealed class CatalogCache : ICatalogCache
{
    private static readonly MemoryCacheEntryOptions CacheOptions =
        new() { AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1) };

    private readonly IMemoryCache _cache;
    private readonly ILinkUpRepository _repository;

    public CatalogCache(IMemoryCache cache, ILinkUpRepository repository)
    {
        _cache = cache;
        _repository = repository;
    }

    public async Task<IReadOnlyList<CatalogItemDto>> GetActiveAsync<T>(CancellationToken cancellationToken)
        where T : CatalogEntity
        => (await GetSnapshotAsync<T>(cancellationToken)).ActiveItems;

    public async Task<bool> ActiveCodeExistsAsync<T>(string? code, CancellationToken cancellationToken)
        where T : CatalogEntity
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return false;
        }

        var snapshot = await GetSnapshotAsync<T>(cancellationToken);
        return snapshot.ActiveCodes.Contains(code.Trim());
    }

    public async Task<bool> AllActiveCodesExistAsync<T>(IEnumerable<string>? codes, CancellationToken cancellationToken)
        where T : CatalogEntity
    {
        var distinct = (codes ?? Enumerable.Empty<string>())
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Select(code => code.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (distinct.Count == 0)
        {
            return false;
        }

        var snapshot = await GetSnapshotAsync<T>(cancellationToken);
        return distinct.All(snapshot.ActiveCodes.Contains);
    }

    public async Task<IReadOnlyDictionary<int, string>> GetIdToCodeAsync<T>(CancellationToken cancellationToken)
        where T : CatalogEntity
        => (await GetSnapshotAsync<T>(cancellationToken)).IdToCode;

    private Task<CatalogSnapshot> GetSnapshotAsync<T>(CancellationToken cancellationToken)
        where T : CatalogEntity
        => _cache.GetOrCreateAsync(typeof(T), async entry =>
        {
            entry.SetOptions(CacheOptions);
            var all = await _repository.GetAllCatalogAsync<T>(cancellationToken);
            return CatalogSnapshot.From(all);
        })!;

    private sealed record CatalogSnapshot(
        IReadOnlyList<CatalogItemDto> ActiveItems,
        IReadOnlySet<string> ActiveCodes,
        IReadOnlyDictionary<int, string> IdToCode)
    {
        public static CatalogSnapshot From<T>(IReadOnlyCollection<T> all) where T : CatalogEntity
            => new(
                all.Where(entry => entry.IsActive)
                    .OrderBy(entry => entry.SortOrder)
                    .Select(entry => new CatalogItemDto(entry.Code, entry.DisplayName))
                    .ToList(),
                all.Where(entry => entry.IsActive)
                    .Select(entry => entry.Code)
                    .ToHashSet(StringComparer.OrdinalIgnoreCase),
                all.ToDictionary(entry => entry.Id, entry => entry.Code));
    }
}
