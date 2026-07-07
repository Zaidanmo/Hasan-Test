import { FloatingBlobs } from "../ui/FloatingBlobs";
import { useI18n } from "../../i18n/useI18n";

export function MatchingInfoModal({ open, onClose }) {
    const { t } = useI18n();

    if (!open) return null;

    const scoreParts = [
        {
            icon: "🗣️",
            title: t("matchingInfo.language.title"),
            max: t("matchingInfo.language.max"),
            text: t("matchingInfo.language.text"),
        },
        {
            icon: "🎯",
            title: t("matchingInfo.hobby.title"),
            max: t("matchingInfo.hobby.max"),
            text: t("matchingInfo.hobby.text"),
        },
        {
            icon: "📚",
            title: t("matchingInfo.goals.title"),
            max: t("matchingInfo.goals.max"),
            text: t("matchingInfo.goals.text"),
        },
        {
            icon: "🤝",
            title: t("matchingInfo.tandem.title"),
            max: t("matchingInfo.tandem.max"),
            text: t("matchingInfo.tandem.text"),
        },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/35 px-3 py-4 animate-fadeUp"
            onClick={onClose}
        >
            <section
                className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl bg-white shadow-ovgu animate-popIn relative"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="matching-info-title"
            >
                <div className="relative overflow-hidden rounded-t-3xl p-6" style={{ background: "linear-gradient(160deg, rgba(122,0,63,0.10), #fff)" }}>
                    <FloatingBlobs />
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-4 top-4 z-20 w-9 h-9 rounded-full bg-white/85 text-ovgu-primary font-bold shadow-card transition-all hover:scale-105"
                        aria-label={t("common.close")}
                    >
                        ×
                    </button>

                    <div className="relative z-10 pr-10">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-ovgu-accent mb-2">
                            {t("matchingInfo.kicker")}
                        </p>
                        <h2 id="matching-info-title" className="font-display text-3xl font-bold text-ovgu-ink leading-tight">
                            {t("matchingInfo.title")}
                        </h2>
                        <p className="text-sm text-ovgu-muted leading-relaxed mt-3 max-w-xl">
                            {t("matchingInfo.text")}
                        </p>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    <div className="rounded-2xl border p-4" style={{ borderColor: "#E8D0DA", background: "#FDF8FB" }}>
                        <p className="text-sm text-ovgu-muted leading-relaxed">
                            <span className="font-bold text-ovgu-ink">{t("matchingInfo.formulaLabel")}</span>{" "}
                            {t("matchingInfo.formula")}
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                        {scoreParts.map((part, index) => (
                            <article
                                key={part.title}
                                className="rounded-2xl border bg-white p-4 shadow-card animate-fadeUp"
                                style={{ borderColor: "#E8D0DA", animationDelay: `${80 + index * 45}ms` }}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: "rgba(255,212,0,0.18)" }}>
                                        {part.icon}
                                    </span>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h3 className="font-display font-bold text-ovgu-ink">{part.title}</h3>
                                            <span className="rounded-full px-2 py-0.5 text-[11px] font-black" style={{ background: "rgba(122,0,63,0.08)", color: "#7A003F" }}>
                                                {part.max}
                                            </span>
                                        </div>
                                        <p className="text-sm text-ovgu-muted leading-relaxed">{part.text}</p>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(255,212,0,0.45)", background: "rgba(255,212,0,0.10)" }}>
                        <h3 className="font-display font-bold text-ovgu-ink mb-2">{t("matchingInfo.order.title")}</h3>
                        <p className="text-sm text-ovgu-muted leading-relaxed">{t("matchingInfo.order.text")}</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-2xl px-5 py-3 font-display font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
                        style={{ background: "#FFD400", color: "#5F002F" }}
                    >
                        {t("matchingInfo.gotIt")}
                    </button>
                </div>
            </section>
        </div>
    );
}
