import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMatches } from "../api/matchApi";
import { getPagedResultInfo, normalizeMatches } from "../utils/matchMapper";

const FIRST_PAGE = 1;
const PAGE_SIZE = 20;
const PREFETCH_THRESHOLD = 5;

function getErrorMessage(error) {
    const status = error?.response?.status;

    if (status === 401) {
        return "Du bist nicht eingeloggt oder dein Login ist abgelaufen.";
    }

    if (status === 404) {
        return "Die Matching-Funktion ist gerade nicht verfügbar. Bitte versuche es später erneut.";
    }

    if (error?.message) {
        return error.message;
    }

    return "Matches konnten nicht geladen werden.";
}

function mergeById(currentMatches, incomingMatches) {
    const byId = new Map(currentMatches.map((match) => [match.id, match]));

    incomingMatches.forEach((match) => {
        byId.set(match.id, { ...byId.get(match.id), ...match });
    });

    return Array.from(byId.values()).sort((a, b) => b.matchScore - a.matchScore);
}

export function useMatchSuggestions() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [pageInfo, setPageInfo] = useState({
        page: FIRST_PAGE,
        pageSize: PAGE_SIZE,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    });

    const loadedPagesRef = useRef(new Set());
    const requestIdRef = useRef(0);

    const loadPage = useCallback(async (page = FIRST_PAGE, { replace = false } = {}) => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        try {
            if (replace) {
                setLoading(true);
                setError("");
                loadedPagesRef.current = new Set();
            } else {
                setLoadingMore(true);
            }

            const data = await getMatches({ page, pageSize: PAGE_SIZE });
            const normalized = normalizeMatches(data);
            const info = getPagedResultInfo(data);

            if (requestId !== requestIdRef.current) return;

            loadedPagesRef.current.add(info.page || page);
            setPageInfo((current) => ({ ...current, ...info }));
            setMatches((current) => (replace ? normalized : mergeById(current, normalized)));
        } catch (err) {
            if (replace) {
                setMatches([]);
            }
            setError(getErrorMessage(err));
        } finally {
            if (requestId === requestIdRef.current) {
                if (replace) {
                    setLoading(false);
                }
                setLoadingMore(false);
            }
        }
    }, []);

    const loadMatches = useCallback(() => loadPage(FIRST_PAGE, { replace: true }), [loadPage]);

    useEffect(() => {
        loadMatches();
    }, [loadMatches]);

    const loadNextPage = useCallback(async () => {
        if (loading || loadingMore || !pageInfo.hasNextPage) return;

        const nextPage = pageInfo.page + 1;
        if (loadedPagesRef.current.has(nextPage)) return;

        await loadPage(nextPage, { replace: false });
    }, [loadPage, loading, loadingMore, pageInfo.hasNextPage, pageInfo.page]);

    const removeMatch = useCallback((id) => {
        setMatches((current) => current.filter((match) => match.id !== id));
    }, []);

    const updateMatch = useCallback((id, updates) => {
        setMatches((current) => current.map((match) => (
            match.id === id ? { ...match, ...updates } : match
        )));
    }, []);

    const ensureMoreMatches = useCallback((remainingCount) => {
        if (remainingCount <= PREFETCH_THRESHOLD) {
            void loadNextPage();
        }
    }, [loadNextPage]);

    const hasNextPage = useMemo(() => pageInfo.hasNextPage, [pageInfo.hasNextPage]);

    return {
        matches,
        loading,
        loadingMore,
        error,
        pageInfo,
        hasNextPage,
        reload: loadMatches,
        loadNextPage,
        removeMatch,
        updateMatch,
        ensureMoreMatches,
    };
}
