import api from "./index";
import {
    clearAuthSession,
    getStoredAuthSession,
    getStoredAuthToken,
    saveAuthSession,
} from "../storage/authStorage";

export { clearAuthSession, getStoredAuthSession, getStoredAuthToken };

const read = (value, ...keys) => {
    for (const key of keys) {
        if (value?.[key] !== undefined && value?.[key] !== null) {
            return value[key];
        }
    }

    return undefined;
};

const notImplemented = (feature) => {
    throw new Error(`${feature} ist aktuell noch nicht verfügbar.`);
};

export const getAuthFromResponse = (data) => data?.auth ?? data?.Auth ?? data?.user ?? data?.User ?? null;

export const getAuthToken = (data) => {
    const auth = getAuthFromResponse(data);
    return auth?.token ?? auth?.Token ?? "";
};

export const persistAuthSession = (data) => {
    const auth = getAuthFromResponse(data);
    const profile = data?.user ?? data?.User ?? {};
    const token = getAuthToken(data);

    if (!token) {
        throw new Error("Token fehlt");
    }

    const sessionUser = {
        id: read(auth, "id", "Id") ?? "",
        username: read(auth, "username", "Username") ?? "",
        email: read(auth, "email", "Email") ?? "",
        contactEmail: read(profile, "contactEmail", "ContactEmail") ?? "",
        hasProfilePicture: Boolean(read(profile, "hasProfilePicture", "HasProfilePicture")),
    };

    saveAuthSession({ token, user: sessionUser });

    return sessionUser;
};

// API: POST /users/login
// Request: { user: { email, password } }
// Response: { auth: { id, username, email, token } }
export const loginUser = async ({ email, password }) => {
    const response = await api.post("/users/login", {
        user: { email, password },
    });
    return response.data;
};

// API: POST /user
// Request: { user: NewUserDto }
// Response: { auth: { id, username, email, token }, user: UserProfileDto }
export const registerUser = async (user) => {
    const response = await api.post("/user", { user });
    return response.data;
};

// Für Passwort-Reset gibt es aktuell noch keinen API-Endpunkt.
export const forgotPassword = async () => notImplemented("Passwort zurücksetzen");
export const verifyResetCode = async () => notImplemented("Code-Verifizierung");
export const resetPassword = async () => notImplemented("Neues Passwort setzen");
export const changePassword = async () => notImplemented("Passwort ändern");
