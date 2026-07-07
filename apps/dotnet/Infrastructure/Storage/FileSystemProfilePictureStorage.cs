using LinkUp.Core.Interfaces;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace LinkUp.Infrastructure.Storage;

/// <summary>
/// Stores profile pictures on the local filesystem as normalized WebP images. Every upload is
/// decoded (which validates it is a real raster image — SVG and other non-raster/garbage payloads
/// are rejected), capped in dimensions, stripped of metadata, and re-encoded, so a malicious file
/// cannot survive as something dangerous.
/// </summary>
public sealed class FileSystemProfilePictureStorage : IProfilePictureStorage
{
    private readonly ProfilePictureOptions _options;
    private readonly string _directory;

    public FileSystemProfilePictureStorage(IOptions<ProfilePictureOptions> options)
    {
        _options = options.Value;
        // StoragePath is resolved to an absolute path during configuration (see Program.cs); fall back
        // to the current directory if a relative path slips through.
        _directory = Path.IsPathRooted(_options.StoragePath)
            ? _options.StoragePath
            : Path.GetFullPath(_options.StoragePath);
    }

    public async Task<string> SaveAsync(Guid userId, Stream imageStream, long length, CancellationToken cancellationToken)
    {
        if (length <= 0 || length > _options.MaxBytes)
        {
            throw new ProfilePictureValidationException($"Image must be between 1 byte and {_options.MaxBytes} bytes.");
        }
        
        using var buffer = new MemoryStream();
        await imageStream.CopyToAsync(buffer, cancellationToken);

        if (buffer.Length > _options.MaxBytes)
        {
            throw new ProfilePictureValidationException("Image is too large.");
        }

        buffer.Position = 0;

        ImageInfo info;
        try
        {
            info = await Image.IdentifyAsync(buffer, cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            throw new ProfilePictureValidationException("Unsupported or invalid image.");
        }

        if (info.Width > _options.MaxSourceDimension || info.Height > _options.MaxSourceDimension)
        {
            throw new ProfilePictureValidationException("Image dimensions are too large.");
        }

        buffer.Position = 0;

        Image image;
        try
        {
            image = await Image.LoadAsync(buffer, cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            throw new ProfilePictureValidationException("Unsupported or invalid image.");
        }

        using (image)
        {
            if (image.Width > _options.MaxDimension || image.Height > _options.MaxDimension)
            {
                image.Mutate(context => context.Resize(new ResizeOptions
                {
                    Size = new Size(_options.MaxDimension, _options.MaxDimension),
                    Mode = ResizeMode.Max
                }));
            }

            // Drop potentially sensitive / bulky metadata (e.g. GPS coordinates in EXIF).
            image.Metadata.ExifProfile = null;
            image.Metadata.IptcProfile = null;
            image.Metadata.XmpProfile = null;

            Directory.CreateDirectory(_directory);

            var fileName = $"{userId:N}.webp";
            var fullPath = Path.Combine(_directory, fileName);
            var tempPath = fullPath + ".tmp";

            await using (var output = File.Create(tempPath))
            {
                await image.SaveAsWebpAsync(output, new WebpEncoder { Quality = 80 }, cancellationToken);
            }

            File.Move(tempPath, fullPath, overwrite: true);
            return fileName;
        }
    }

    public Task DeleteAsync(string fileName, CancellationToken cancellationToken)
    {
        var path = ResolveExistingPath(fileName);

        if (path is not null)
        {
            File.Delete(path);
        }

        return Task.CompletedTask;
    }

    public string? GetFilePath(string fileName) => ResolveExistingPath(fileName);

    // Ensures path consistency
    private string? ResolveExistingPath(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName) || Path.GetFileName(fileName) != fileName)
        {
            return null;
        }

        var path = Path.Combine(_directory, fileName);
        return File.Exists(path) ? path : null;
    }
}
