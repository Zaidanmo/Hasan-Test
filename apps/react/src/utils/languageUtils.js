import { languageLevels } from "../data/profileOptions";

const validLevelValues = languageLevels.map((level) => level.value);

export function toLanguageOptionValue(value) {
    return String(value ?? "").trim();
}

export function getLanguageName(language) {
    const value = typeof language === "string"
        ? language
        : language?.language ?? language?.Language ?? "";

    return toLanguageOptionValue(value);
}

export function getLanguageLevel(language, fallback = "A2") {
    if (typeof language === "string") return fallback;
    return language?.level ?? language?.Level ?? fallback;
}

export function normalizeUserLanguage(language, fallbackLevel = "A2") {
    const name = toLanguageOptionValue(getLanguageName(language));
    const level = getLanguageLevel(language, fallbackLevel);

    if (!name) return null;

    return {
        language: name,
        level: validLevelValues.includes(level) ? level : fallbackLevel,
    };
}

export function normalizeUserLanguages(languages) {
    if (!Array.isArray(languages)) return [];

    const seen = new Set();

    return languages
        .map((language) => normalizeUserLanguage(language))
        .filter(Boolean)
        .filter((language) => {
            const key = language.language.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
}

export function toApiUserLanguage(language) {
    const normalized = normalizeUserLanguage(language);

    if (!normalized) return null;

    return {
        Language: normalized.language,
        Level: normalized.level,
    };
}

export function toApiUserLanguages(languages) {
    return normalizeUserLanguages(languages)
        .map(toApiUserLanguage)
        .filter(Boolean);
}

export function getTargetLanguageName(user, fallback = "") {
    return getLanguageName(user?.targetLanguage ?? user?.TargetLanguage) || fallback;
}

export function getTargetLanguageLevel(user, fallback = "B2") {
    return getLanguageLevel(user?.targetLanguage ?? user?.TargetLanguage, user?.searchedLevel ?? fallback);
}

export function formatLanguageLevel(language) {
    const normalized = normalizeUserLanguage(language);

    if (!normalized) return "";

    return `${normalized.language} ${normalized.level}`;
}

export function formatLanguageList(languages) {
    const formatted = normalizeUserLanguages(languages)
        .map(formatLanguageLevel)
        .filter(Boolean);

    return formatted.length ? formatted.join(" · ") : "Keine Angabe";
}
