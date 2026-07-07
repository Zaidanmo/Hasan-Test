using LinkUp.Core.Interfaces;

namespace LinkUp.Api.Features.ProfilePictures;

public interface IProfilePictureHandler
{
    Task UploadAsync(Guid userId, Stream imageStream, long length, CancellationToken cancellationToken);

    Task DeleteAsync(Guid userId, CancellationToken cancellationToken);

    Task<string?> GetFilePathAsync(Guid userId, CancellationToken cancellationToken);
}

public sealed class ProfilePictureHandler : IProfilePictureHandler
{
    private readonly IProfilePictureStorage _storage;
    private readonly ILinkUpRepository _repository;

    public ProfilePictureHandler(IProfilePictureStorage storage, ILinkUpRepository repository)
    {
        _storage = storage;
        _repository = repository;
    }

    public async Task UploadAsync(Guid userId, Stream imageStream, long length, CancellationToken cancellationToken)
    {
        var fileName = await _storage.SaveAsync(userId, imageStream, length, cancellationToken);
        await _repository.SetProfilePictureFileNameAsync(userId, fileName, cancellationToken);
    }

    public async Task DeleteAsync(Guid userId, CancellationToken cancellationToken)
    {
        var fileName = await _repository.GetProfilePictureFileNameAsync(userId, cancellationToken);

        if (fileName is null)
        {
            return;
        }

        await _repository.SetProfilePictureFileNameAsync(userId, null, cancellationToken);
        await _storage.DeleteAsync(fileName, cancellationToken);
    }

    public async Task<string?> GetFilePathAsync(Guid userId, CancellationToken cancellationToken)
    {
        var fileName = await _repository.GetProfilePictureFileNameAsync(userId, cancellationToken);

        return fileName is null ? null : _storage.GetFilePath(fileName);
    }
}
