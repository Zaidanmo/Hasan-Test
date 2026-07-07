namespace LinkUp.Core.Interfaces;

public interface IProfilePictureStorage
{
    Task<string> SaveAsync(Guid userId, Stream imageStream, long length, CancellationToken cancellationToken);

    Task DeleteAsync(string fileName, CancellationToken cancellationToken);

    string? GetFilePath(string fileName);
}

public sealed class ProfilePictureValidationException : Exception
{
    public ProfilePictureValidationException(string message) : base(message)
    { }
}
