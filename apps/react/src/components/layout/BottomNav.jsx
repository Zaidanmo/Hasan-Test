import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/useI18n";

export function BottomNav({ active }) {
    const { t } = useI18n();
    const items = [
        { id: "suche", label: t("nav.search"), to: "/home" },
        { id: "kontakte", label: t("nav.contacts"), to: "/kontakte" },
    ];

    return (
        <nav className="lg:hidden flex items-center justify-around border-t py-2 px-4 animate-fadeUp" style={{ borderColor: "#E8D0DA", background: "#fff" }}>
            {items.map(({ id, label, to }, index) => {
                const isActive = id === active;
                const iconColor = isActive ? "#7A003F" : "#9ca3af";

                return (
                    <Link key={id} to={to} className="flex flex-col items-center gap-0.5 px-5 py-1 transition-all hover:scale-105 animate-popIn" style={{ animationDelay: `${index * 60}ms` }}>
                        {renderBottomNavIcon(id, iconColor, isActive)}
                        <span className="text-[10px] font-semibold" style={{ color: iconColor }}>
                            {label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}

function renderBottomNavIcon(id, color, filled) {
    if (id === "suche") return <SearchIcon size={22} color={color} filled={filled} />;
    if (id === "kontakte") return <ChatIcon size={22} color={color} filled={filled} />;
    return null;
}

const SearchIcon = ({ size = 24, color, filled }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke={color} strokeWidth={filled ? 0 : 2} fill={filled ? color : "none"} opacity={filled ? 0.15 : 1} />
        {filled && <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" fill="none" />}
        <line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const ChatIcon = ({ size = 24, color, filled }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="14" rx="4" stroke={color} strokeWidth="2" fill={filled ? color : "none"} opacity={filled ? 0.15 : 1} />
        {filled && <rect x="3" y="3" width="18" height="14" rx="4" stroke={color} strokeWidth="2" fill="none" />}
        <path d="M8 21 L12 17 L16 21" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={filled ? "#fff" : "none"} />
    </svg>
);
