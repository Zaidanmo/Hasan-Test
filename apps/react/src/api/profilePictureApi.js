import api from "./index";

export const PROFILE_PICTURE_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_PICTURE_ACCEPT = "image/jpeg,image/png,image/webp";

const PROFILE_PICTURE_ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const isSupportedProfilePictureFile = (file) =>
    Boolean(file && PROFILE_PICTURE_ALLOWED_TYPES.has(file.type));

export const uploadProfilePicture = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    await api.post("/user/profile-picture", formData);
};

export const deleteProfilePicture = async () => {
    await api.delete("/user/profile-picture");
};

export const getProfilePictureBlob = async (userId) => {
    const response = await api.get(`/users/${userId}/profile-picture`, {
        responseType: "blob",
    });

    return response.data;
};
