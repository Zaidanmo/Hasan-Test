import { useCallback, useEffect, useState } from "react";
import { getMutualMatches } from "../api/matchApi";
import { normalizeMatches } from "../utils/matchMapper";

function getErrorMessage(error) {
    const status = error?.response?.status;

    if (status === 401) {
        return "Du bist nicht eingeloggt oder dein Login ist abgelaufen.";
    }

    if (status === 404) {
        return "Deine Kontakte sind gerade nicht verfügbar. Bitte versuche es später erneut.";
    }

    if (error?.message) {
        return error.message;
    }

    return "Kontakte konnten nicht geladen werden.";
}

export function useMutualMatches() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadMatches = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getMutualMatches();
            setMatches(normalizeMatches(data, { forceMutualMatch: true }));
        } catch (err) {
            setMatches([]);
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMatches();
    }, [loadMatches]);

    return {
        matches,
        loading,
        error,
        reload: loadMatches,
    };
}
