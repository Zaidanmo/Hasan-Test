import { useI18n } from "../../i18n/useI18n";

export function LanguageSwitcher({ dark = false }) {
    const { language, setLanguage, t } = useI18n();

    return (
        <div
            className="inline-flex items-center rounded-full border p-1 shadow-sm"
            style={{
                borderColor: dark ? "rgba(255,255,255,0.18)" : "#E8D0DA",
                background: dark ? "rgba(255,255,255,0.08)" : "#fff",
            }}
            aria-label={t("common.language")}
        >
            {["de", "en"].map((item) => {
                const active = language === item;
                return (
                    <button
                        key={item}
                        type="button"
                        onClick={() => setLanguage(item)}
                        className="min-h-9 rounded-full px-3.5 py-2 text-xs font-bold transition-all"
                        style={{
                            background: active ? (dark ? "#FFD400" : "#7A003F") : "transparent",
                            color: active ? (dark ? "#5F002F" : "#fff") : (dark ? "rgba(255,255,255,0.72)" : "#7A003F"),
                        }}
                    >
                        {item.toUpperCase()}
                    </button>
                );
            })}
        </div>
    );
}
