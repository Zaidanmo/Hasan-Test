import { useI18n } from "../../i18n/useI18n";

export function SwipeButtons({ onLeft, onInfo, onRight, disabled }) {
    const { t } = useI18n();
    return (
        <div className="flex items-center justify-center gap-6 mt-6 animate-fadeUp" style={{ animationDelay: "280ms" }}>
            <button
                type="button"
                onClick={onLeft}
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95 animate-popIn disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "#fff", boxShadow: "0 4px 20px rgba(239,68,68,0.18)", border: "2px solid rgba(239,68,68,0.2)", animationDelay: "320ms" }}
                aria-label={t("card.skip")}
                disabled={disabled}
            >
                ✕
            </button>
            <button
                type="button"
                onClick={onInfo}
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all hover:scale-105 animate-popIn disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "#fff", boxShadow: "0 2px 12px rgba(122,0,63,0.1)", border: "1.5px solid #E8D0DA", color: "#7A003F", animationDelay: "380ms" }}
                aria-label={t("matchingInfo.open")}
                disabled={disabled}
            >
                ℹ
            </button>
            <button
                type="button"
                onClick={onRight}
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95 animate-popIn disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "#fff", boxShadow: "0 4px 20px rgba(34,197,94,0.2)", border: "2px solid rgba(34,197,94,0.25)", animationDelay: "440ms" }}
                aria-label={t("card.like")}
                disabled={disabled}
            >
                ♥
            </button>
        </div>
    );
}
