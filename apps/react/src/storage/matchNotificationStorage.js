import { AUTH_STORAGE_KEY, SEEN_MUTUAL_MATCHES_STORAGE_KEY } from "./storageKeys";

const canUseLocalStorage = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

const normalizeId = (id) => String(id || "").trim();

const getCurrentUserId = () => {
    if (!canUseLocalStorage()) return "anonymous";

    try {
        const auth = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null");
        return normalizeId(auth?.id ?? auth?.Id) || "anonymous";
    } catch {
        return "anonymous";
    }
};

const getStorageKey = () => `${SEEN_MUTUAL_MATCHES_STORAGE_KEY}:${getCurrentUserId()}`;

export const getSeenMutualMatchIds = () => {
    if (!canUseLocalStorage()) return [];

    try {
        const value = JSON.parse(localStorage.getItem(getStorageKey()) || "[]");
        return Array.isArray(value) ? value.map(normalizeId).filter(Boolean) : [];
    } catch {
        return [];
    }
};

export const hasSeenMutualMatch = (id) => {
    const matchId = normalizeId(id);
    if (!matchId) return true;

    return getSeenMutualMatchIds().includes(matchId);
};

export const markMutualMatchAsSeen = (id) => {
    const matchId = normalizeId(id);
    if (!canUseLocalStorage() || !matchId) return;

    const current = getSeenMutualMatchIds();
    if (current.includes(matchId)) return;

    try {
        localStorage.setItem(getStorageKey(), JSON.stringify([...current, matchId]));
    } catch {
        // Notifications can reappear if storage is unavailable, but the app should keep running.
    }
};

export const markMutualMatchesAsSeen = (ids) => {
    if (!canUseLocalStorage()) return;

    const nextIds = Array.isArray(ids) ? ids.map(normalizeId).filter(Boolean) : [];
    if (nextIds.length === 0) return;

    const current = getSeenMutualMatchIds();
    const next = Array.from(new Set([...current, ...nextIds]));
    try {
        localStorage.setItem(getStorageKey(), JSON.stringify(next));
    } catch {
        // Ignore persistence failures.
    }
};
