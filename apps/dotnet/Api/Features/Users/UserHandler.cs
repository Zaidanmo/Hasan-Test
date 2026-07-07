using LinkUp.Core.DTOs;
using LinkUp.Core.Entities;
using LinkUp.Core.Interfaces;

namespace LinkUp.Api.Features.Users;

public class UserHandler : IUserHandler
{
    private readonly ILinkUpRepository _repository;
    private readonly IJwtTokenGenerator _tokenGenerator;
    private readonly ILogger<UserHandler> _logger;
    
    private const int BCryptWorkFactor = 12;

    public UserHandler(ILinkUpRepository linkUpRepository, IJwtTokenGenerator tokenGenerator, ILogger<UserHandler> logger)
    {
        _repository = linkUpRepository;
        _tokenGenerator = tokenGenerator;
        _logger = logger;
    }

    public async Task<AuthenticatedUserDto> CreateUserAsync(NewUserDto newUser, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(newUser.Email))
        {
            throw new InvalidOperationException("Invalid email address.");
        }
        if (string.IsNullOrWhiteSpace(newUser.Username))
        {
            throw new InvalidOperationException("Invalid username.");
        }
        if (string.IsNullOrWhiteSpace(newUser.Password))
        {
            throw new InvalidOperationException("Invalid password.");
        }

        if (await _repository.UserExistsByUsernameAsync(newUser.Username, cancellationToken))
        {
            throw new InvalidOperationException("An account with this username already exists.");
        }
        if (await _repository.UserExistsByEmailAsync(newUser.Email, cancellationToken))
        {
            throw new InvalidOperationException("An account with this email already exists.");
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(newUser.Password, BCryptWorkFactor);

        var motherLanguage = await ResolveCatalogAsync<Language>(newUser.MotherLanguage, "mother language", cancellationToken);
        var targetLanguage = await ResolveCatalogAsync<Language>(newUser.TargetLanguage.Language, "target language", cancellationToken);
        var knownLanguages = await ResolveKnownLanguagesAsync(newUser.Languages, cancellationToken);
        var tandemForm = await ResolveCatalogAsync<TandemForm>(newUser.TandemForm, "tandem form", cancellationToken);
        var tandemFrequency = await ResolveCatalogAsync<TandemFrequency>(newUser.TandemFrequency, "tandem frequency", cancellationToken);
        var hobbies = await ResolveCatalogManyAsync<Hobby>(newUser.Hobbies, "hobbies", cancellationToken);
        var learningGoals = await ResolveCatalogManyAsync<LearningGoal>(newUser.LearningGoals, "learning goals", cancellationToken);

        var user = new User(
            newUser,
            passwordHash,
            motherLanguage,
            targetLanguage,
            newUser.TargetLanguage.Level,
            knownLanguages,
            tandemForm,
            tandemFrequency,
            hobbies,
            learningGoals);

        await _repository.AddUserAsync(user, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        var token =  _tokenGenerator.CreateToken(user);
        return new AuthenticatedUserDto(
            UserMapper.ToAuthDto(user, token),
            UserMapper.ToUserProfileDto(user)
        );
    }

    public async Task<UserProfileDto> UpdateUserAsync(Guid userId, UpdateUserDto updatedUser, CancellationToken cancellationToken)
    {
        var user = await _repository.GetUserByIdAsync(userId, cancellationToken);

        if (user is null)
        {
            _logger.LogDebug("No current user was found while building matches.");
            throw new InvalidOperationException("User not found.");
        }

        var newUsername = updatedUser.Username;
        var newEmail = updatedUser.Email;

        if (!string.IsNullOrWhiteSpace(newUsername) &&
            !string.Equals(user.Username, newUsername, StringComparison.Ordinal))
        {
            var usernameOwner = await _repository.GetUserByUsernameAsync(newUsername, cancellationToken);

            if (usernameOwner is not null && usernameOwner.Id != userId)
            {
                throw new InvalidOperationException("Username is already in use.");
            }
        }

        if (!string.IsNullOrWhiteSpace(newEmail) &&
            !string.Equals(user.Email, newEmail, StringComparison.OrdinalIgnoreCase))
        {
            var emailOwner = await _repository.GetUserByEmailAsync(newEmail, cancellationToken);

            if (emailOwner is not null && emailOwner.Id != userId)
            {
                throw new InvalidOperationException("Email address is already in use.");
            }
        }

        var passwordHash = string.IsNullOrWhiteSpace(updatedUser.Password)
            ? null
            : BCrypt.Net.BCrypt.HashPassword(updatedUser.Password, BCryptWorkFactor);

        var motherLanguage = updatedUser.MotherLanguage is null
            ? null
            : await ResolveCatalogAsync<Language>(updatedUser.MotherLanguage, "mother language", cancellationToken);

        Language? targetLanguage = null;
        LanguageLevel? targetLanguageLevel = null;
        if (updatedUser.TargetLanguage is not null)
        {
            targetLanguage = await ResolveCatalogAsync<Language>(updatedUser.TargetLanguage.Language, "target language", cancellationToken);
            targetLanguageLevel = updatedUser.TargetLanguage.Level;
        }

        var knownLanguages = updatedUser.Languages is null
            ? null
            : await ResolveKnownLanguagesAsync(updatedUser.Languages, cancellationToken);

        var tandemForm = updatedUser.TandemForm is null
            ? null
            : await ResolveCatalogAsync<TandemForm>(updatedUser.TandemForm, "tandem form", cancellationToken);

        var tandemFrequency = updatedUser.TandemFrequency is null
            ? null
            : await ResolveCatalogAsync<TandemFrequency>(updatedUser.TandemFrequency, "tandem frequency", cancellationToken);

        var hobbies = updatedUser.Hobbies is null
            ? null
            : await ResolveCatalogManyAsync<Hobby>(updatedUser.Hobbies, "hobbies", cancellationToken);

        var learningGoals = updatedUser.LearningGoals is null
            ? null
            : await ResolveCatalogManyAsync<LearningGoal>(updatedUser.LearningGoals, "learning goals", cancellationToken);

        user.UpdateUser(
            updatedUser,
            passwordHash,
            motherLanguage,
            targetLanguage,
            targetLanguageLevel,
            knownLanguages,
            tandemForm,
            tandemFrequency,
            hobbies,
            learningGoals);
        await _repository.SaveChangesAsync(cancellationToken);

        return UserMapper.ToUserProfileDto(user);
    }

    public async Task DeleteUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var exists = await _repository.UserExistsByIdAsync(userId, cancellationToken);

        if (!exists)
        {
            throw new InvalidOperationException("User does not exist.");
        }

        await _repository.DeleteUserAsync(userId, cancellationToken);
    }

    public async Task<AuthDto> LoginAsync(LoginUserDto login, CancellationToken cancellationToken)
    {
        var user = await _repository.GetUserByEmailAsync(login.Email, cancellationToken);

        if (user == null)
        {
            throw new InvalidOperationException("User does not exist.");
        }

        if (!IsPasswordValid(login.Password, user.Password))
        {
            // It is in fact just an invalid password but just for security sakes
            throw new InvalidOperationException("Invalid username or password."); 
        }
        
        var token = _tokenGenerator.CreateToken(user);
        return UserMapper.ToAuthDto(user, token);
    }

    public async Task<UserProfileDto> GetUserAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await _repository.GetUserByIdReadOnlyAsync(id, cancellationToken);

        if (user is null)
        {
            throw new InvalidOperationException("User does not exist.");
        }

        return UserMapper.ToUserProfileDto(user);
    }
    
    public async Task<PublicUserProfileDto> GetPublicUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await _repository.GetUserByIdReadOnlyAsync(userId, cancellationToken);
        
        if (user is null)
        {
            throw new InvalidOperationException("User does not exist.");
        }
        
        return UserMapper.ToPublicUserProfileDto(user);
    }
    
    #region Private Methods

    // Validators already reject unknown/inactive codes; these resolves are the persistence-side
    // lookup and a defensive guard (e.g. a code deactivated between validation and save).
    private async Task<T> ResolveCatalogAsync<T>(string code, string label, CancellationToken cancellationToken)
        where T : CatalogEntity
    {
        var matches = await _repository.GetActiveCatalogByCodesAsync<T>(new[] { code.Trim() }, cancellationToken);
        var match = matches.FirstOrDefault();

        if (match is null)
        {
            throw new InvalidOperationException($"The selected {label} is invalid.");
        }

        return match;
    }

    private async Task<List<T>> ResolveCatalogManyAsync<T>(IReadOnlyCollection<string> codes, string label, CancellationToken cancellationToken)
        where T : CatalogEntity
    {
        var distinctCodes = codes
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Select(code => code.Trim())
            .Distinct()
            .ToList();

        var matches = await _repository.GetActiveCatalogByCodesAsync<T>(distinctCodes, cancellationToken);

        if (matches.Count != distinctCodes.Count)
        {
            throw new InvalidOperationException($"One or more selected {label} are invalid.");
        }

        return matches;
    }

    // Resolves the submitted {language code, level} pairs to Language entities (case-insensitive),
    // preserving each entry's level so the known-language rows can be built.
    private async Task<List<(Language Language, LanguageLevel Level)>> ResolveKnownLanguagesAsync(
        IReadOnlyCollection<UserLanguage> languages,
        CancellationToken cancellationToken)
    {
        var distinctCodes = languages
            .Where(language => !string.IsNullOrWhiteSpace(language.Language))
            .Select(language => language.Language.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var resolved = await _repository.GetActiveCatalogByCodesAsync<Language>(distinctCodes, cancellationToken);

        if (resolved.Count != distinctCodes.Count)
        {
            throw new InvalidOperationException("One or more selected languages are invalid.");
        }

        var byCode = resolved.ToDictionary(language => language.Code, StringComparer.OrdinalIgnoreCase);

        return languages
            .Where(language => !string.IsNullOrWhiteSpace(language.Language))
            .Select(language => (Language: byCode[language.Language.Trim()], Level: language.Level))
            .ToList();
    }

    private static bool IsPasswordValid(string providedPassword, string storedPassword)
    {
        if (string.IsNullOrWhiteSpace(providedPassword) || string.IsNullOrWhiteSpace(storedPassword))
        {
            return false;
        }

        if (!IsBCryptHash(storedPassword))
        {
            return false;
        }

        try
        {
            return BCrypt.Net.BCrypt.Verify(providedPassword, storedPassword);
        }
        catch
        {
            return false;
        }
    }
    
    private static bool IsBCryptHash(string password)
    {
        return password.StartsWith("$2a$", StringComparison.Ordinal) ||
               password.StartsWith("$2b$", StringComparison.Ordinal) ||
               password.StartsWith("$2x$", StringComparison.Ordinal) ||
               password.StartsWith("$2y$", StringComparison.Ordinal);
    }
    #endregion
}