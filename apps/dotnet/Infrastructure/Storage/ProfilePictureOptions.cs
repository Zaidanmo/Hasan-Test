namespace LinkUp.Infrastructure.Storage;

public class ProfilePictureOptions
{
    public const string SectionName = "ProfilePictures";

    // Directory the images are written to. Relative paths are resolved against the content root.
    public string StoragePath { get; set; } = "uploads/profile-pictures";

    // Maximum accepted upload size in bytes (default 5 MB)
    public long MaxBytes { get; set; } = 5 * 1024 * 1024;

    // The stored image is resized to fit within this many pixels on its longest side.
    public int MaxDimension { get; set; } = 512;

    // Source images larger than this on any side are rejected (decompression-bomb guard).
    public int MaxSourceDimension { get; set; } = 10000;
}
