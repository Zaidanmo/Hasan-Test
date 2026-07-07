using LinkUp.Api.Features.Users;
using LinkUp.Core.DTOs;
using LinkUp.Core.Entities;
using LinkUp.Core.Interfaces;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace LinkUp.Tests.Users;

/*
 * Tests user creation and editing. Repository and the token generator are substituted,
 * meaning there is no database being used here.
 */

public class UserHandlerTests
{
    private readonly ILinkUpRepository _repository = Substitute.For<ILinkUpRepository>();
    private readonly IJwtTokenGenerator _tokenGenerator = Substitute.For<IJwtTokenGenerator>();

    private UserHandler CreateHandler() =>
        new(_repository, _tokenGenerator, NullLogger<UserHandler>.Instance);

    // ------ CreateUserAsync ------

    [Fact]
    public async Task CreateUserAsync_WhenAccountAlreadyExists_Throws()
    {
        _repository
            .UserExistsByUsernameAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(true);

        var handler = CreateHandler();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.CreateUserAsync(ValidNewUser(), CancellationToken.None));

        await _repository.DidNotReceive().AddUserAsync(Arg.Any<User>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CreateUserAsync_Path_PersistsHashedUserAndReturnsToken()
    {
        _repository
            .UserExistsByUsernameAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(false);
        _repository
            .UserExistsByEmailAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(false);
        StubCatalogResolution();
        _tokenGenerator.CreateToken(Arg.Any<User>()).Returns("test-token");

        User? persisted = null;
        _repository
            .When(repo => repo.AddUserAsync(Arg.Any<User>(), Arg.Any<CancellationToken>()))
            .Do(call => persisted = call.Arg<User>());

        var handler = CreateHandler();
        var newUser = ValidNewUser();

        var result = await handler.CreateUserAsync(newUser, CancellationToken.None);

        Assert.Equal("test-token", result.Auth.Token);
        Assert.Equal(newUser.Username, result.Auth.Username);
        Assert.Equal("English", result.User.MotherLanguage);
        Assert.Equal("German", result.User.TargetLanguage.Language);
        Assert.Equal("Weekly", result.User.TandemFrequency);
        Assert.False(result.User.HasProfilePicture);

        await _repository.Received(1).AddUserAsync(Arg.Any<User>(), Arg.Any<CancellationToken>());
        await _repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());

        Assert.NotNull(persisted);
        Assert.NotEqual(newUser.Password, persisted!.Password);
        Assert.StartsWith("$2", persisted.Password);
    }

    [Fact]
    public async Task CreateUserAsync_WhenCatalogCodeCannotBeResolved_Throws()
    {
        _repository
            .UserExistsByUsernameAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(false);
        _repository
            .UserExistsByEmailAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(false);

        // Mother-language resolution returns nothing -> the handler must reject the request.
        _repository
            .GetActiveCatalogByCodesAsync<Language>(Arg.Any<IReadOnlyCollection<string>>(), Arg.Any<CancellationToken>())
            .Returns(new List<Language>());

        var handler = CreateHandler();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.CreateUserAsync(ValidNewUser(), CancellationToken.None));

        await _repository.DidNotReceive().AddUserAsync(Arg.Any<User>(), Arg.Any<CancellationToken>());
    }

    // ------ UpdateUserAsync ------

    [Fact]
    public async Task UpdateUserAsync_WhenUserDoesNotExist_Throws()
    {
        _repository
            .GetUserByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((User?)null);

        var handler = CreateHandler();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.UpdateUserAsync(Guid.NewGuid(), EmptyUpdate(), CancellationToken.None));
    }

    [Fact]
    public async Task UpdateUserAsync_WhenNewUsernameTakenByAnotherUser_Throws()
    {
        var editingUser = BuildPersistedUser("original");
        var someoneElse = BuildPersistedUser("taken");

        _repository.GetUserByIdAsync(editingUser.Id, Arg.Any<CancellationToken>()).Returns(editingUser);
        _repository.GetUserByUsernameAsync("taken", Arg.Any<CancellationToken>()).Returns(someoneElse);

        var handler = CreateHandler();
        var update = EmptyUpdate() with { Username = "taken" };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => handler.UpdateUserAsync(editingUser.Id, update, CancellationToken.None));

        await _repository.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateUserAsync_HappyPath_UpdatesFieldAndSaves()
    {
        var editingUser = BuildPersistedUser("original");
        _repository.GetUserByIdAsync(editingUser.Id, Arg.Any<CancellationToken>()).Returns(editingUser);

        var handler = CreateHandler();
        var update = EmptyUpdate() with { Bio = "updated bio" };

        var result = await handler.UpdateUserAsync(editingUser.Id, update, CancellationToken.None);

        Assert.Equal("updated bio", result.Bio);
        Assert.Equal("updated bio", editingUser.Bio);
        await _repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    // ------ Helper Methods ------


    private void StubCatalogResolution()
    {
        _repository
            .GetActiveCatalogByCodesAsync<Language>(Arg.Any<IReadOnlyCollection<string>>(), Arg.Any<CancellationToken>())
            .Returns(call => MakeCatalog<Language>(call.Arg<IReadOnlyCollection<string>>()));
        _repository
            .GetActiveCatalogByCodesAsync<TandemForm>(Arg.Any<IReadOnlyCollection<string>>(), Arg.Any<CancellationToken>())
            .Returns(call => MakeCatalog<TandemForm>(call.Arg<IReadOnlyCollection<string>>()));
        _repository
            .GetActiveCatalogByCodesAsync<TandemFrequency>(Arg.Any<IReadOnlyCollection<string>>(), Arg.Any<CancellationToken>())
            .Returns(call => MakeCatalog<TandemFrequency>(call.Arg<IReadOnlyCollection<string>>()));
        _repository
            .GetActiveCatalogByCodesAsync<Hobby>(Arg.Any<IReadOnlyCollection<string>>(), Arg.Any<CancellationToken>())
            .Returns(call => MakeCatalog<Hobby>(call.Arg<IReadOnlyCollection<string>>()));
        _repository
            .GetActiveCatalogByCodesAsync<LearningGoal>(Arg.Any<IReadOnlyCollection<string>>(), Arg.Any<CancellationToken>())
            .Returns(call => MakeCatalog<LearningGoal>(call.Arg<IReadOnlyCollection<string>>()));
    }

    private static List<T> MakeCatalog<T>(IReadOnlyCollection<string> codes) where T : CatalogEntity, new()
    {
        var id = 1;
        return codes
            .Select(code => new T { Id = id++, Code = code, DisplayName = code, IsActive = true })
            .ToList();
    }

    private static NewUserDto ValidNewUser() => new(
        Username: "newuser",
        Email: "new@example.com",
        ContactEmail: "contact@example.com",
        Bio: "hello",
        Password: "Password123",
        FirstName: "First",
        Surname: "Last",
        TelephoneNumber: "123456",
        Degree: "Computer Science",
        Country: "Germany",
        MotherLanguage: "English",
        Languages: new List<UserLanguage>
        {
            new() { Language = "English", Level = LanguageLevel.Native },
            new() { Language = "German", Level = LanguageLevel.B1 }
        },
        TargetLanguage: new UserLanguage { Language = "German", Level = LanguageLevel.B1 },
        Hobbies: new List<string> { "Reading", "Music" },
        DistinctHobby: "Origami",
        TandemForm: "Online",
        LearningGoals: new List<string> { "Travel" },
        TandemFrequency: "Weekly");

    private static UpdateUserDto EmptyUpdate() => new(
        Username: null,
        Email: null,
        ContactEmail: null,
        Bio: null,
        Password: null,
        FirstName: null,
        Surname: null,
        TelephoneNumber: null,
        Degree: null,
        Country: null,
        MotherLanguage: null,
        Languages: null,
        TargetLanguage: null,
        Hobbies: null,
        DistinctHobby: null,
        TandemForm: null,
        LearningGoals: null,
        TandemFrequency: null);

    private static User BuildPersistedUser(string username)
    {
        var english = new Language { Id = 1, Code = "English", DisplayName = "English", IsActive = true };
        var german = new Language { Id = 2, Code = "German", DisplayName = "German", IsActive = true };

        return new User
        {
            Username = username,
            Email = $"{username}@example.com",
            ContactEmail = $"contact_{username}@example.com",
            Bio = "original bio",
            Password = "$2a$12$0123456789012345678901uVeryFakeBcryptHashValue1234567",
            FirstName = "First",
            Surname = "Last",
            TelephoneNumber = "123456",
            Degree = "Computer Science",
            Country = "Germany",
            DistinctHobby = string.Empty,
            MotherLanguage = english,
            MotherLanguageId = english.Id,
            TargetLanguage = german,
            TargetLanguageId = german.Id,
            TargetLanguageLevel = LanguageLevel.B1,
            TandemForm = new TandemForm { Id = 1, Code = "Online", DisplayName = "Online", IsActive = true },
            TandemFormId = 1,
            TandemFrequency = new TandemFrequency { Id = 1, Code = "Weekly", DisplayName = "Weekly", IsActive = true },
            TandemFrequencyId = 1
        };
    }
}
