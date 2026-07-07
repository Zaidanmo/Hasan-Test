namespace LinkUp.Api.Features.Matching;

public interface IMatchingHandler
{
    Task<PagedResult<MatchDto>> GetMatchesAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
    
    Task<List<MutualMatchDto>> GetMutualMatchesAsync(Guid userId, CancellationToken cancellationToken);

    Task<FavoriteResultDto> FavoriteUserAsync(Guid userId, Guid favoriteUserId, CancellationToken cancellationToken);
}