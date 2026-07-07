const getTranslatedFallback = (t, fallbackKey) =>
    typeof t === "function" ? t(fallbackKey) : "Etwas ist schiefgelaufen.";

const normalizeBackendMessage = (message, t) => {
    if (!message || typeof message !== "string") return "";

    const trimmed = message.trim();
    if (!trimmed) return "";
    const normalized = trimmed.toLowerCase();

    if (normalized === "validation failed.") {
        return t("common.error.validation");
    }

    if (/username\s+or\s+e-?mail/.test(normalized) && /(already|in use)/.test(normalized)) {
        return t("common.error.usernameOrEmailTaken");
    }

    if (/username/.test(normalized) && /(already exists|already in use|in use)/.test(normalized)) {
        return t("common.error.usernameTaken");
    }

    if (/e-?mail|email/.test(normalized) && /(already exists|already in use|in use)/.test(normalized)) {
        return t("common.error.emailTaken");
    }

    return trimmed;
};

const formatValidationErrors = (errors, t) => {
    if (!Array.isArray(errors) || errors.length === 0) return "";

    const messages = errors
        .map((error) => normalizeBackendMessage(error?.message, t))
        .filter(Boolean);

    if (!messages.length) return "";

    return [...new Set(messages)].join(" ");
};

export const getApiErrorMessage = (error, t, fallbackKey = "common.error.generic") => {
    const status = error?.response?.status;

    if (status === 429) {
        return t("common.error.tooManyRequests");
    }

    const data = error?.response?.data;
    const validationMessage = formatValidationErrors(data?.errors, t);

    if (validationMessage) {
        return validationMessage;
    }

    const backendMessage = normalizeBackendMessage(data?.message, t);

    return backendMessage || getTranslatedFallback(t, fallbackKey);
};

export const isUsernameOrEmailConflict = (error) => {
    if (error?.response?.status !== 409) return false;

    const message = String(error?.response?.data?.message ?? "").toLowerCase();

    return /username|e-?mail|email/.test(message) && /(already|in use|exists)/.test(message);
};
