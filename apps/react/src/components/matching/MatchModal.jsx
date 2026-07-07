import { FloatingBlobs } from "../ui/FloatingBlobs";
import { useI18n } from "../../i18n/useI18n";

export function MatchModal({ profile, onClose, onOpenContacts }) {
    const { t, language } = useI18n();
    if (!profile) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 animate-fadeUp" onClick={onClose}>
            <section
                className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-ovgu animate-popIn relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <FloatingBlobs />
                <div className="relative z-10">
                    <div className="mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center text-4xl animate-stepPop" style={{ background: "rgba(255,212,0,0.22)" }}>
                        🎉
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-ovgu-accent animate-fadeUp" style={{ animationDelay: "80ms" }}>{t("matchModal.kicker")}</p>
                    <h2 className="font-display text-3xl font-bold text-ovgu-primary mb-2 animate-slideInRight" style={{ animationDelay: "120ms" }}>{t("matchModal.title")}</h2>
                    <p className="text-sm text-ovgu-muted leading-relaxed mb-5 animate-fadeUp" style={{ animationDelay: "170ms" }}>
                        {t("matchModal.text", { name: profile.firstName })}
                    </p>

                    <div className="rounded-2xl p-4 mb-5 animate-fadeUp hover-lift" style={{ background: "#FDF8FB", border: "1px solid #E8D0DA", animationDelay: "220ms" }}>
                        <p className="text-xs font-bold text-ovgu-muted uppercase tracking-wide mb-1">{t("matchModal.reasonTitle")}</p>
                        <p className="text-sm font-semibold text-ovgu-ink">{language === "de" ? profile.matchReason : t("profile.goodFitDefault")}</p>
                    </div>

                    <div className="flex gap-3 animate-fadeUp" style={{ animationDelay: "270ms" }}>
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-xl border py-3 font-display font-bold text-sm transition-all hover:shadow-cardHov"
                            style={{ borderColor: "#E8D0DA", color: "#7A003F" }}
                        >
                            {t("matchModal.later")}
                        </button>
                        <button
                            onClick={onOpenContacts}
                            className="relative flex-1 rounded-xl py-3 font-display font-bold text-sm overflow-hidden transition-all hover:shadow-cardHov"
                            style={{ background: "#7A003F", color: "#fff" }}
                        >
                            <span className="absolute inset-0 shimmer-bar opacity-0 hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                            <span className="relative">{t("matchModal.goContacts")}</span>
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
