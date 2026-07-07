import { useId, useRef } from "react";
import { PROFILE_PICTURE_ACCEPT } from "../../api/profilePictureApi";
import { ProfileAvatar } from "./ProfileAvatar";

export function ProfilePictureControl({
    label,
    help,
    chooseLabel,
    changeLabel,
    removeLabel,
    fallback,
    color,
    userId = "",
    hasProfilePicture = false,
    pictureVersion = 0,
    previewUrl = "",
    fileName = "",
    uploading = false,
    deleting = false,
    error = "",
    onFileChange,
    onRemove,
}) {
    const inputId = useId();
    const inputRef = useRef(null);
    const hasImage = Boolean(previewUrl || hasProfilePicture);

    const handleFileChange = (event) => {
        const file = event.target.files?.[0] ?? null;
        onFileChange(file);
        event.target.value = "";
    };

    const handleRemove = () => {
        onRemove?.();
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-ovgu-surface p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <ProfileAvatar
                    userId={userId}
                    hasProfilePicture={hasProfilePicture}
                    pictureVersion={pictureVersion}
                    previewUrl={previewUrl}
                    fallback={fallback}
                    color={color}
                    className="h-24 w-24"
                    textClassName="text-4xl"
                    imageAlt={label}
                />

                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
                    {help && <p className="mt-1 text-sm text-ovgu-muted">{help}</p>}
                    {fileName && <p className="mt-1 text-xs font-semibold text-ovgu-primary truncate">{fileName}</p>}
                    {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}

                    <div className="mt-3 flex flex-wrap gap-2">
                        <label
                            htmlFor={inputId}
                            className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                                uploading || deleting
                                    ? "pointer-events-none bg-gray-100 text-gray-400"
                                    : "bg-ovgu-primary text-white hover:bg-ovgu-primaryDark"
                            }`}
                        >
                            {uploading ? "..." : hasImage ? changeLabel : chooseLabel}
                        </label>
                        {hasImage && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                disabled={uploading || deleting}
                                className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deleting ? "..." : removeLabel}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={PROFILE_PICTURE_ACCEPT}
                className="sr-only"
                onChange={handleFileChange}
                disabled={uploading || deleting}
            />
        </div>
    );
}
