using LinkUp.Core.Entities;

namespace LinkUp.Core.Interfaces;

public interface IJwtTokenGenerator
{
    string CreateToken(User user);
}