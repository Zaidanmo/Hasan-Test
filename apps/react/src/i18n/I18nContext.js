import { createContext } from "react";

export const STORAGE_KEY = "linkup.language";
export const SUPPORTED_LANGUAGES = ["de", "en"];
export const I18nContext = createContext(null);
