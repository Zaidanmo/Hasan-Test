export function FloatingBlobs({ dark = false }) {
    return (
        <>
            <div
                className="absolute top-0 right-0 w-72 h-72 rounded-full translate-x-1/3 -translate-y-1/3 animate-floatBlob pointer-events-none"
                style={{ background: dark ? "rgba(255,212,0,0.09)" : "rgba(122,0,63,0.055)", animationDuration: "7s" }}
            />
            <div
                className="absolute bottom-0 left-0 w-56 h-56 rounded-full -translate-x-1/3 translate-y-1/3 animate-floatBlob pointer-events-none"
                style={{ background: dark ? "rgba(255,105,120,0.10)" : "rgba(255,105,120,0.09)", animationDuration: "9s", animationDelay: "2s" }}
            />
            <div
                className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full -translate-x-1/2 -translate-y-1/2 animate-floatBlob pointer-events-none"
                style={{ background: dark ? "rgba(255,212,0,0.05)" : "rgba(255,212,0,0.12)", animationDuration: "11s", animationDelay: "1s" }}
            />
        </>
    );
}
