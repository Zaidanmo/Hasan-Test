using FluentValidation.Results;
using LinkUp.Api.Features.Catalogs;
using LinkUp.Core.DTOs;
using LinkUp.Core.Entities;
using ValidationResult = FluentValidation.Results.ValidationResult;

namespace LinkUp.Api.Features.Users;

public class NewUserEnvelopeValidator : AbstractValidator<UserEnvelope<NewUserDto>>
{
    public NewUserEnvelopeValidator(ICatalogCache catalogCache)
    {
        RuleFor(x => x.User)
            .NotNull()
            .SetValidator(new NewUserDtoValidator(catalogCache));
    }
}

public class LoginUserEnvelopeValidator : AbstractValidator<UserEnvelope<LoginUserDto>>
{
    public LoginUserEnvelopeValidator()
    {
        RuleFor(x => x.User)
            .NotNull()
            .SetValidator(new LoginUserDtoValidator());
    }
}

public class UpdateUserEnvelopeValidator : AbstractValidator<UserEnvelope<UpdateUserDto>>
{
    public UpdateUserEnvelopeValidator(ICatalogCache catalogCache)
    {
        RuleFor(x => x.User)
            .NotNull()
            .SetValidator(new UpdateUserDtoValidator(catalogCache));
    }
}

public class NewUserDtoValidator : AbstractValidator<NewUserDto>
{
    public NewUserDtoValidator(ICatalogCache catalogCache)
    {
        RuleFor(x => x.Username)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(40);


        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.ContactEmail)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(254);

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(128);

        RuleFor(x => x.TelephoneNumber)
            .MaximumLength(50)
            .When(x => x.TelephoneNumber is not null);

        RuleFor(x => x.Bio)
            .MaximumLength(1000)
            .When(x => x.Bio is not null);


        RuleFor(x => x.FirstName)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Surname)
            .MaximumLength(100)
            .NotEmpty();

        RuleFor(x => x.Degree)
            .NotEmpty();

        RuleFor(x => x.Country)
            .NotEmpty();

        RuleFor(x => x.MotherLanguage)
            .NotEmpty();

        RuleFor(x => x.MotherLanguage)
            .MustAsync((language, ct) => CatalogValidation.LanguageExistsAsync(catalogCache, language, ct))
            .WithMessage("The selected mother language is not in the list of supported languages.")
            .When(x => !string.IsNullOrWhiteSpace(x.MotherLanguage));

        RuleFor(x => x.Languages)
            .NotEmpty();

        RuleForEach(x => x.Languages)
            .NotNull()
            .SetValidator(new UserLanguageValidator(catalogCache));

        RuleFor(x => x.TargetLanguage)
            .NotNull()
            .SetValidator(new UserLanguageValidator(catalogCache));

        RuleFor(x => x.Hobbies)
            .NotEmpty();

        RuleFor(x => x.Hobbies)
            .MustAsync((codes, ct) => CatalogValidation.AllCodesExistAsync<Hobby>(catalogCache, codes, ct))
            .WithMessage("One or more selected hobbies are invalid.")
            .When(x => x.Hobbies is { Count: > 0 });

        RuleFor(x => x.DistinctHobby)
            .MaximumLength(200)
            .When(x => x.DistinctHobby is not null);

        RuleFor(x => x.TandemForm)
            .NotEmpty()
            .MustAsync((code, ct) => CatalogValidation.CodeExistsAsync<TandemForm>(catalogCache, code, ct))
            .WithMessage("The selected tandem form is invalid.");

        RuleFor(x => x.LearningGoals)
            .NotEmpty();

        RuleFor(x => x.LearningGoals)
            .MustAsync((codes, ct) => CatalogValidation.AllCodesExistAsync<LearningGoal>(catalogCache, codes, ct))
            .WithMessage("One or more selected learning goals are invalid.")
            .When(x => x.LearningGoals is { Count: > 0 });

        RuleFor(x => x.TandemFrequency)
            .NotEmpty()
            .MustAsync((code, ct) => CatalogValidation.CodeExistsAsync<TandemFrequency>(catalogCache, code, ct))
            .WithMessage("The selected tandem frequency is invalid.");
    }
}

public class LoginUserDtoValidator : AbstractValidator<LoginUserDto>
{
    public LoginUserDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.Password)
            .NotEmpty();
    }
}

public class UpdateUserDtoValidator : AbstractValidator<UpdateUserDto>
{
    public UpdateUserDtoValidator(ICatalogCache catalogCache)
    {
        RuleFor(x => x.Username)
            .NotEmpty()
            .MinimumLength(3)
            .When(x => x.Username is not null);

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .When(x => x.Email is not null);

        RuleFor(x => x.ContactEmail)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(254)
            .When(x => x.ContactEmail is not null);

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(128)
            .When(x => x.Password is not null);

        RuleFor(x => x.FirstName)
            .NotEmpty()
            .When(x => x.FirstName is not null);

        RuleFor(x => x.Surname)
            .NotEmpty()
            .When(x => x.Surname is not null);

        RuleFor(x => x.Degree)
            .NotEmpty()
            .When(x => x.Degree is not null);

        RuleFor(x => x.Country)
            .NotEmpty()
            .When(x => x.Country is not null);

        RuleFor(x => x.MotherLanguage)
            .NotEmpty()
            .When(x => x.MotherLanguage is not null);

        RuleFor(x => x.MotherLanguage)
            .MustAsync((language, ct) => CatalogValidation.LanguageExistsAsync(catalogCache, language, ct))
            .WithMessage("The selected mother language is not in the list of supported languages.")
            .When(x => !string.IsNullOrWhiteSpace(x.MotherLanguage));

        RuleFor(x => x.Languages)
            .NotEmpty()
            .When(x => x.Languages is not null);

        RuleForEach(x => x.Languages)
            .NotNull()
            .SetValidator(new UserLanguageValidator(catalogCache))
            .When(x => x.Languages is not null);

        When(x => x.TargetLanguage is not null, () =>
        {
            RuleFor(x => x.TargetLanguage!)
                .SetValidator(new UserLanguageValidator(catalogCache));
        });

        RuleFor(x => x.Hobbies)
            .NotEmpty()
            .When(x => x.Hobbies is not null);

        RuleFor(x => x.Hobbies)
            .MustAsync((codes, ct) => CatalogValidation.AllCodesExistAsync<Hobby>(catalogCache, codes, ct))
            .WithMessage("One or more selected hobbies are invalid.")
            .When(x => x.Hobbies is { Count: > 0 });

        RuleFor(x => x.TandemForm)
            .MustAsync((code, ct) => CatalogValidation.CodeExistsAsync<TandemForm>(catalogCache, code, ct))
            .WithMessage("The selected tandem form is invalid.")
            .When(x => x.TandemForm is not null);

        RuleFor(x => x.LearningGoals)
            .NotEmpty()
            .When(x => x.LearningGoals is not null);

        RuleFor(x => x.LearningGoals)
            .MustAsync((codes, ct) => CatalogValidation.AllCodesExistAsync<LearningGoal>(catalogCache, codes, ct))
            .WithMessage("One or more selected learning goals are invalid.")
            .When(x => x.LearningGoals is { Count: > 0 });

        RuleFor(x => x.TandemFrequency)
            .MustAsync((code, ct) => CatalogValidation.CodeExistsAsync<TandemFrequency>(catalogCache, code, ct))
            .WithMessage("The selected tandem frequency is invalid.")
            .When(x => x.TandemFrequency is not null);

        RuleFor(x => x.Bio)
            .MaximumLength(1000)
            .When(x => x.Bio is not null);

        RuleFor(x => x.TelephoneNumber)
            .MaximumLength(50)
            .When(x => x.TelephoneNumber is not null);

        RuleFor(x => x.DistinctHobby)
            .MaximumLength(200)
            .When(x => x.DistinctHobby is not null);
    }
}

public class UserLanguageValidator : AbstractValidator<UserLanguage>
{
    public UserLanguageValidator(ICatalogCache catalogCache)
    {
        RuleFor(x => x.Language)
            .NotEmpty();

        RuleFor(x => x.Language)
            .MustAsync((language, ct) => CatalogValidation.LanguageExistsAsync(catalogCache, language, ct))
            .WithMessage("The selected language is not in the list of supported languages.")
            .When(x => !string.IsNullOrWhiteSpace(x.Language));

        RuleFor(x => x.Level)
            .IsInEnum();
    }
}

// Thin wrappers over the in-memory catalog cache (no DB round-trips during validation).
internal static class CatalogValidation
{
    public static Task<bool> AllCodesExistAsync<T>(
        ICatalogCache catalogCache,
        IEnumerable<string>? codes,
        CancellationToken cancellationToken)
        where T : CatalogEntity
        => catalogCache.AllActiveCodesExistAsync<T>(codes, cancellationToken);

    public static Task<bool> CodeExistsAsync<T>(
        ICatalogCache catalogCache,
        string? code,
        CancellationToken cancellationToken)
        where T : CatalogEntity
        => catalogCache.ActiveCodeExistsAsync<T>(code, cancellationToken);

    // The Language catalog Code is matched case-insensitively in the cache, so no normalization is needed.
    public static Task<bool> LanguageExistsAsync(
        ICatalogCache catalogCache,
        string? language,
        CancellationToken cancellationToken)
        => catalogCache.ActiveCodeExistsAsync<Language>(language, cancellationToken);
}

public static class ValidationErrorResponse
{
    public static object MissingRequestBody() => new
    {
        message = "Validation failed.",
        errors = new[]
        {
            new
            {
                field = "body",
                message = "Request body is required."
            }
        }
    };

    public static object From(ValidationResult validationResult) => new
    {
        message = "Validation failed.",
        errors = validationResult.Errors.Select(error => new
        {
            field = error.PropertyName,
            message = error.ErrorMessage
        })
    };
}
