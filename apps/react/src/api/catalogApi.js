import api from "./index";

export const PROFILE_CATALOGS_TTL_MS = 10 * 60 * 1000;

const PROFILE_CATALOGS_STORAGE_KEY = "linkup.profileCatalogs.v3";

let profileCatalogsCache = null;
let profileCatalogsCacheAt = 0;
let profileCatalogsPromise = null;

const emptyProfileCatalogs = {
    languages: [],
    hobbies: [],
    learningGoals: [],
    tandemForms: [],
    tandemFrequencies: [],
};

const canUseSessionStorage = () => typeof window !== "undefined" && typeof sessionStorage !== "undefined";
const now = () => Date.now();

function isFreshCache(cachedAt) {
    return Number.isFinite(cachedAt) && now() - cachedAt < PROFILE_CATALOGS_TTL_MS;
}

const unwrapCatalog = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.Items)) return data.Items;
    return [];
};

const getCatalog = async (path) => {
    const response = await api.get(path);
    return unwrapCatalog(response.data);
};

export const getHobbiesCatalog = () => getCatalog("/catalogs/hobbies");
export const getLearningGoalsCatalog = () => getCatalog("/catalogs/learning-goals");
export const getTandemFormsCatalog = () => getCatalog("/catalogs/tandem-forms");
export const getTandemFrequenciesCatalog = () => getCatalog("/catalogs/tandem-frequencies");
export const getLanguagesCatalog = () => getCatalog("/catalogs/languages");

function readStoredProfileCatalogs() {
    if (!canUseSessionStorage()) return null;

    try {
        const storedEntry = JSON.parse(sessionStorage.getItem(PROFILE_CATALOGS_STORAGE_KEY) || "null");

        if (!storedEntry || typeof storedEntry !== "object") return null;

        const cachedAt = Number(storedEntry.cachedAt);
        const catalogs = storedEntry.catalogs;

        if (!catalogs || typeof catalogs !== "object" || !isFreshCache(cachedAt)) {
            sessionStorage.removeItem(PROFILE_CATALOGS_STORAGE_KEY);
            return null;
        }

        return { cachedAt, catalogs };
    } catch {
        return null;
    }
}

function writeStoredProfileCatalogs(catalogs, cachedAt) {
    if (!canUseSessionStorage()) return;

    try {
        sessionStorage.setItem(PROFILE_CATALOGS_STORAGE_KEY, JSON.stringify({ cachedAt, catalogs }));
    } catch {
        // Catalogs remain available in memory when browser storage is unavailable.
    }
}

function setProfileCatalogsCache(catalogs, cachedAt = now()) {
    profileCatalogsCache = {
        ...emptyProfileCatalogs,
        ...catalogs,
    };
    profileCatalogsCacheAt = cachedAt;

    writeStoredProfileCatalogs(profileCatalogsCache, profileCatalogsCacheAt);

    return profileCatalogsCache;
}

export function getCachedProfileCatalogs() {
    if (profileCatalogsCache && isFreshCache(profileCatalogsCacheAt)) return profileCatalogsCache;

    profileCatalogsCache = null;
    profileCatalogsCacheAt = 0;

    const storedEntry = readStoredProfileCatalogs();
    if (!storedEntry) return null;

    return setProfileCatalogsCache(storedEntry.catalogs, storedEntry.cachedAt);
}

export function getProfileCatalogsTimeUntilRefreshMs() {
    if (!getCachedProfileCatalogs()) return 0;

    return Math.max(PROFILE_CATALOGS_TTL_MS - (now() - profileCatalogsCacheAt), 0);
}

export function clearProfileCatalogsCache() {
    profileCatalogsCache = null;
    profileCatalogsCacheAt = 0;
    profileCatalogsPromise = null;

    if (canUseSessionStorage()) {
        try {
            sessionStorage.removeItem(PROFILE_CATALOGS_STORAGE_KEY);
        } catch {
            // Ignore storage cleanup failures.
        }
    }
}

export const getProfileCatalogs = async ({ forceRefresh = false } = {}) => {
    if (!forceRefresh) {
        const cachedCatalogs = getCachedProfileCatalogs();
        if (cachedCatalogs) return cachedCatalogs;
    }

    if (profileCatalogsPromise) return profileCatalogsPromise;

    profileCatalogsPromise = Promise.all([
        getLanguagesCatalog(),
        getHobbiesCatalog(),
        getLearningGoalsCatalog(),
        getTandemFormsCatalog(),
        getTandemFrequenciesCatalog(),
    ])
        .then(([languages, hobbies, learningGoals, tandemForms, tandemFrequencies]) =>
            setProfileCatalogsCache({
                languages,
                hobbies,
                learningGoals,
                tandemForms,
                tandemFrequencies,
            })
        )
        .finally(() => {
            profileCatalogsPromise = null;
        });

    return profileCatalogsPromise;
};
