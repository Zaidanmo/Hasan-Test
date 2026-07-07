namespace LinkUp.Core.Entities;

public class UserFavorite
{
    private UserFavorite() { }

    public UserFavorite(Guid userId, Guid favoriteUserId)
    {
        if (userId == favoriteUserId)
        {
            throw new InvalidOperationException("A user cannot favorite themselves.");
        }

        UserId = userId;
        FavoriteUserId = favoriteUserId;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid UserId { get; private set; }

    public Guid FavoriteUserId { get; private set; }

    public DateTime CreatedAt { get; private set; }

    public User User { get; private set; } = null!;

    public User FavoriteUser { get; private set; } = null!;
}