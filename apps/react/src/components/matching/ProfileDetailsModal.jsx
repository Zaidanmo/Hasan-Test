import { Chip } from "../ui/Chip";
import { FloatingBlobs } from "../ui/FloatingBlobs";
import { formatMatchScoreDetails } from "../../utils/matchMapper";
import {
    getCatalogLabel,
    getDisplayInterests,
    getDisplayLearningGoals,
} from "../../utils/profileFormatters";
import { useI18n } from "../../i18n/useI18n";
import { useProfileCatalogs } from "../../hooks/useProfileCatalogs";
import { ProfileAvatar } from "../profile/ProfileAvatar";


function getField(value, ...keys) {
    for (const key of keys) {
        if (value?.[key] !== undefined && value?.[key] !== null) {
            return value[key];
        }
    }

    return undefined;
}

function formatLanguage(language, optionLabel) {
    if (!language) return "";

    if (typeof language === "string") {
        return optionLabel(language, language);
    }

    const name = optionLabel(getField(language, "language", "Language"), getField(language, "language", "Language"));
    const level = optionLabel(getField(language, "level", "Level"), getField(language, "level", "Level"));

    return [name, level].filter(Boolean).join(" · ");
}

function translateScoreLabel(label, t) {
    const map = {
        "Sprache": t("card.score.language"),
        "Hobbys": t("card.score.hobby"),
        "Lernziele": t("card.score.goals"),
        "Tandem-Präferenz": t("card.score.tandem"),
    };
    return map[label] ?? label;
}

export function ProfileDetailsModal({ profile, onClose }) {
    const { t, language, optionLabel } = useI18n();
    const catalogOptions = useProfileCatalogs();
    if (!profile) return null;

    const displayInterests = Array.isArray(profile?.hobbies)
        ? [
            ...profile.hobbies.map((interest) => getCatalogLabel(catalogOptions.hobbies, interest, optionLabel)),
            profile?.distincthobby ?? profile?.distinctHobby ?? profile?.interestsText ?? "",
        ].filter(Boolean).filter((value, index, array) => array.indexOf(value) === index)
        : getDisplayInterests(profile, catalogOptions.hobbies, optionLabel);
    const displayLearningGoals = Array.isArray(profile?.learningGoals)
        ? profile.learningGoals.map((goal) => getCatalogLabel(catalogOptions.learningGoals, goal, optionLabel)).filter(Boolean)
        : getDisplayLearningGoals(profile, catalogOptions.learningGoals, optionLabel);

    const scoreDetails = formatMatchScoreDetails(profile);
    const nativeLanguage = optionLabel(
        profile.motherLanguage ?? profile.nativeLanguage,
        profile.motherLanguage ?? profile.nativeLanguage
    );
    const targetLanguage = formatLanguage(profile.targetLanguage, optionLabel);
    const tandemForm = getCatalogLabel(catalogOptions.tandemForms, profile.tandemForm, optionLabel);
    const tandemFrequency = getCatalogLabel(catalogOptions.tandemFrequencies, profile.tandemFrequency, optionLabel);

    const rows = [
        [t("profile.country"), profile.country],
        [t("profile.degree"), profile.studyProgram],
        [t("profile.nativeLanguage"), nativeLanguage],
        [t("profile.targetLanguage"), targetLanguage],
        [t("profile.tandemForm"), tandemForm],
        [t("profile.tandemFrequency"), tandemFrequency],
        [t("profile.score"), `${profile.matchScore} ${t("common.points")}`],
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/35 px-3 py-4 animate-fadeUp" onClick={onClose}>
            <section
                className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl bg-white shadow-ovgu animate-popIn relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="p-6 rounded-t-3xl relative overflow-hidden"
                    style={{ background: `linear-gradient(160deg, ${profile.avatarColor}20, #fff)` }}
                >
                    <FloatingBlobs />
                    <div className="relative z-10 flex items-center gap-4 animate-slideInLeft">
                        <ProfileAvatar
                            userId={profile.userId || profile.id}
                            hasProfilePicture={profile.hasProfilePicture}
                            fallback={profile.avatarInitial}
                            color={profile.avatarColor}
                            className="h-16 w-16 animate-stepPop"
                            textClassName="text-3xl"
                            imageAlt={profile.firstName}
                        />
                        <div className="min-w-0">
                            <h2 className="font-display text-2xl font-bold text-ovgu-ink">{profile.firstName}</h2>
                            <p className="text-sm font-semibold text-ovgu-muted">{profile.country} · {profile.studyProgram}</p>
                        </div>
                    </div>

                    <div className="relative z-10 mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold animate-fadeUp"
                         style={{ background: "rgba(122,0,63,0.08)", color: "#7A003F", animationDelay: "140ms" }}>
                        ✨ {profile.compatibility} {t("common.points")} · {language === "de" ? profile.matchReason : t("profile.goodFitDefault")}
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    <div className="animate-fadeUp" style={{ animationDelay: "80ms" }}>
                        <h3 className="font-display font-bold text-ovgu-ink mb-2">{t("profile.aboutShort")}</h3>
                        <p className="text-sm text-ovgu-muted leading-relaxed">{language === "de" ? profile.bio : t("profile.goodFitDefault")}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {rows.map(([label, value], index) => (
                            <div
                                key={label}
                                className="rounded-2xl border p-3 animate-fadeUp hover-lift"
                                style={{ borderColor: "#E8D0DA", background: "#FDF8FB", animationDelay: `${120 + index * 35}ms` }}
                            >
                                <p className="text-[11px] uppercase tracking-wide font-bold text-ovgu-muted">{label}</p>
                                <p className="text-sm font-semibold text-ovgu-ink mt-1">{value}</p>
                            </div>
                        ))}
                    </div>

                    {scoreDetails.length > 0 && (
                        <div className="rounded-2xl border p-4 animate-fadeUp" style={{ borderColor: "#E8D0DA", background: "#FDF8FB", animationDelay: "235ms" }}>
                            <h3 className="font-display font-bold text-ovgu-ink mb-3">{t("profile.scoreDetails")}</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {scoreDetails.map(([label, value], index) => (
                                    <div key={label} className="rounded-xl bg-white px-3 py-2 animate-popIn" style={{ animationDelay: `${80 + index * 40}ms` }}>
                                        <p className="text-[10px] uppercase tracking-wide font-bold text-ovgu-muted">{translateScoreLabel(label, t)}</p>
                                        <p className="text-sm font-black text-ovgu-primary">{value} {t("common.points")}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="animate-fadeUp" style={{ animationDelay: "260ms" }}>
                        <h3 className="font-display font-bold text-ovgu-ink mb-2">{t("profile.commonInterests")}</h3>
                        <div className="flex flex-wrap gap-2">
                            {displayInterests.length > 0
                                ? displayInterests.map((h, i) => <Chip key={h} index={i} animated>{h}</Chip>)
                                : <span className="text-sm text-ovgu-muted">{t("profile.noCommonInterests")}</span>}
                        </div>
                    </div>

                    <div className="animate-fadeUp" style={{ animationDelay: "300ms" }}>
                        <h3 className="font-display font-bold text-ovgu-ink mb-2">{t("profile.learningGoals")}</h3>
                        <div className="flex flex-wrap gap-2">
                            {displayLearningGoals.length > 0
                                ? displayLearningGoals.map((goal, i) => <Chip key={goal} index={i + 2} animated>{goal}</Chip>)
                                : <span className="text-sm text-ovgu-muted">{t("profile.noCommonGoals")}</span>}
                        </div>
                    </div>

                    {profile.expectations && (
                        <div className="rounded-2xl border p-4 animate-slideInRight" style={{ borderColor: "#E8D0DA", animationDelay: "340ms" }}>
                            <h3 className="font-display font-bold text-ovgu-ink mb-2">{t("profile.expectation")}</h3>
                            <p className="text-sm text-ovgu-muted leading-relaxed">{profile.expectations}</p>
                        </div>
                    )}

                    {profile.contribution && (
                        <div className="rounded-2xl border p-4 animate-slideInLeft" style={{ borderColor: "#E8D0DA", animationDelay: "380ms" }}>
                            <h3 className="font-display font-bold text-ovgu-ink mb-2">{t("profile.contribution")}</h3>
                            <p className="text-sm text-ovgu-muted leading-relaxed">{profile.contribution}</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-1 animate-fadeUp" style={{ animationDelay: "420ms" }}>
                        <button
                            onClick={onClose}
                            className="w-full rounded-xl border py-3 font-display font-bold text-sm transition-all hover:shadow-cardHov"
                            style={{ borderColor: "#E8D0DA", color: "#7A003F" }}
                        >
                            {t("common.close")}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
