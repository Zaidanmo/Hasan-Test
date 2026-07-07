import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BottomNav } from "../components/layout/BottomNav";
import { HeaderProfileLink } from "../components/layout/HeaderProfileLink";
import { getCurrentUser, getUserById } from "../api/userApi";
import { useMutualMatches } from "../hooks/useMutualMatches";
import { normalizeContactProfileDetails } from "../utils/matchMapper";
import {
    getCatalogLabel,
} from "../utils/profileFormatters";
import { LanguageSwitcher } from "../components/ui/LanguageSwitcher";
import { useI18n } from "../i18n/useI18n";
import { useProfileCatalogs } from "../hooks/useProfileCatalogs";
import { ProfileAvatar } from "../components/profile/ProfileAvatar";

function PageBlobs() {
    return (
        <>
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full translate-x-1/3 -translate-y-1/3 animate-floatBlob pointer-events-none" style={{ background: "rgba(122,0,63,0.055)", animationDuration: "7s" }} />
            <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full -translate-x-1/3 translate-y-1/3 animate-floatBlob pointer-events-none" style={{ background: "rgba(255,105,120,0.09)", animationDuration: "9s", animationDelay: "2s" }} />
            <div className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full -translate-x-1/2 -translate-y-1/2 animate-floatBlob pointer-events-none" style={{ background: "rgba(255,212,0,0.12)", animationDuration: "11s", animationDelay: "1s" }} />
        </>
    );
}

function getFullName(match) {
    return [match?.firstName, match?.surname].filter(Boolean).join(" ") || match?.username || "Match";
}

function getField(value, ...keys) {
    for (const key of keys) {
        if (value?.[key] !== undefined && value?.[key] !== null) {
            return value[key];
        }
    }

    return undefined;
}

function hasContent(value) {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && String(value).trim() !== "";
}

function displayValue(value, fallback) {
    if (!hasContent(value)) return fallback;
    return String(value);
}

function formatLanguageLevel(level, optionLabel) {
    if (!hasContent(level)) return "";
    return optionLabel(String(level), String(level));
}

function formatLanguage(language, optionLabel) {
    if (!language) return "";

    if (typeof language === "string") {
        return optionLabel(language, language);
    }

    const name = optionLabel(getField(language, "language", "Language"), getField(language, "language", "Language"));
    const level = formatLanguageLevel(getField(language, "level", "Level"), optionLabel);

    return [name, level].filter(Boolean).join(" · ");
}

function formatList(values, formatter = (value) => value) {
    if (!Array.isArray(values)) return [];

    return values
        .map((value) => formatter(value))
        .filter(Boolean)
        .filter((value, index, list) => list.indexOf(value) === index);
}

function DetailChip({ children, variant = "default" }) {
    const styles = variant === "success"
        ? { background: "rgba(34,197,94,0.10)", color: "#15803d" }
        : { background: "rgba(122,0,63,0.08)", color: "#7A003F" };

    return (
        <span className="rounded-full px-3 py-1 text-xs font-bold" style={styles}>
            {children}
        </span>
    );
}

function DetailTile({ label, value, highlight = false }) {
    const { t } = useI18n();
    return (
        <div
            className="rounded-2xl p-4 border animate-fadeUp"
            style={{
                borderColor: highlight ? "rgba(255,212,0,0.45)" : "#E8D0DA",
                background: highlight ? "rgba(255,212,0,0.10)" : "#fff",
            }}
        >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-ovgu-muted mb-1">{label}</p>
            <p className="font-semibold text-ovgu-ink break-words">{displayValue(value, t("common.notSpecified"))}</p>
        </div>
    );
}

function DetailSection({ title, children }) {
    return (
        <div className="rounded-2xl p-4 border animate-fadeUp" style={{ borderColor: "#E8D0DA", background: "#fff" }}>
            <h3 className="font-display font-bold text-ovgu-ink mb-3">{title}</h3>
            {children}
        </div>
    );
}

function ChipList({ items, emptyText, variant }) {
    if (!items.length) {
        return <p className="text-sm text-ovgu-muted">{emptyText}</p>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item) => (
                <DetailChip key={item} variant={variant}>{item}</DetailChip>
            ))}
        </div>
    );
}

function unwrapUserProfile(data) {
    return data?.user ?? data?.User ?? data ?? null;
}

function MutualMatchCard({ match, index, onOpen }) {
    const { t, optionLabel } = useI18n();
    const catalogOptions = useProfileCatalogs();
    const displayInterests = formatList(
        match.commonHobbies,
        (value) => getCatalogLabel(catalogOptions.hobbies, value, optionLabel)
    );

    return (
        <button
            type="button"
            onClick={() => onOpen(match)}
            className="w-full text-left block rounded-3xl bg-white p-4 shadow-card hover:shadow-cardHov transition-all hover-lift animate-slideInRight focus:outline-none focus:ring-4 focus:ring-ovgu-accent/30"
            style={{ animationDelay: `${80 + index * 70}ms` }}
            aria-label={t("contacts.openProfileAria", { name: getFullName(match) })}
        >
            <div className="flex items-center gap-4">
                <ProfileAvatar
                    userId={match.userId || match.id}
                    hasProfilePicture={match.hasProfilePicture}
                    fallback={match.avatarInitial}
                    color={match.avatarColor}
                    className="h-14 w-14 animate-stepPop"
                    textClassName="text-2xl"
                    imageAlt={getFullName(match)}
                />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="font-display text-lg font-bold text-ovgu-ink truncate">
                            {match.firstName || match.username}
                        </h2>
                        <span className="text-xs font-bold rounded-full px-2 py-1 animate-pulseSoft" style={{ background: "rgba(34,197,94,0.1)", color: "#15803d" }}>
                            Match
                        </span>
                    </div>
                    <p className="text-sm font-semibold text-ovgu-muted truncate">
                        {[match.country, match.studyProgram].filter(Boolean).join(" · ") || t("contacts.cardSubtitle")}
                    </p>
                    <p className="text-sm text-ovgu-muted truncate mt-1">
                        {t("contacts.mutualText")}
                    </p>
                    {displayInterests.length > 0 && (
                        <p className="text-xs text-ovgu-muted truncate mt-1">
                            {t("contacts.common", { items: displayInterests.slice(0, 3).join(" · ") })}
                        </p>
                    )}
                    <p className="text-xs font-bold text-ovgu-primary mt-2">
                        {t("contacts.openProfile")}
                    </p>
                </div>
            </div>
        </button>
    );
}

function ContactDetailModal({ match, loading, error, onClose }) {
    const { t, optionLabel, language } = useI18n();
    const catalogOptions = useProfileCatalogs();
    if (!match) return null;

    const displayInterests = formatList(match.hobbies, (value) => getCatalogLabel(catalogOptions.hobbies, value, optionLabel));
    const displayLearningGoals = formatList(
        match.learningGoals,
        (value) => getCatalogLabel(catalogOptions.learningGoals, value, optionLabel)
    );
    const commonInterests = formatList(match.commonHobbies, (value) => getCatalogLabel(catalogOptions.hobbies, value, optionLabel));
    const commonLearningGoals = formatList(
        match.commonLearningGoals,
        (value) => getCatalogLabel(catalogOptions.learningGoals, value, optionLabel)
    );
    const languages = formatList(match.languages, (value) => formatLanguage(value, optionLabel));
    const targetLanguage = formatLanguage(match.targetLanguage, optionLabel);
    const fullName = getFullName(match);
    const matchScore = Number(match.matchScore ?? match.compatibility ?? 0);
    const tandemForm = getCatalogLabel(catalogOptions.tandemForms, match.tandemForm, optionLabel);
    const tandemFrequency = getCatalogLabel(catalogOptions.tandemFrequencies, match.tandemFrequency, optionLabel);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-3 py-4 animate-fadeUp" onClick={onClose}>
            <section
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white p-5 sm:p-6 shadow-card animate-popIn"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={t("contacts.modalAria", { name: fullName })}
            >
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4 min-w-0">
                        <ProfileAvatar
                            userId={match.userId || match.id}
                            hasProfilePicture={match.hasProfilePicture}
                            fallback={match.avatarInitial}
                            color={match.avatarColor}
                            className="h-16 w-16"
                            textClassName="text-3xl"
                            imageAlt={fullName}
                        />
                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-ovgu-accent">{t("contacts.modalKicker")}</p>
                            <h2 className="font-display text-2xl font-bold text-ovgu-ink truncate">{fullName}</h2>
                            <p className="text-sm text-ovgu-muted truncate">@{match.username}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold transition-all hover:scale-105 shrink-0"
                        style={{ background: "#F7EEF3", color: "#7A003F" }}
                        aria-label={t("contacts.closeAria")}
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="rounded-2xl p-4" style={{ background: "#F7EEF3" }}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-ovgu-muted mb-1">{t("contacts.contact")}</p>
                                {loading ? (
                                    <p className="text-sm font-semibold text-ovgu-muted">{t("contacts.loadingDetails")}</p>
                                ) : match.email ? (
                                    <a href={`mailto:${match.email}`} className="font-display text-lg font-bold text-ovgu-primary break-all hover:underline">
                                        {match.email}
                                    </a>
                                ) : error ? (
                                    <p className="text-sm font-semibold text-ovgu-muted">{error}</p>
                                ) : (
                                    <p className="text-sm font-semibold text-ovgu-muted">
                                        {t("contacts.noEmail")}
                                    </p>
                                )}
                            </div>
                            <DetailChip variant="success">{t("contacts.confirmed")}</DetailChip>
                        </div>
                        <p className="text-xs text-ovgu-muted mt-2">
                            {t("contacts.detailsHint")}
                        </p>
                    </div>

                    {error && !loading && match.email && (
                        <p className="rounded-2xl px-4 py-3 text-sm font-semibold bg-red-50 text-red-600 border border-red-100">
                            {error}
                        </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DetailTile label={t("contacts.country")} value={match.country} />
                        <DetailTile label={t("contacts.study")} value={match.studyProgram || match.degree} />
                        <DetailTile label={t("profile.nativeLanguage")} value={optionLabel(match.motherLanguage || match.nativeLanguage, match.motherLanguage || match.nativeLanguage)} />
                        <DetailTile label={t("contacts.targetLanguage")} value={targetLanguage} />
                        <DetailTile label={t("contacts.format")} value={tandemForm} />
                        <DetailTile label={t("contacts.meeting")} value={tandemFrequency} />
                        {matchScore > 0 && <DetailTile label={t("profile.score")} value={`${matchScore} ${t("common.points")}`} highlight />}
                    </div>

                    <DetailSection title={t("contacts.about")}>
                        <p className="text-sm text-ovgu-ink leading-relaxed">
                            {displayValue(match.bio, t("contacts.noBio"))}
                        </p>
                    </DetailSection>

                    <DetailSection title={t("contacts.languages")}>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-ovgu-muted mb-2">{t("contacts.speaks")}</p>
                                <ChipList items={languages} emptyText={t("contacts.noLanguages")} />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-ovgu-muted mb-2">{t("contacts.wantsPractice")}</p>
                                <ChipList items={targetLanguage ? [targetLanguage] : []} emptyText={t("contacts.noTarget")} variant="success" />
                            </div>
                        </div>
                    </DetailSection>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <DetailSection title={t("contacts.interests")}>
                            <ChipList items={displayInterests} emptyText={t("contacts.noInterests")} />
                            {hasContent(match.distinctHobby) && (
                                <p className="text-sm text-ovgu-muted mt-3">
                                    <span className="font-bold text-ovgu-ink">{t("contacts.moreInterest")}</span> {match.distinctHobby}
                                </p>
                            )}
                        </DetailSection>

                        <DetailSection title={t("profile.learningGoals")}>
                            <ChipList items={displayLearningGoals} emptyText={t("contacts.noGoals")} />
                        </DetailSection>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <DetailSection title={t("profile.commonInterests")}>
                            <ChipList items={commonInterests} emptyText={t("contacts.noCommonInterests")} variant="success" />
                        </DetailSection>

                        <DetailSection title={t("contacts.commonGoals")}>
                            <ChipList items={commonLearningGoals} emptyText={t("contacts.noCommonGoals")} variant="success" />
                        </DetailSection>
                    </div>

                    {hasContent(match.matchReason) && (
                        <DetailSection title={t("contacts.whyFit")}>
                            <p className="text-sm text-ovgu-ink leading-relaxed">{language === "de" ? match.matchReason : t("profile.goodFitDefault")}</p>
                        </DetailSection>
                    )}
                </div>
            </section>
        </div>
    );
}

export default function ContactsPage() {
    const { t } = useI18n();
    const { matches, loading, error, reload } = useMutualMatches();
    const [enrichedMatches, setEnrichedMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState("");
    const detailsCacheRef = useRef(new Map());
    const currentProfileRef = useRef(null);

    const getCachedCurrentProfile = useCallback(async () => {
        if (currentProfileRef.current) {
            return currentProfileRef.current;
        }

        const currentProfile = unwrapUserProfile(await getCurrentUser());
        currentProfileRef.current = currentProfile;
        return currentProfile;
    }, []);

    useEffect(() => {
        let active = true;
        const matchesWithCache = matches.map((match) => {
            const id = match.userId || match.id;
            return detailsCacheRef.current.get(id) || match;
        });

        setEnrichedMatches(matchesWithCache);

        const matchesToHydrate = matches.filter((match) => {
            const id = match.userId || match.id;
            return id && !detailsCacheRef.current.has(id);
        });

        if (matchesToHydrate.length === 0) {
            return () => {
                active = false;
            };
        }

        (async () => {
            let currentProfile = null;

            try {
                currentProfile = await getCachedCurrentProfile();
            } catch (requestError) {
                console.error("Could not load current profile for contact enrichment", requestError);
            }

            const results = await Promise.allSettled(
                matchesToHydrate.map(async (match) => {
                    const matchId = match.userId || match.id;
                    const profileDetails = await getUserById(matchId);
                    return normalizeContactProfileDetails(profileDetails, match, currentProfile);
                })
            );

            if (!active) return;

            const hydratedMatches = [];

            results.forEach((result) => {
                if (result.status === "fulfilled") {
                    const hydratedMatch = result.value;
                    const hydratedMatchId = hydratedMatch.userId || hydratedMatch.id;

                    detailsCacheRef.current.set(hydratedMatchId, hydratedMatch);
                    hydratedMatches.push(hydratedMatch);
                } else {
                    console.error("Could not preload contact profile details", result.reason);
                }
            });

            if (hydratedMatches.length === 0) return;

            setEnrichedMatches(matches.map((match) => {
                const id = match.userId || match.id;
                return detailsCacheRef.current.get(id) || match;
            }));
        })();

        return () => {
            active = false;
        };
    }, [getCachedCurrentProfile, matches]);

    const openMatchDetails = async (match) => {
        const matchId = match.userId || match.id;
        const cachedMatch = detailsCacheRef.current.get(matchId);

        setSelectedMatch(cachedMatch || match);
        setDetailsError("");

        if (cachedMatch) {
            setDetailsLoading(false);
            return;
        }

        setDetailsLoading(true);

        try {
            const [profileDetails, currentProfile] = await Promise.all([
                getUserById(matchId),
                getCachedCurrentProfile(),
            ]);
            const normalizedProfile = normalizeContactProfileDetails(profileDetails, match, currentProfile);

            detailsCacheRef.current.set(matchId, normalizedProfile);
            setSelectedMatch(normalizedProfile);
            setEnrichedMatches((currentMatches) => currentMatches.map((currentMatch) =>
                (currentMatch.userId || currentMatch.id) === matchId
                    ? normalizedProfile
                    : currentMatch
            ));
        } catch (requestError) {
            console.error("Could not load contact profile details", requestError);
            setDetailsError(t("contacts.detailsError"));
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeMatchDetails = () => {
        setSelectedMatch(null);
        setDetailsLoading(false);
        setDetailsError("");
    };

    const contactMatches = enrichedMatches.length > 0 ? enrichedMatches : matches;

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "#F7EEF3" }}>
            <PageBlobs />

            <header className="relative z-10 flex items-center justify-between px-5 py-4 bg-white animate-slideInRight" style={{ borderBottom: "1px solid #E8D0DA" }}>
                <Link to="/home" className="flex min-h-9 items-center whitespace-nowrap font-display text-xl font-bold text-ovgu-primary hover:opacity-80 transition-opacity">
                    Link<span style={{ color: "#FFD400" }}>Up</span>
                </Link>
                <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    <HeaderProfileLink />
                </div>
            </header>

            <main className="relative z-10 flex-1 px-5 py-6 max-w-2xl w-full mx-auto">
                <div className="mb-6 animate-fadeUp">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="block w-2 h-2 rounded-full bg-ovgu-accent animate-pulseSoft" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-ovgu-accent">{t("contacts.kicker")}</span>
                    </div>
                    <h1 className="font-display text-3xl font-bold text-ovgu-ink">{t("contacts.title")}</h1>
                    <p className="text-sm text-ovgu-muted mt-2">
                        {t("contacts.text")}
                    </p>
                </div>

                {loading ? (
                    <section className="rounded-3xl bg-white p-8 text-center shadow-card animate-popIn hover-lift">
                        <div className="text-4xl mb-3 animate-pulseSoft">⏳</div>
                        <h2 className="font-display text-xl font-bold text-ovgu-ink mb-2">{t("contacts.loading")}</h2>
                    </section>
                ) : error ? (
                    <section className="rounded-3xl bg-white p-8 text-center shadow-card animate-popIn hover-lift">
                        <div className="text-4xl mb-3">⚠️</div>
                        <h2 className="font-display text-xl font-bold text-ovgu-ink mb-2">{t("contacts.loadErrorTitle")}</h2>
                        <p className="text-sm text-ovgu-muted mb-5">{t("contacts.loadErrorText")}</p>
                        <button
                            type="button"
                            onClick={reload}
                            className="relative inline-flex rounded-xl px-5 py-3 font-display font-bold text-sm overflow-hidden"
                            style={{ background: "#FFD400", color: "#5F002F" }}
                        >
                            <span className="absolute inset-0 shimmer-bar opacity-0 hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                            <span className="relative">{t("common.retry")}</span>
                        </button>
                    </section>
                ) : matches.length === 0 ? (
                    <section className="rounded-3xl bg-white p-8 text-center shadow-card animate-popIn hover-lift">
                        <div className="text-4xl mb-3 animate-stepPop">🤝</div>
                        <h2 className="font-display text-xl font-bold text-ovgu-ink mb-2 animate-fadeUp" style={{ animationDelay: "80ms" }}>{t("contacts.emptyTitle")}</h2>
                        <p className="text-sm text-ovgu-muted mb-5 animate-fadeUp" style={{ animationDelay: "130ms" }}>
                            {t("contacts.emptyText")}
                        </p>
                        <Link to="/home" className="relative inline-flex rounded-xl px-5 py-3 font-display font-bold text-sm overflow-hidden animate-fadeUp" style={{ background: "#FFD400", color: "#5F002F", animationDelay: "180ms" }}>
                            <span className="absolute inset-0 shimmer-bar opacity-0 hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                            <span className="relative">{t("contacts.discover")}</span>
                        </Link>
                    </section>
                ) : (
                    <div className="space-y-3">
                        {contactMatches.map((match, index) => (
                            <MutualMatchCard key={match.id} match={match} index={index} onOpen={openMatchDetails} />
                        ))}
                    </div>
                )}
            </main>

            <BottomNav active="kontakte" />
            <ContactDetailModal match={selectedMatch} loading={detailsLoading} error={detailsError} onClose={closeMatchDetails} />
        </div>
    );
}
