using LinkUp.Core.DTOs;

namespace LinkUp.Api.Features.Users;

public record AuthEnvelope<T>([Required] T Auth);

public record UserEnvelope<T>([Required] T User);

public record AuthenticatedUserEnvelope(
    [Required] AuthDto Auth,
    [Required] UserProfileDto User
);