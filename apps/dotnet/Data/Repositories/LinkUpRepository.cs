using Microsoft.EntityFrameworkCore;
using LinkUp.Core.Entities;
using LinkUp.Core.Interfaces;
using LinkUp.Data.Contexts;

namespace LinkUp.Data.Repositories;

public class LinkUpRepository : ILinkUpRepository
{
    private readonly LinkUpContext _dbContext;

    public LinkUpRepository(LinkUpContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public Task<bool> UserExistsByEmailOrUsernameAsync(string email, string username, CancellationToken cancellationToken)
    {
        var normalizedEmail = NormalizeEmail(email);
        var normalizedUsername = NormalizeUsername(username);

        return _dbContext.Users.AnyAsync(
            x => EF.Functions.Collate(x.Email, "NOCASE") == normalizedEmail ||
                 EF.Functions.Collate(x.Username, "NOCASE") == normalizedUsername,
            cancellationToken);
    }

    public Task<bool> UserExistsByUsernameAsync(string username, CancellationToken cancellationToken)
    {
        var normalizedUsername = NormalizeUsername(username);
        
        return _dbContext.Users.AnyAsync(
            x => EF.Functions.Collate(x.Username, "NOCASE") == normalizedUsername,
            cancellationToken);
    }
    
    public Task<bool> UserExistsByEmailAsync(string email, CancellationToken cancellationToken)
    {
        var normalizedUsername = NormalizeEmail(email);
        
        return _dbContext.Users.AnyAsync(
            x => EF.Functions.Collate(x.Email, "NOCASE") == normalizedUsername,
            cancellationToken);
    }

    public Task<bool> UserExistsByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return _dbContext.Users
            .AnyAsync(x => x.Id == id, cancellationToken);
    }
    
    public Task<User?> GetUserByIdReadOnlyAsync(Guid id, CancellationToken cancellationToken)
    {
        return IncludeCatalogNavigations(_dbContext.Users.AsNoTracking())
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public Task<User?> GetUserByEmailAsync(string email, CancellationToken cancellationToken)
    {
        var normalizedEmail = NormalizeEmail(email);

        return _dbContext.Users.FirstOrDefaultAsync(
            x => EF.Functions.Collate(x.Email, "NOCASE") == normalizedEmail,
            cancellationToken);
    }

    public Task<User?> GetUserByUsernameAsync(string username, CancellationToken cancellationToken)
    {
        var normalizedUsername = NormalizeUsername(username);

        return _dbContext.Users.FirstOrDefaultAsync(
            x => EF.Functions.Collate(x.Username, "NOCASE") == normalizedUsername,
            cancellationToken);
    }

    public Task<User?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return IncludeCatalogNavigations(_dbContext.Users)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public Task<string?> GetProfilePictureFileNameAsync(Guid userId, CancellationToken cancellationToken)
    {
        return _dbContext.Users
            .Where(user => user.Id == userId)
            .Select(user => user.ProfilePictureFileName)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task SetProfilePictureFileNameAsync(Guid userId, string? fileName, CancellationToken cancellationToken)
    {
        return _dbContext.Users
            .Where(user => user.Id == userId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(user => user.ProfilePictureFileName, fileName), cancellationToken);
    }

    public async Task AddUserAsync(User user, CancellationToken cancellationToken)
        => await _dbContext.Users.AddAsync(user, cancellationToken);
    
    public Task DeleteUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        return _dbContext.Users
            .Where(user => user.Id == userId)
            .ExecuteDeleteAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
        => _dbContext.SaveChangesAsync(cancellationToken);

    
    public Task<List<User>> GetCandidateUsersForMatchingAsync(
        Guid currentUserId,
        int targetLanguageId,
        LanguageLevel targetLevel,
        CancellationToken cancellationToken)
    {
        if (targetLanguageId <= 0)
        {
            return Task.FromResult(new List<User>());
        }

        var requiredLevelRank = (int)targetLevel;

        var nativeSpeakerIds = _dbContext.Users
            .AsNoTracking()
            .Where(user =>
                user.Id != currentUserId &&
                user.MotherLanguageId == targetLanguageId)
            .Select(user => user.Id);

        var knownLanguageUserIds = _dbContext.UserKnownLanguages
            .AsNoTracking()
            .Where(knownLanguage =>
                knownLanguage.UserId != currentUserId &&
                knownLanguage.LanguageId == targetLanguageId &&
                knownLanguage.LevelRank >= requiredLevelRank)
            .Select(knownLanguage => knownLanguage.UserId);

        var candidateUserIds = nativeSpeakerIds.Union(knownLanguageUserIds);

        return IncludeMatchingNavigations(_dbContext.Users.AsNoTracking())
            .Where(user => candidateUserIds.Contains(user.Id))
            .ToListAsync(cancellationToken);
    }

    public Task<bool> UserFavoriteExistsAsync(Guid userId, Guid favoriteUserId, CancellationToken cancellationToken)
    {
        return _dbContext.UserFavorites
            .AnyAsync(x =>
                    x.UserId == userId &&
                    x.FavoriteUserId == favoriteUserId,
                cancellationToken);
    }

    public Task<bool> MutualFavoriteExistsAsync(Guid userId, Guid favoriteUserId, CancellationToken cancellationToken)
    {
        return _dbContext.UserFavorites
            .AnyAsync(x =>
                    x.UserId == favoriteUserId &&
                    x.FavoriteUserId == userId,
                cancellationToken);
    }

    public async Task AddUserFavoriteAsync(UserFavorite userFavorite, CancellationToken cancellationToken)
    {
        await _dbContext.UserFavorites.AddAsync(userFavorite, cancellationToken);
    }

    public Task<List<Guid>> GetFavoriteUserIdsByUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        return _dbContext.UserFavorites
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => x.FavoriteUserId)
            .ToListAsync(cancellationToken);
    }

    public Task<List<User>> GetMutualFavoriteUsersByUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var mutualFavoriteUserIds = _dbContext.UserFavorites
            .AsNoTracking()
            .Where(favorite =>
                favorite.UserId == userId &&
                _dbContext.UserFavorites.Any(reverseFavorite =>
                    reverseFavorite.UserId == favorite.FavoriteUserId &&
                    reverseFavorite.FavoriteUserId == userId))
            .Select(favorite => favorite.FavoriteUserId);

        return _dbContext.Users
            .AsNoTracking()
            .Where(user => mutualFavoriteUserIds.Contains(user.Id))
            .OrderBy(user => user.Username)
            .ToListAsync(cancellationToken);
    }

    public Task<List<Guid>> GetUserIdsWhoFavoritedUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        return _dbContext.UserFavorites
            .AsNoTracking()
            .Where(x => x.FavoriteUserId == userId)
            .Select(x => x.UserId)
            .ToListAsync(cancellationToken);
    }

    public Task<List<T>> GetActiveCatalogByCodesAsync<T>(IReadOnlyCollection<string> codes, CancellationToken cancellationToken)
        where T : CatalogEntity
    {
        if (codes.Count == 0)
        {
            return Task.FromResult(new List<T>());
        }

        var codeList = codes.ToList();

        return _dbContext.Set<T>()
            .Where(entry => entry.IsActive && codeList.Contains(entry.Code))
            .ToListAsync(cancellationToken);
    }

    public Task<List<T>> GetActiveCatalogAsync<T>(CancellationToken cancellationToken)
        where T : CatalogEntity
    {
        return _dbContext.Set<T>()
            .AsNoTracking()
            .Where(entry => entry.IsActive)
            .OrderBy(entry => entry.SortOrder)
            .ToListAsync(cancellationToken);
    }

    public Task<List<T>> GetAllCatalogAsync<T>(CancellationToken cancellationToken)
        where T : CatalogEntity
    {
        return _dbContext.Set<T>()
            .AsNoTracking()
            .OrderBy(entry => entry.SortOrder)
            .ToListAsync(cancellationToken);
    }

    private static IQueryable<User> IncludeCatalogNavigations(IQueryable<User> query)
    {
        return query
            .Include(user => user.MotherLanguage)
            .Include(user => user.TargetLanguage)
            .Include(user => user.KnownLanguages)
                .ThenInclude(knownLanguage => knownLanguage.Language)
            .Include(user => user.UserHobbies)
                .ThenInclude(userHobby => userHobby.Hobby)
            .Include(user => user.UserLearningGoals)
                .ThenInclude(userLearningGoal => userLearningGoal.LearningGoal)
            .Include(user => user.TandemForm)
            .Include(user => user.TandemFrequency)
            .AsSplitQuery();
    }

    // Speeds up querying by quite a bit
    private static IQueryable<User> IncludeMatchingNavigations(IQueryable<User> query)
    {
        return query
            .Include(user => user.UserHobbies)
            .Include(user => user.UserLearningGoals)
            .Include(user => user.KnownLanguages)
            .AsSplitQuery();
    }

    #region Normalization of Data
    private static string NormalizeEmail(string? email)
        => string.IsNullOrWhiteSpace(email)
            ? string.Empty
            : email.Trim().ToLowerInvariant();

    private static string NormalizeUsername(string? username)
        => string.IsNullOrWhiteSpace(username)
            ? string.Empty
            : username.Trim();
    #endregion
}