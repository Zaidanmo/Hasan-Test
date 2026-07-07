import { useProfilePictureUrl } from "../../hooks/useProfilePictureUrl";

export function ProfileAvatar({
    userId,
    hasProfilePicture,
    pictureVersion = 0,
    previewUrl = "",
    fallback = "?",
    color = "#7A003F",
    className = "",
    textClassName = "",
    imageAlt = "",
}) {
    const pictureUrl = useProfilePictureUrl(userId, hasProfilePicture && !previewUrl, pictureVersion);
    const src = previewUrl || pictureUrl;

    return (
        <div
            className={`relative shrink-0 overflow-hidden rounded-full flex items-center justify-center text-white shadow-lg ${className}`}
            style={{ background: src ? "#F7EEF3" : `linear-gradient(135deg, ${color}, ${color}cc)` }}
        >
            {src ? (
                <img
                    src={src}
                    alt={imageAlt}
                    className="h-full w-full object-cover"
                    draggable={false}
                />
            ) : (
                <span className={`font-display font-bold ${textClassName}`}>{fallback}</span>
            )}
        </div>
    );
}
