using System.ComponentModel.DataAnnotations;
using LinkUp.Core.Entities;

namespace LinkUp.Core.DTOs;

public record NewUserDto(
    [Required] string Username,
    [Required][EmailAddress] string Email,
    [Required][EmailAddress] string ContactEmail,
    string? Bio,
    [Required] string Password,
    [Required] string FirstName,
    [Required] string Surname,
    string? TelephoneNumber,
    [Required] string Degree,
    [Required] string Country,
    [Required] string MotherLanguage,
    [Required] List<UserLanguage> Languages,
    [Required] UserLanguage TargetLanguage,
    [Required] List<string> Hobbies,
    string? DistinctHobby,
    [Required] string TandemForm,
    [Required] List<string> LearningGoals,
    [Required] string TandemFrequency
);

public record LoginUserDto(
    [Required][EmailAddress] string Email,
    [Required] string Password
);

// They are all nullable as the user can change only one attribute and not necessarily all.
public record UpdateUserDto(
    string? Username,
    [EmailAddress] string? Email,
    [EmailAddress] string? ContactEmail,
    string? Bio,
    string? Password,
    string? FirstName,
    string? Surname,
    string? TelephoneNumber,
    string? Degree,
    string? Country,
    string? MotherLanguage,
    List<UserLanguage>? Languages,
    UserLanguage? TargetLanguage,
    List<string>? Hobbies,
    string? DistinctHobby,
    string? TandemForm,
    List<string>? LearningGoals,
    string? TandemFrequency
);

public record AuthDto(
    Guid Id,
    string Username,
    string Email,
    string Token
);

public record UserProfileDto(
    string Bio,
    string ContactEmail,
    string FirstName,
    string Surname,
    string TelephoneNumber,
    string Degree,
    string Country,
    string MotherLanguage,
    List<UserLanguage> Languages,
    UserLanguage TargetLanguage,
    List<string> Hobbies,
    string DistinctHobby,
    string TandemForm,
    List<string> LearningGoals,
    string TandemFrequency,
    bool HasProfilePicture
);

public record PublicUserProfileDto(
    Guid Id,
    string Username,
    string ContactEmail,
    string Bio,
    string FirstName,
    string Surname,
    string Degree,
    string Country,
    string MotherLanguage,
    List<UserLanguage> Languages,
    UserLanguage TargetLanguage,
    List<string> Hobbies,
    string DistinctHobby,
    string TandemForm,
    List<string> LearningGoals,
    string TandemFrequency,
    bool HasProfilePicture
);

public record AuthenticatedUserDto(
    AuthDto Auth,
    UserProfileDto User
);
