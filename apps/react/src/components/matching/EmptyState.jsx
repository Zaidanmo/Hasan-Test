import { useI18n } from "../../i18n/useI18n";

export function EmptyState({ variant, onReset }) {
    const { t } = useI18n();
    const content = {
        noProfiles: {
            icon: "🔎",
            title: t("empty.noProfiles.title"),
            text: t("empty.noProfiles.text"),
        },
        allRated: {
            icon: "✅",
            title: t("empty.allRated.title"),
            text: t("empty.allRated.text"),
        },
        allSkipped: {
            icon: "↩️",
            title: t("empty.allSkipped.title"),
            text: t("empty.allSkipped.text"),
        },
        allSeen: {
            icon: "🎉",
            title: t("empty.allSeen.title"),
            text: t("empty.allSeen.text"),
        },
    }[variant] ?? {
        icon: "🔎",
        title: t("empty.default.title"),
        text: t("empty.default.text"),
    };

    const canReviewAgain = variant === "allSkipped" || variant === "allSeen";

    return (
        <div className="flex flex-col items-center justify-center h-full gap-5 animate-fadeUp px-6 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl animate-stepPop" style={{ background: "rgba(122,0,63,0.07)" }}>
                {content.icon}
            </div>
            <div className="animate-fadeUp" style={{ animationDelay: "90ms" }}>
                <h3 className="font-display text-xl font-bold text-ovgu-ink mb-2">{content.title}</h3>
                <p className="text-sm text-ovgu-muted">{content.text}</p>
            </div>
            {canReviewAgain && (
                <button
                    type="button"
                    onClick={onReset}
                    className="relative px-6 py-2.5 rounded-xl font-display font-bold text-sm overflow-hidden animate-fadeUp"
                    style={{ background: "#FFD400", color: "#5F002F", animationDelay: "160ms" }}
                >
                    <span className="absolute inset-0 shimmer-bar opacity-0 hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                    <span className="relative">{t("empty.reviewAgain")}</span>
                </button>
            )}
        </div>
    );
}
