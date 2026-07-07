const CHIP_COLORS = [
    { bg: "rgba(255,212,0,0.13)", text: "#b38a00", border: "rgba(255,212,0,0.3)" },
    { bg: "rgba(255,105,120,0.10)", text: "#c0394a", border: "rgba(255,105,120,0.25)" },
    { bg: "rgba(122,0,63,0.08)", text: "#7A003F", border: "rgba(122,0,63,0.18)" },
    { bg: "rgba(59,130,246,0.10)", text: "#1d4ed8", border: "rgba(59,130,246,0.25)" },
    { bg: "rgba(34,197,94,0.10)", text: "#15803d", border: "rgba(34,197,94,0.25)" },
];

export function Chip({ children, index = 0, animated = false }) {
    const c = CHIP_COLORS[index % CHIP_COLORS.length];
    return (
        <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${animated ? "animate-popIn" : ""}`}
            style={{
                background: c.bg,
                color: c.text,
                border: `1px solid ${c.border}`,
                animationDelay: animated ? `${80 + index * 45}ms` : undefined,
            }}
        >
            {children}
        </span>
    );
}
