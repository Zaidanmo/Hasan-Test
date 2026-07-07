import { useEffect, useMemo, useState } from "react";
import { I18nContext, STORAGE_KEY, SUPPORTED_LANGUAGES } from "./I18nContext";
import { translations } from "./translations";
import { toLanguageOptionValue } from "../utils/languageUtils";

function getInitialLanguage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (SUPPORTED_LANGUAGES.includes(stored)) return stored;
    } catch {
        // Fall back to the browser language when localStorage is unavailable.
    }

    const browserLanguage = navigator.language?.toLowerCase().startsWith("de") ? "de" : "en";
    return SUPPORTED_LANGUAGES.includes(browserLanguage) ? browserLanguage : "de";
}

function interpolate(text, values = {}) {
    return Object.entries(values).reduce(
        (result, [key, value]) => result.replaceAll(`{${key}}`, String(value ?? "")),
        text
    );
}

function toLegacyLanguageKey(value) {
    const text = toLanguageOptionValue(value);
    return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : "";
}

export function I18nProvider({ children }) {
    const [language, setLanguageState] = useState(getInitialLanguage);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, language);
        } catch {
            // Language switching should still work for the current session.
        }

        document.documentElement.lang = language;
    }, [language]);

    const value = useMemo(() => {
        const t = (key, values) => {
            const text = translations[language]?.[key] ?? translations.de[key] ?? key;
            return interpolate(text, values);
        };

        const optionLabel = (value, fallback) => {
            if (value === undefined || value === null || value === "") return fallback ?? "";
            const textValue = String(value);
            const languageValue = toLanguageOptionValue(textValue);
            const legacyLanguageValue = toLegacyLanguageKey(textValue);
            return t(`option.${textValue}`) !== `option.${textValue}`
                ? t(`option.${textValue}`)
                : t(`language.${languageValue}`) !== `language.${languageValue}`
                    ? t(`language.${languageValue}`)
                    : t(`language.${legacyLanguageValue}`) !== `language.${legacyLanguageValue}`
                        ? t(`language.${legacyLanguageValue}`)
                        : fallback ?? textValue;
        };

        const setLanguage = (nextLanguage) => {
            if (SUPPORTED_LANGUAGES.includes(nextLanguage)) {
                setLanguageState(nextLanguage);
            }
        };

        return { language, setLanguage, t, optionLabel, supportedLanguages: SUPPORTED_LANGUAGES };
    }, [language]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
