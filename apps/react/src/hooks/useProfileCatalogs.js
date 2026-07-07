import { useEffect, useMemo, useState } from "react";
import {
    getCachedProfileCatalogs,
    getProfileCatalogs,
    getProfileCatalogsTimeUntilRefreshMs,
} from "../api/catalogApi";
import { normalizeProfileOptions } from "../data/profileOptions";

const emptyCatalogs = {
    languages: [],
    hobbies: [],
    learningGoals: [],
    tandemForms: [],
    tandemFrequencies: [],
};

function normalizeCatalogs(catalogs) {
    const languages = normalizeProfileOptions(catalogs?.languages);
    const hobbies = normalizeProfileOptions(catalogs?.hobbies);
    const learningGoals = normalizeProfileOptions(catalogs?.learningGoals);
    const tandemForms = normalizeProfileOptions(catalogs?.tandemForms);
    const tandemFrequencies = normalizeProfileOptions(catalogs?.tandemFrequencies);

    return {
        languages,
        hobbies,
        learningGoals,
        tandemForms,
        tandemFrequencies,
    };
}

export function useProfileCatalogs() {
    const [catalogs, setCatalogs] = useState(() => getCachedProfileCatalogs() ?? emptyCatalogs);
    const [loading, setLoading] = useState(() => !getCachedProfileCatalogs());
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        let refreshTimeoutId = null;

        const scheduleRefresh = () => {
            if (refreshTimeoutId) {
                window.clearTimeout(refreshTimeoutId);
            }

            const refreshDelay = getProfileCatalogsTimeUntilRefreshMs();

            if (refreshDelay <= 0) return;

            refreshTimeoutId = window.setTimeout(() => {
                void loadCatalogs({ forceRefresh: true, showLoading: false });
            }, refreshDelay);
        };

        const loadCatalogs = async ({ forceRefresh = false, showLoading = true } = {}) => {
            if (!forceRefresh) {
                const cachedCatalogs = getCachedProfileCatalogs();

                if (cachedCatalogs) {
                    if (active) {
                        setCatalogs(cachedCatalogs);
                        setLoading(false);
                    }

                    scheduleRefresh();
                    return;
                }
            }

            if (showLoading) {
                setLoading(true);
            }

            try {
                const nextCatalogs = await getProfileCatalogs({ forceRefresh });

                if (active) {
                    setCatalogs(nextCatalogs);
                    setError("");
                    scheduleRefresh();
                }
            } catch (requestError) {
                if (active) {
                    setError(requestError?.message ?? "Catalogs konnten nicht geladen werden.");
                    if (showLoading) {
                        setCatalogs(emptyCatalogs);
                    }
                }
            } finally {
                if (active && showLoading) {
                    setLoading(false);
                }
            }
        };

        void loadCatalogs();

        return () => {
            active = false;
            if (refreshTimeoutId) {
                window.clearTimeout(refreshTimeoutId);
            }
        };
    }, []);

    const options = useMemo(() => normalizeCatalogs(catalogs), [catalogs]);

    return {
        ...options,
        loading,
        error,
    };
}
