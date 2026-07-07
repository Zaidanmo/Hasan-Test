import api from "./index";

// API: GET /matches?page=1&pageSize=20
// Backend liefert ein PagedResult: { items, page, pageSize, totalItems, totalPages, hasNextPage }.
export const getMatches = async ({ page = 1, pageSize = 20 } = {}) => {
    const response = await api.get("/matches", {
        params: { page, pageSize },
    });

    return response.data;
};

// API: GET /matches/mutual
export const getMutualMatches = async () => {
    const response = await api.get("/matches/mutual");
    return response.data;
};

// API: POST /matches/{favoriteUserId}/favorite
// Frontend: Rechts-Swipe/Like. Die API speichert das Interesse als Favorite.
export const likeProfile = async (profileId) => {
    const response = await api.post(`/matches/${profileId}/favorite`);
    return response.data;
};

export const favoriteMatch = likeProfile;
export const getSuggestedProfiles = getMatches;

// Links-Swipe ist aktuell nur eine lokale UI-Aktion; dafür gibt es keinen API-Endpunkt.
export const swipeProfile = async ({ profileId, direction }) => {
    if (direction !== "right") {
        return { skipped: true, profileId };
    }

    return likeProfile(profileId);
};
