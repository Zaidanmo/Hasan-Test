import api from "./index";
import { getMutualMatches, likeProfile } from "./matchApi";

export const getCurrentUser = async () => {
    const response = await api.get("/user");
    return response.data;
};

export const updateCurrentUser = async (user) => {
    const response = await api.put("/user", { user });
    return response.data;
};

export const deleteCurrentUser = async () => {
    await api.delete("/user");
};

export const getUserById = async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
};

export const getFavorites = getMutualMatches;
export const addFavorite = likeProfile;

export const removeFavorite = async () => {
    throw new Error("Likes koennen aktuell noch nicht entfernt werden.");
};
