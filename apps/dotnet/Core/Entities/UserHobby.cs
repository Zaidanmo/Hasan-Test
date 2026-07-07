namespace LinkUp.Core.Entities;

public class UserHobby
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public int HobbyId { get; set; }
    public Hobby Hobby { get; set; } = null!;
}