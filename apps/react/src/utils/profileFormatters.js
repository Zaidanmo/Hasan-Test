export function formatInterest(value) {
    return String(value ?? "");
}

export function formatLearningGoal(value) {
    return String(value ?? "");
}

export function formatMeetingFormat(value) {
    return String(value ?? "");
}

export function formatMeetingFrequency(value) {
    return String(value ?? "");
}

export function getCatalogLabel(options, value, labelResolver) {
    if (value === undefined || value === null || value === "") return "";

    const textValue = String(value);
    const option = Array.isArray(options)
        ? options.find((item) => item.value === textValue)
        : null;
    const fallback = option?.label ?? textValue;

    return typeof labelResolver === "function"
        ? labelResolver(textValue, fallback)
        : fallback;
}

export function getDisplayInterests(profile, hobbyOptions = [], labelResolver) {
    const hobbies = Array.isArray(profile?.hobbies) ? profile.hobbies : [];

    const hobbyLabels = hobbies
        .map((hobby) => getCatalogLabel(hobbyOptions, hobby, labelResolver))
        .filter(Boolean);

    const distincthobby =
        profile?.distincthobby ??
        profile?.distinctHobby ??
        profile?.interestsText ??
        "";

    return [...hobbyLabels, distincthobby.trim()]
        .filter(Boolean)
        .filter((value, index, array) => array.indexOf(value) === index);
}

export function getDisplayLearningGoals(profile, learningGoalOptions = [], labelResolver) {
    const goals = Array.isArray(profile?.learningGoals) ? profile.learningGoals : [];

    return goals
        .map((goal) => getCatalogLabel(learningGoalOptions, goal, labelResolver))
        .filter(Boolean);
}
