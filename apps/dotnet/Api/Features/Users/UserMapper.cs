using LinkUp.Core.DTOs;
using LinkUp.Core.Entities;

namespace LinkUp.Api.Features.Users;

public class UserMapper
{
    public static AuthDto ToAuthDto(User user, string token)
    {
        return new AuthDto(
            user.Id,
            user.Username,
            user.Email,
            token
        );
    }

    public static UserProfileDto ToUserProfileDto(User user)
    {
        return new UserProfileDto(
            user.Bio,
            user.ContactEmail,
            user.FirstName,
            user.Surname,
            user.TelephoneNumber,
            user.Degree,
            user.Country,
            user.MotherLanguage.Code,
            ToUserLanguages(user),
            ToTargetLanguage(user),
            ToHobbyCodes(user),
            user.DistinctHobby,
            user.TandemForm.Code,
            ToLearningGoalCodes(user),
            user.TandemFrequency.Code,
            user.ProfilePictureFileName is not null
        );
    }

    public static PublicUserProfileDto ToPublicUserProfileDto(User user)
    {
        return new PublicUserProfileDto(
            user.Id,
            user.Username,
            user.ContactEmail,
            user.Bio,
            user.FirstName,
            user.Surname,
            user.Degree,
            user.Country,
            user.MotherLanguage.Code,
            ToUserLanguages(user),
            ToTargetLanguage(user),
            ToHobbyCodes(user),
            user.DistinctHobby,
            user.TandemForm.Code,
            ToLearningGoalCodes(user),
            user.TandemFrequency.Code,
            user.ProfilePictureFileName is not null
        );
    }

    private static List<UserLanguage> ToUserLanguages(User user)
    {
        return user.KnownLanguages
            .OrderBy(known => known.Language.SortOrder)
            .Select(known => new UserLanguage
            {
                Language = known.Language.Code,
                Level = known.Level
            })
            .ToList();
    }

    private static UserLanguage ToTargetLanguage(User user)
    {
        return new UserLanguage
        {
            Language = user.TargetLanguage.Code,
            Level = user.TargetLanguageLevel
        };
    }

    private static List<string> ToHobbyCodes(User user)
    {
        return user.UserHobbies
            .OrderBy(x => x.Hobby.SortOrder)
            .Select(x => x.Hobby.Code)
            .ToList();
    }

    private static List<string> ToLearningGoalCodes(User user)
    {
        return user.UserLearningGoals
            .OrderBy(x => x.LearningGoal.SortOrder)
            .Select(x => x.LearningGoal.Code)
            .ToList();
    }
}
