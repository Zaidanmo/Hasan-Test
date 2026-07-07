using LinkUp.Core.Entities;

namespace LinkUp.Api.Features.Matching;

public sealed class MatchDto
{
    public Guid UserId { get; set; }

    public string Username { get; set; } = null!;

    public string? FirstName { get; set; }

    public string? Surname { get; set; }

    public string? Degree { get; set; } 

    public string? Country { get; set; }

    public string? MotherLanguage { get; set; }

    public UserLanguage TargetLanguage { get; set; } = null!;

    public string TandemForm { get; set; } = null!;

    public string TandemFrequency { get; set; } = null!;

    public string Bio { get; set; } = string.Empty;

    public bool HasProfilePicture { get; set; }

    public int MatchScore { get; set; }

    public int LanguageScore { get; set; }

    public int HobbyScore { get; set; }

    public int LearningGoalScore { get; set; }

    public int TandemPreferenceScore { get; set; }

    public List<string> CommonHobbies { get; set; } = new();

    public List<string> CommonLearningGoals { get; set; } = new();

    public List<string> Reasons { get; set; } = new();
    
    public bool IsLikedByCurrentUser { get; set; }

    public bool IsMutualMatch { get; set; }
}

public sealed class MutualMatchDto
{
    public Guid UserId { get; set; }

    public string Username { get; set; } = null!;

    public string? FirstName { get; set; }

    public string? Surname { get; set; }

    public string? Degree { get; set; }

    public string? Country { get; set; }

    public bool IsMutualMatch { get; set; } = true;
}

public sealed class FavoriteResultDto
{
    public Guid FavoriteUserId { get; set; }

    public bool IsMatch { get; set; }

    public string Message { get; set; } = null!;
}