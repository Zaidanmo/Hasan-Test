export const languageLevels = [
    { value: "A1", label: "A1" },
    { value: "A2", label: "A2" },
    { value: "B1", label: "B1" },
    { value: "B2", label: "B2" },
    { value: "C1", label: "C1" },
    { value: "Native", label: "Native" },
];

export function toProfileOption(item) {
    if (typeof item === "string") {
        return { value: item, label: item, isCatalogOption: true };
    }

    const value = item?.value ?? item?.code ?? item?.Code ?? "";
    const label = item?.label ?? item?.displayName ?? item?.DisplayName ?? value;

    return { value, label, isCatalogOption: true };
}

export function normalizeProfileOptions(items) {
    const seen = new Set();

    return (Array.isArray(items) ? items : [])
        .map(toProfileOption)
        .filter((item) => {
            const value = String(item.value ?? "").trim();

            if (!value || seen.has(value)) return false;

            seen.add(value);
            item.value = value;
            item.label = String(item.label ?? value).trim() || value;
            return true;
        });
}

export function getProfileOptionValues(items) {
    return normalizeProfileOptions(items).map((item) => item.value);
}
