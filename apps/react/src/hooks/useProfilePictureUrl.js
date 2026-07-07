import { useEffect, useState } from "react";
import { getProfilePictureBlob } from "../api/profilePictureApi";

export function useProfilePictureUrl(userId, hasProfilePicture, version = 0) {
    const [url, setUrl] = useState("");

    useEffect(() => {
        if (!userId || !hasProfilePicture) {
            return undefined;
        }

        let active = true;
        let objectUrl = "";

        const loadProfilePicture = async () => {
            try {
                const blob = await getProfilePictureBlob(userId);
                objectUrl = URL.createObjectURL(blob);

                if (active) {
                    setUrl(objectUrl);
                } else {
                    URL.revokeObjectURL(objectUrl);
                }
            } catch {
                if (active) {
                    setUrl("");
                }
            }
        };

        void loadProfilePicture();

        return () => {
            active = false;

            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [userId, hasProfilePicture, version]);

    return userId && hasProfilePicture ? url : "";
}
