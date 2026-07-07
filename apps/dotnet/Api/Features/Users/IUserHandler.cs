using LinkUp.Core.DTOs;

namespace LinkUp.Api.Features.Users;

public interface IUserHandler
{
    Task<AuthenticatedUserDto> CreateUserAsync(NewUserDto newUser, CancellationToken cancellationToken);

    Task<UserProfileDto> UpdateUserAsync(Guid userId, UpdateUserDto updatedUser, CancellationToken cancellationToken);

    Task DeleteUserAsync(Guid userId, CancellationToken cancellationToken);

    Task<AuthDto> LoginAsync(LoginUserDto user, CancellationToken cancellationToken);

    Task<UserProfileDto> GetUserAsync(Guid id, CancellationToken cancellationToken);
    
    Task<PublicUserProfileDto> GetPublicUserAsync(Guid userId, CancellationToken cancellationToken);
}