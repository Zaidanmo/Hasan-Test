import { useEffect, useMemo, useState } from "react";
import { getAuthToken, persistAuthSession } from "../api/authApi";
import {
    clearAuthSession,
    getStoredAuthSession,
    getStoredAuthToken,
} from "../storage/authStorage";
import { AUTH_CHANGED_EVENT } from "../storage/storageKeys";
import { AuthContext } from "./authContextValue";

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => getStoredAuthToken());
    const [user, setUser] = useState(() => getStoredAuthSession());

    const refreshSession = () => {
        setToken(getStoredAuthToken());
        setUser(getStoredAuthSession());
    };

    useEffect(() => {
        const handleAuthChange = () => refreshSession();

        window.addEventListener("storage", handleAuthChange);
        window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);

        return () => {
            window.removeEventListener("storage", handleAuthChange);
            window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
        };
    }, []);

    const value = useMemo(() => ({
        token,
        user,
        isAuthenticated: Boolean(token),
        login: (data) => {
            const sessionUser = persistAuthSession(data);
            setToken(getAuthToken(data) || getStoredAuthToken());
            setUser(sessionUser);
            return sessionUser;
        },
        logout: () => {
            clearAuthSession();
            setToken("");
            setUser(null);
        },
        refreshSession,
    }), [token, user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
