using LinkUp.Core.Interfaces;

namespace LinkUp.Core.Entities;

public class UserKnownLanguage
{
    public Guid UserId { get; set; }

    public int LanguageId { get; set; }

    public Language Language { get; set; } = null!;

    public LanguageLevel Level { get; set; }

    public int LevelRank { get; set; }

    public User User { get; set; } = null!;
}
