using LinkUp.Core.DTOs;
using LinkUp.Core.Interfaces;

namespace LinkUp.Core.Entities;

public class User
{
    public User() { }
    public User(
        NewUserDto newUserDto,
        string passwordHash,
        Language motherLanguage,
        Language targetLanguage,
        LanguageLevel targetLanguageLevel,
        IReadOnlyCollection<(Language Language, LanguageLevel Level)> knownLanguages,
        TandemForm tandemForm,
        TandemFrequency tandemFrequency,
        IReadOnlyCollection<Hobby> hobbies,
        IReadOnlyCollection<LearningGoal> learningGoals)
    {
        // Core Attributes //
        Username = newUserDto.Username;
        Email = newUserDto.Email;
        ContactEmail = newUserDto.ContactEmail;
        Bio = newUserDto.Bio ?? string.Empty;
        Password = passwordHash;

        // Personal Attributes //
        FirstName = newUserDto.FirstName;
        Surname = newUserDto.Surname;
        TelephoneNumber = newUserDto.TelephoneNumber ?? string.Empty;
        Degree = newUserDto.Degree;
        Country = newUserDto.Country;

        DistinctHobby = newUserDto.DistinctHobby ?? string.Empty;

        // Matching-Algorithm Attributes //
        SetMotherLanguage(motherLanguage);
        SetTargetLanguage(targetLanguage, targetLanguageLevel);
        SetKnownLanguages(knownLanguages);
        SetTandemForm(tandemForm);
        SetTandemFrequency(tandemFrequency);
        SetHobbies(hobbies);
        SetLearningGoals(learningGoals);
    }

    // Core Attributes //
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string ContactEmail { get; set; } = null!;
    public string Bio { get; set; } = null!;
    public string Password { get; set; } = null!;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow.AddTicks(-(DateTime.UtcNow.Ticks % TimeSpan.TicksPerSecond));

    public string? ProfilePictureFileName { get; set; }

    // Personal Attributes //
    public string FirstName { get; set; } = null!;
    public string Surname { get; set; } = null!;
    public string TelephoneNumber { get; set; } = null!;
    public string Degree { get; set; } = null!;
    public string Country { get; set; } = null!;

    // Matching-Algorithm Attributes //
    public int MotherLanguageId { get; set; }
    public Language MotherLanguage { get; set; } = null!;

    public ICollection<UserKnownLanguage> KnownLanguages { get; set; } = new List<UserKnownLanguage>();

    public int TargetLanguageId { get; set; }
    public LanguageLevel TargetLanguageLevel { get; set; }
    public Language TargetLanguage { get; set; } = null!;

    public ICollection<UserHobby> UserHobbies { get; set; } = new List<UserHobby>();
    public string DistinctHobby { get; set; } = null!;

    public int TandemFormId { get; set; }
    public TandemForm TandemForm { get; set; } = null!;

    public ICollection<UserLearningGoal> UserLearningGoals { get; set; } = new List<UserLearningGoal>();

    public int TandemFrequencyId { get; set; }
    public TandemFrequency TandemFrequency { get; set; } = null!;

    // Methods //

    public void UpdateUser(
        UpdateUserDto updatedUserDto,
        string? passwordHash = null,
        Language? motherLanguage = null,
        Language? targetLanguage = null,
        LanguageLevel? targetLanguageLevel = null,
        IReadOnlyCollection<(Language Language, LanguageLevel Level)>? knownLanguages = null,
        TandemForm? tandemForm = null,
        TandemFrequency? tandemFrequency = null,
        IReadOnlyCollection<Hobby>? hobbies = null,
        IReadOnlyCollection<LearningGoal>? learningGoals = null)
    {
        if (updatedUserDto.Username is not null)
        {
            Username = updatedUserDto.Username;
        }

        if (updatedUserDto.Email is not null)
        {
            Email = updatedUserDto.Email;
        }

        if (updatedUserDto.ContactEmail is not null)
        {
            ContactEmail = updatedUserDto.ContactEmail;
        }

        if (passwordHash is not null)
        {
            Password = passwordHash;
        }

        if (updatedUserDto.Bio is not null)
        {
            Bio = updatedUserDto.Bio;
        }

        if (updatedUserDto.FirstName is not null)
        {
            FirstName = updatedUserDto.FirstName;
        }

        if (updatedUserDto.Surname is not null)
        {
            Surname = updatedUserDto.Surname;
        }

        if (updatedUserDto.TelephoneNumber is not null)
        {
            TelephoneNumber = updatedUserDto.TelephoneNumber;
        }

        if (updatedUserDto.Degree is not null)
        {
            Degree = updatedUserDto.Degree;
        }

        if (updatedUserDto.Country is not null)
        {
            Country = updatedUserDto.Country;
        }

        if (updatedUserDto.DistinctHobby is not null)
        {
            DistinctHobby = updatedUserDto.DistinctHobby;
        }

        if (motherLanguage is not null)
        {
            SetMotherLanguage(motherLanguage);
        }

        if (targetLanguage is not null && targetLanguageLevel is not null)
        {
            SetTargetLanguage(targetLanguage, targetLanguageLevel.Value);
        }

        if (knownLanguages is not null)
        {
            SetKnownLanguages(knownLanguages);
        }

        if (tandemForm is not null)
        {
            SetTandemForm(tandemForm);
        }

        if (tandemFrequency is not null)
        {
            SetTandemFrequency(tandemFrequency);
        }

        if (hobbies is not null)
        {
            SetHobbies(hobbies);
        }

        if (learningGoals is not null)
        {
            SetLearningGoals(learningGoals);
        }
    }

    private void SetMotherLanguage(Language language)
    {
        MotherLanguage = language;
        MotherLanguageId = language.Id;
    }

    private void SetTargetLanguage(Language language, LanguageLevel level)
    {
        TargetLanguage = language;
        TargetLanguageId = language.Id;
        TargetLanguageLevel = level;
    }

    // Reconciles in place (remove dropped, add new, update the level on retained rows) so EF does
    // not hit a tracking conflict from deleting + re-inserting the same {UserId, LanguageId} key.
    private void SetKnownLanguages(IReadOnlyCollection<(Language Language, LanguageLevel Level)> knownLanguages)
    {
        var desiredIds = knownLanguages.Select(known => known.Language.Id).ToHashSet();

        foreach (var existing in KnownLanguages.Where(known => !desiredIds.Contains(known.LanguageId)).ToList())
        {
            KnownLanguages.Remove(existing);
        }

        foreach (var (language, level) in knownLanguages)
        {
            var existing = KnownLanguages.FirstOrDefault(known => known.LanguageId == language.Id);

            if (existing is null)
            {
                KnownLanguages.Add(new UserKnownLanguage
                {
                    LanguageId = language.Id,
                    Language = language,
                    Level = level,
                    LevelRank = (int)level
                });
            }
            else
            {
                existing.Level = level;
                existing.LevelRank = (int)level;
            }
        }
    }

    private void SetTandemForm(TandemForm tandemForm)
    {
        TandemForm = tandemForm;
        TandemFormId = tandemForm.Id;
    }

    private void SetTandemFrequency(TandemFrequency tandemFrequency)
    {
        TandemFrequency = tandemFrequency;
        TandemFrequencyId = tandemFrequency.Id;
    }

    // Reconciles the join collection in place (remove only dropped, add only new) rather than
    // clear-and-re-add, so retained rows keep their identity and EF does not hit a tracking
    // conflict from deleting + re-inserting the same composite key in one SaveChanges.
    private void SetHobbies(IEnumerable<Hobby> hobbies)
    {
        var desiredIds = hobbies.Select(hobby => hobby.Id).ToHashSet();

        foreach (var existing in UserHobbies.Where(userHobby => !desiredIds.Contains(userHobby.HobbyId)).ToList())
        {
            UserHobbies.Remove(existing);
        }

        var currentIds = UserHobbies.Select(userHobby => userHobby.HobbyId).ToHashSet();

        foreach (var hobby in hobbies.Where(hobby => !currentIds.Contains(hobby.Id)))
        {
            UserHobbies.Add(new UserHobby { HobbyId = hobby.Id, Hobby = hobby });
        }
    }

    private void SetLearningGoals(IEnumerable<LearningGoal> learningGoals)
    {
        var desiredIds = learningGoals.Select(learningGoal => learningGoal.Id).ToHashSet();

        foreach (var existing in UserLearningGoals.Where(userLearningGoal => !desiredIds.Contains(userLearningGoal.LearningGoalId)).ToList())
        {
            UserLearningGoals.Remove(existing);
        }

        var currentIds = UserLearningGoals.Select(userLearningGoal => userLearningGoal.LearningGoalId).ToHashSet();

        foreach (var learningGoal in learningGoals.Where(learningGoal => !currentIds.Contains(learningGoal.Id)))
        {
            UserLearningGoals.Add(new UserLearningGoal { LearningGoalId = learningGoal.Id, LearningGoal = learningGoal });
        }
    }
}
