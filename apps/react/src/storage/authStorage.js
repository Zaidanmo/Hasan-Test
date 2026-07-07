import {
    AUTH_CHANGED_EVENT,
    AUTH_STORAGE_KEY,
    TOKEN_STORAGE_KEY,
} from "./storageKeys";

const canUseLocalStorage = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

export const notifyAuthChanged = () => {
    if (typeof window === "undefined") return;

    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const getStoredAuthToken = () => {
    if (!canUseLocalStorage()) return "";

    try {
        return localStorage.getItem(TOKEN_STORAGE_KEY) || "";
    } catch {
        return "";
    }
};

export const setStoredAuthToken = (token) => {
    if (!canUseLocalStorage()) return;

    try {
        if (token) {
            localStorage.setItem(TOKEN_STORAGE_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
    } catch {
        // Authentication state will still update in React state for this render cycle.
    }
};

export const getStoredAuthSession = () => {
    if (!canUseLocalStorage()) return null;

    try {
        return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null");
    } catch {
        return null;
    }
};

export const setStoredAuthSession = (user) => {
    if (!canUseLocalStorage()) return;

    try {
        if (user) {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
        }
    } catch {
        // Ignore persistence failures so UI actions do not crash.
    }
};

export const saveAuthSession = ({ token, user }) => {
    setStoredAuthToken(token);
    setStoredAuthSession(user);

    notifyAuthChanged();
};

export const clearAuthSession = () => {
    setStoredAuthToken("");
    setStoredAuthSession(null);
    notifyAuthChanged();
};
