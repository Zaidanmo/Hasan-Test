import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../components/layout/BottomNav";
import { DesktopSidebar } from "../components/layout/DesktopSidebar";
import { HeaderProfileLink } from "../components/layout/HeaderProfileLink";
import { FloatingBlobs } from "../components/ui/FloatingBlobs";
import { SwipeCard } from "../components/matching/SwipeCard";
import { ProfileDetailsModal } from "../components/matching/ProfileDetailsModal";
import { MatchModal } from "../components/matching/MatchModal";
import { MatchingInfoModal } from "../components/matching/MatchingInfoModal";
import { EmptyState } from "../components/matching/EmptyState";
import { SwipeButtons } from "../components/matching/SwipeButtons";
import { likeProfile } from "../api/matchApi";
import { useMatchSuggestions } from "../hooks/useMatchSuggestions";
import { useMutualMatches } from "../hooks/useMutualMatches";
import { useAuth } from "../auth/useAuth";
import { hasSeenMutualMatch, markMutualMatchAsSeen } from "../storage/matchNotificationStorage";
import { LanguageSwitcher } from "../components/ui/LanguageSwitcher";
import { useI18n } from "../i18n/useI18n";

export default function HomePage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { t } = useI18n();
    const {
        matches: profiles,
        loading,
        loadingMore,
        error,
        reload,
        updateMatch,
        ensureMoreMatches,
    } = useMatchSuggestions();
    const { matches: mutualMatches, reload: reloadMutualMatches } = useMutualMatches();
    const [gone, setGone] = useState(new Set());
    const [skippedIds, setSkippedIds] = useState(new Set());
    const [lastSwipe, setLastSwipe] = useState(null);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [matchedProfile, setMatchedProfile] = useState(null);
    const [showMatchingInfo, setShowMatchingInfo] = useState(false);
    const [buttonSwipe, setButtonSwipe] = useState(null);
    const [swipeError, setSwipeError] = useState("");
    const [pendingSwipeId, setPendingSwipeId] = useState(null);
    const swipeInFlightRef = useRef(new Set());

    const reviewableProfiles = profiles.filter((p) => !p.isLikedByCurrentUser && !p.isMutualMatch);
    const visible = reviewableProfiles.filter((p) => !gone.has(p.id));
    const hasSkippedProfiles = skippedIds.size > 0;
    const emptyVariant = !loading && !error && visible.length === 0
        ? profiles.length === 0
            ? "noProfiles"
            : hasSkippedProfiles
                ? "allSkipped"
                : reviewableProfiles.length === 0
                    ? "allRated"
                    : "allSeen"
        : null;
    const isEmpty = Boolean(emptyVariant);
    const topProfile = visible[0];
    const matchesCount = mutualMatches.length;

    useEffect(() => {
        const unseenMatch = mutualMatches.find((match) => !hasSeenMutualMatch(match.id));

        if (!unseenMatch || matchedProfile) return;

        markMutualMatchAsSeen(unseenMatch.id);
        const timeoutId = window.setTimeout(() => setMatchedProfile(unseenMatch), 0);

        return () => window.clearTimeout(timeoutId);
    }, [matchedProfile, mutualMatches]);

    useEffect(() => {
        if (!loading && !loadingMore && !error) {
            ensureMoreMatches(visible.length);
        }
    }, [ensureMoreMatches, error, loading, loadingMore, visible.length]);

    const handleSwipe = async (dir, id) => {
        const profile = profiles.find((p) => p.id === id);
        if (!profile || swipeInFlightRef.current.has(id)) return;

        setSelectedProfile(null);
        setButtonSwipe(null);
        setSwipeError("");
        setLastSwipe({ dir, id });
        setGone((prev) => new Set([...prev, id]));
        ensureMoreMatches(Math.max(visible.length - 1, 0));

        if (dir !== "right") {
            setSkippedIds((prev) => new Set([...prev, id]));
            return;
        }

        swipeInFlightRef.current.add(id);
        setPendingSwipeId(id);
        setSkippedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });

        try {
            const result = await likeProfile(id);
            const isMutualMatch = Boolean(result?.isMatch ?? result?.IsMatch);

            updateMatch(id, {
                isLikedByCurrentUser: true,
                isMutualMatch,
            });

            if (isMutualMatch) {
                markMutualMatchAsSeen(id);
                window.setTimeout(() => setMatchedProfile({ ...profile, isLikedByCurrentUser: true, isMutualMatch: true }), 360);
                reloadMutualMatches();
            }
        } catch (e) {
            setSwipeError(e.response?.data?.message || e.message || t("home.likeError"));
            setGone((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            setSkippedIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        } finally {
            swipeInFlightRef.current.delete(id);
            setPendingSwipeId((currentId) => currentId === id ? null : currentId);
        }
    };

    const triggerSwipe = (dir) => {
        if (!topProfile || buttonSwipe || pendingSwipeId) return;

        const profileId = topProfile.id;
        setButtonSwipe({ id: profileId, dir });
        window.setTimeout(() => handleSwipe(dir, profileId), 320);
    };

    const handleReset = () => {
        setGone((prev) => {
            const next = new Set(prev);
            skippedIds.forEach((id) => next.delete(id));
            return next;
        });
        setSkippedIds(new Set());
        setLastSwipe(null);
        setButtonSwipe(null);
        setSwipeError("");
        setPendingSwipeId(null);
    };

    const swipeStatus = lastSwipe?.dir === "right" ? t("home.savedInterest") : t("home.skipped");

    return (
        <div className="min-h-screen bg-ovgu-soft flex overflow-hidden">
            <DesktopSidebar active="suche" matchesCount={matchesCount} onLogout={logout} />

            <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
                <FloatingBlobs />

                <header className="lg:hidden relative z-10 flex items-center justify-between px-5 py-4 bg-white animate-slideInRight" style={{ borderBottom: "1px solid #E8D0DA" }}>
                    <span className="font-display text-xl font-bold text-ovgu-primary">
                        Link<span style={{ color: "#FFD400" }}>Up</span>
                    </span>
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher />
                        <HeaderProfileLink />
                    </div>
                </header>

                <main className="relative z-10 flex-1 px-4 sm:px-6 py-6 lg:py-10 overflow-y-auto">
                    <div className="max-w-6xl mx-auto grid lg:grid-cols-[minmax(0,1fr)_390px] gap-8 lg:gap-10 items-center min-h-full">
                        <section className="hidden lg:block">
                            <div className="animate-slideInRight" style={{ animationDelay: "0ms" }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="block w-2 h-2 rounded-full bg-ovgu-accent animate-pulseSoft" />
                                    <span className="text-xs font-semibold tracking-[0.2em] uppercase text-ovgu-accent">{t("home.kicker")}</span>
                                </div>
                                <h1 className="font-display text-5xl font-bold text-ovgu-ink leading-tight mb-4">
                                    {t("home.title").split("\n").map((line, index, lines) => (
                                        <span key={line}>{line}{index < lines.length - 1 && <br />}</span>
                                    ))}
                                </h1>
                                <p className="max-w-xl text-sm text-ovgu-muted leading-relaxed mb-7">
                                    {t("home.text")}
                                </p>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-3 max-w-2xl">
                                {[t("home.benefit.short"), t("home.benefit.details"), t("home.benefit.match")].map((text, index) => (
                                    <div
                                        key={text}
                                        className="rounded-2xl bg-white p-4 shadow-card animate-fadeUp hover-lift"
                                        style={{ animationDelay: `${120 + index * 70}ms` }}
                                    >
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold mb-3"
                                             style={{ background: "rgba(255,212,0,0.18)", color: "#7A003F" }}>
                                            {index + 1}
                                        </div>
                                        <p className="text-sm font-bold text-ovgu-ink">{text}</p>
                                    </div>
                                ))}
                            </div>

                            {lastSwipe && !isEmpty && (
                                <div
                                    className="animate-popIn mt-6 inline-flex px-4 py-2 rounded-full text-sm font-semibold"
                                    style={{
                                        background: lastSwipe.dir === "right" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.10)",
                                        color: lastSwipe.dir === "right" ? "#15803d" : "#dc2626",
                                        border: `1px solid ${lastSwipe.dir === "right" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.18)"}`,
                                    }}
                                >
                                    {swipeStatus}
                                </div>
                            )}

                            {swipeError && (
                                <div className="animate-popIn mt-3 inline-flex px-4 py-2 rounded-full text-sm font-semibold bg-red-50 text-red-600 border border-red-100">
                                    {swipeError}
                                </div>
                            )}
                        </section>

                        <section className="flex flex-col items-center">
                            <div className="lg:hidden text-center mb-5 animate-fadeUp">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-ovgu-accent mb-1">{t("home.kicker")}</p>
                                <h1 className="font-display text-3xl font-bold text-ovgu-ink">{t("home.mobileTitle")}</h1>
                                <p className="text-sm text-ovgu-muted mt-2">{t("home.mobileText")}</p>
                            </div>

                            {lastSwipe && !isEmpty && (
                                <div
                                    className="lg:hidden animate-popIn mb-4 px-4 py-1.5 rounded-full text-sm font-semibold"
                                    style={{
                                        background: lastSwipe.dir === "right" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.10)",
                                        color: lastSwipe.dir === "right" ? "#15803d" : "#dc2626",
                                        border: `1px solid ${lastSwipe.dir === "right" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.18)"}`,
                                    }}
                                >
                                    {swipeStatus}
                                </div>
                            )}

                            {swipeError && (
                                <div className="lg:hidden animate-popIn mb-4 px-4 py-1.5 rounded-full text-sm font-semibold bg-red-50 text-red-600 border border-red-100">
                                    {swipeError}
                                </div>
                            )}

                            <div className="relative w-full max-w-sm animate-fadeUp" style={{ height: "min(510px, 72vh)", animationDelay: "120ms" }}>
                                {loading ? (
                                    <div className="h-full rounded-3xl bg-white shadow-card flex items-center justify-center p-8 text-center animate-popIn">
                                        <div>
                                            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-ovgu-primary/10 flex items-center justify-center animate-pulseSoft">⏳</div>
                                            <p className="font-display font-bold text-ovgu-ink">{t("home.loadingProfiles")}</p>
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className="h-full rounded-3xl bg-white shadow-card flex items-center justify-center p-8 text-center animate-popIn">
                                        <div>
                                            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">⚠️</div>
                                            <h3 className="font-display text-xl font-bold text-ovgu-ink mb-2">{t("home.loadErrorTitle")}</h3>
                                            <p className="text-sm text-ovgu-muted mb-5">{t("home.loadErrorText")}</p>
                                            <button
                                                onClick={reload}
                                                className="relative inline-flex rounded-xl px-5 py-3 font-display font-bold text-sm overflow-hidden"
                                                style={{ background: "#FFD400", color: "#5F002F" }}
                                            >
                                                <span className="absolute inset-0 shimmer-bar opacity-0 hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                                                <span className="relative">{t("common.retry")}</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : isEmpty ? (
                                    <div className="h-full rounded-3xl bg-white shadow-card">
                                        <EmptyState variant={emptyVariant} onReset={handleReset} />
                                    </div>
                                ) : (
                                    [...visible].slice(0, 3).reverse().map((profile) => {
                                        const stackIndex = visible.findIndex((item) => item.id === profile.id);
                                        return (
                                            <SwipeCard
                                                key={profile.id}
                                                profile={profile}
                                                onSwipe={handleSwipe}
                                                onOpenDetails={setSelectedProfile}
                                                isTop={profile.id === topProfile?.id}
                                                stackIndex={stackIndex}
                                                buttonSwipe={buttonSwipe}
                                            />
                                        );
                                    })
                                )}
                            </div>

                            {!loading && !error && !isEmpty && (
                                <>
                                    <SwipeButtons
                                        onLeft={() => triggerSwipe("left")}
                                        onInfo={() => setShowMatchingInfo(true)}
                                        onRight={() => triggerSwipe("right")}
                                        disabled={Boolean(pendingSwipeId || loadingMore)}
                                    />
                                    <p className="text-xs text-ovgu-muted mt-4 animate-fadeUp" style={{ animationDelay: "360ms" }}>{t("home.swipeHint")}</p>
                                    {loadingMore && (
                                        <p className="text-xs font-semibold text-ovgu-muted mt-2 animate-pulseSoft">{t("home.loadingMore")}</p>
                                    )}
                                </>
                            )}
                        </section>
                    </div>
                </main>

                <BottomNav active="suche" />
            </div>

            <ProfileDetailsModal
                profile={selectedProfile}
                onClose={() => setSelectedProfile(null)}
            />

            <MatchingInfoModal
                open={showMatchingInfo}
                onClose={() => setShowMatchingInfo(false)}
            />

            <MatchModal
                profile={matchedProfile}
                onClose={() => setMatchedProfile(null)}
                onOpenContacts={() => {
                    setMatchedProfile(null);
                    navigate("/kontakte");
                }}
            />
        </div>
    );
}
