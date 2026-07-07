import { Link } from "react-router-dom";
import { FloatingBlobs } from "../ui/FloatingBlobs";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { useI18n } from "../../i18n/useI18n";

export function DesktopSidebar({ active, matchesCount, onLogout }) {
    const { t } = useI18n();
    const items = [
        { id: "suche", label: t("nav.discover"), to: "/home" },
        { id: "kontakte", label: t("nav.contacts"), to: "/kontakte" },
        { id: "profil", label: t("nav.account"), to: "/account/edit" },
    ];

    return (
        <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-ovgu-primary sticky top-0 h-screen overflow-hidden animate-slideInLeft relative">
            <FloatingBlobs dark />

            <div className="relative z-10 px-8 pt-8 pb-7 border-b border-white/10">
                <Link to="/home" className="font-display text-3xl font-bold text-white hover:opacity-80 transition-opacity">
                    Link<span style={{ color: "#FFD400" }}>Up</span>
                </Link>
                <p className="mt-2 text-xs font-semibold tracking-[0.22em] uppercase" style={{ color: "rgba(255,212,0,0.62)" }}>
                    {t("app.tandem")}
                </p>
            </div>

            <div className="relative z-10 px-8 py-7 border-b border-white/10">
                <div className="rounded-2xl p-5 hover-lift animate-fadeUp" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)", animationDelay: "120ms" }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.36)" }}>{t("sidebar.contactsTitle")}</p>
                    <div className="flex items-end justify-between gap-3">
                        <span className="font-display text-4xl font-bold text-white">{matchesCount}</span>
                        <span className="rounded-full px-3 py-1 text-xs font-bold animate-pulseSoft" style={{ background: "rgba(255,212,0,0.14)", color: "#FFD400" }}>
                            {matchesCount > 0 ? t("sidebar.mutual") : t("sidebar.noneYet")}
                        </span>
                    </div>
                </div>
            </div>

            <nav className="relative z-10 flex-1 px-4 py-5 space-y-1">
                {items.map((item, index) => {
                    const isActive = item.id === active;
                    return (
                        <Link
                            key={item.id}
                            to={item.to}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all duration-200 animate-slideInLeft"
                            style={{
                                background: isActive ? "rgba(255,212,0,0.14)" : "transparent",
                                color: isActive ? "#FFD400" : "rgba(255,255,255,0.52)",
                                fontWeight: isActive ? 700 : 500,
                                animationDelay: `${170 + index * 60}ms`,
                            }}
                        >
                            <span className="w-1 h-4 rounded-full flex-shrink-0 transition-all duration-300" style={{ background: "#FFD400", opacity: isActive ? 1 : 0 }} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="relative z-10 px-6 py-6 border-t border-white/10 space-y-4">
                <LanguageSwitcher dark />
                <p className="animate-fadeUp text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.32)", animationDelay: "360ms" }}>
{t("sidebar.help")}
                </p>
                <button
                    type="button"
                    onClick={onLogout}
                    className="w-full rounded-xl py-2.5 text-sm font-semibold text-center transition-colors hover:text-white/70"
                    style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                    {t("common.logout")}
                </button>
            </div>
        </aside>
    );
}
