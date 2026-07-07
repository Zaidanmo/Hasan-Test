using LinkUp.Core.Entities;

namespace LinkUp.Core.Interfaces;

public interface ILinkUpRepository
{
    Task<bool> UserExistsByEmailOrUsernameAsync(string email, string username, CancellationToken cancellationToken);
    
    Task<bool> UserExistsByUsernameAsync(string username, CancellationToken cancellationToken);
    Task<bool> UserExistsByEmailAsync(string email, CancellationToken cancellationToken);
    
    Task<bool> UserExistsByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<User?> GetUserByIdReadOnlyAsync(Guid id, CancellationToken cancellationToken);


    Task<User?> GetUserByEmailAsync(string email, CancellationToken cancellationToken);
    Task<User?> GetUserByUsernameAsync(string username, CancellationToken cancellationToken);
    Task<User?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<string?> GetProfilePictureFileNameAsync(Guid userId, CancellationToken cancellationToken);
    Task SetProfilePictureFileNameAsync(Guid userId, string? fileName, CancellationToken cancellationToken);

    Task AddUserAsync(User user, CancellationToken cancellationToken);

    Task DeleteUserAsync(Guid userId, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);

    Task<List<User>> GetCandidateUsersForMatchingAsync(Guid userId, int targetLanguageId, LanguageLevel targetLevel, CancellationToken cancellationToken);

    Task<bool> UserFavoriteExistsAsync(Guid userId, Guid favoriteUserId, CancellationToken cancellationToken);

    Task<bool> MutualFavoriteExistsAsync(Guid userId, Guid favoriteUserId, CancellationToken cancellationToken);

    Task AddUserFavoriteAsync(UserFavorite userFavorite, CancellationToken cancellationToken);

    Task<List<Guid>> GetFavoriteUserIdsByUserAsync(Guid userId, CancellationToken cancellationToken);

    Task<List<Guid>> GetUserIdsWhoFavoritedUserAsync(Guid userId, CancellationToken cancellationToken);

    Task<List<User>> GetMutualFavoriteUsersByUserAsync(Guid userId, CancellationToken cancellationToken);

    // Catalog lookups (Hobby, LearningGoal, TandemForm, TandemFrequency).
    Task<List<T>> GetActiveCatalogByCodesAsync<T>(IReadOnlyCollection<string> codes, CancellationToken cancellationToken)
        where T : CatalogEntity;

    Task<List<T>> GetActiveCatalogAsync<T>(CancellationToken cancellationToken)
        where T : CatalogEntity;

    Task<List<T>> GetAllCatalogAsync<T>(CancellationToken cancellationToken)
        where T : CatalogEntity;
}