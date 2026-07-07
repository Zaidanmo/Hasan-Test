import { formatInterest, formatLearningGoal } from "./profileFormatters";

const AVATAR_COLORS = [
    "#7A003F",
    "#FF6978",
    "#3B82F6",
    "#16A34A",
    "#F59E0B",
    "#8B5CF6",
];

function read(value, ...keys) {
    for (const key of keys) {
        if (value?.[key] !== undefined && value?.[key] !== null) {
            return value[key];
        }
    }

    return undefined;
}

function getStableColor(seed = "") {
    const text = String(seed || "LinkUp");
    const index = [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
}

function getInitial(firstName, username) {
    const source = firstName || username || "?";
    return source.trim().charAt(0).toUpperCase() || "?";
}

function translateReason(reason = "") {
    const text = String(reason);

    if (/native speaker/i.test(text)) {
        return "Muttersprache in deiner Zielsprache";
    }

    if (/above the requested level/i.test(text)) {
        return "Sprachniveau über deinem Wunschlevel";
    }

    if (/at the requested level/i.test(text)) {
        return "Sprachniveau passend zu deinem Wunschlevel";
    }

    const hobbyCount = text.match(/share (\d+) hobbies/i)?.[1];
    if (hobbyCount) {
        return Number(hobbyCount) === 1 ? "ein gemeinsames Interesse" : `${hobbyCount} gemeinsame Interessen`;
    }

    if (/same custom hobby/i.test(text)) {
        return "ähnliches besonderes Hobby";
    }

    const goalCount = text.match(/share (\d+) learning goals/i)?.[1];
    if (goalCount) {
        return Number(goalCount) === 1 ? "ein ähnliches Lernziel" : `${goalCount} ähnliche Lernziele`;
    }

    if (/same tandem form/i.test(text)) {
        return "gleiches Tandem-Format";
    }

    if (/hybrid tandem form/i.test(text) || /form is partially compatible/i.test(text)) {
        return "teilweise kompatibles Tandem-Format";
    }

    if (/same tandem frequency/i.test(text)) {
        return "gleiche Treffen-Häufigkeit";
    }

    if (/flexible on frequency/i.test(text) || /cadence is partially compatible/i.test(text)) {
        return "teilweise kompatible Treffen-Häufigkeit";
    }

    return text;
}

function joinReasons(reasons) {
    if (!Array.isArray(reasons) || reasons.length === 0) {
        return "Dieses Profil passt gut zu deinem Tandem-Profil.";
    }

    const translated = reasons
        .map(translateReason)
        .filter(Boolean)
        .slice(0, 2);

    if (translated.length === 0) {
        return "Dieses Profil passt gut zu deinem Tandem-Profil.";
    }

    return `Gute Ergänzung: ${translated.join(" · ")}.`;
}

export function getMatchId(match) {
    return String(read(match, "userId", "UserId", "id", "Id") ?? "");
}

function toArray(value) {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null || value === "") return [];
    return [value];
}

function normalizeComparable(value) {
    if (value === undefined || value === null) return "";

    return String(value).trim().toLowerCase();
}

function uniqueValues(values) {
    const seen = new Set();

    return toArray(values).filter((value) => {
        const key = normalizeComparable(value);

        if (!key || seen.has(key)) return false;

        seen.add(key);
        return true;
    });
}

function getCommonValues(currentValues, profileValues, fallbackValues = []) {
    const currentSet = new Set(
        toArray(currentValues)
            .map(normalizeComparable)
            .filter(Boolean)
    );

    if (currentSet.size === 0) {
        return uniqueValues(fallbackValues);
    }

    const commonValues = toArray(profileValues).filter((value) =>
        currentSet.has(normalizeComparable(value))
    );

    return uniqueValues(commonValues.length > 0 ? commonValues : fallbackValues);
}

function getCommonText(currentValue, profileValue) {
    const currentText = String(currentValue ?? "").trim();
    const profileText = String(profileValue ?? "").trim();

    if (!currentText || !profileText) return "";

    return normalizeComparable(currentText) === normalizeComparable(profileText) ? profileText : "";
}

export function normalizeMatch(match, options = {}) {
    const userId = getMatchId(match);
    const username = read(match, "username", "Username") ?? "";
    const email = read(match, "contactEmail", "ContactEmail", "email", "Email") ?? "";
    const firstName = read(match, "firstName", "FirstName") ?? username ?? "Match";
    const surname = read(match, "surname", "Surname") ?? "";
    const degree = read(match, "degree", "Degree") ?? "";
    const country = read(match, "country", "Country") ?? "";
    const motherLanguage = read(match, "motherLanguage", "MotherLanguage") ?? "";
    const targetLanguage = read(match, "targetLanguage", "TargetLanguage") ?? null;
    const tandemForm = read(match, "tandemForm", "TandemForm") ?? "";
    const tandemFrequency = read(match, "tandemFrequency", "TandemFrequency") ?? "";
    const backendBio = read(match, "bio", "Bio") ?? "";
    const matchScore = Number(read(match, "matchScore", "MatchScore") ?? 0);
    const languageScore = Number(read(match, "languageScore", "LanguageScore") ?? 0);
    const hobbyScore = Number(read(match, "hobbyScore", "HobbyScore") ?? 0);
    const learningGoalScore = Number(read(match, "learningGoalScore", "LearningGoalScore") ?? 0);
    const tandemPreferenceScore = Number(read(match, "tandemPreferenceScore", "TandemPreferenceScore") ?? 0);
    const commonHobbies = read(match, "commonHobbies", "CommonHobbies") ?? [];
    const commonLearningGoals = read(match, "commonLearningGoals", "CommonLearningGoals") ?? [];
    const reasons = read(match, "reasons", "Reasons") ?? [];
    const isLikedByCurrentUser = Boolean(read(match, "isLikedByCurrentUser", "IsLikedByCurrentUser"));
    const isMutualMatch = Boolean(options.forceMutualMatch || read(match, "isMutualMatch", "IsMutualMatch"));
    const hasProfilePicture = Boolean(read(match, "hasProfilePicture", "HasProfilePicture"));

    return {
        ...match,
        id: userId,
        userId,
        username,
        email,
        firstName,
        surname,
        studyProgram: degree,
        degree,
        country,
        nativeLanguage: motherLanguage,
        motherLanguage,
        targetLanguage,
        tandemForm,
        tandemFrequency,
        matchScore,
        compatibility: matchScore,
        languageScore,
        hobbyScore,
        learningGoalScore,
        tandemPreferenceScore,
        commonHobbies,
        commonLearningGoals,
        hobbies: commonHobbies,
        learningGoals: commonLearningGoals,
        reasons,
        isLikedByCurrentUser,
        isMutualMatch,
        hasProfilePicture,
        matchReason: isMutualMatch && reasons.length === 0
            ? "Ihr habt beide Interesse gezeigt."
            : joinReasons(reasons),
        bio: backendBio || (matchScore > 0
            ? `${firstName} passt mit ${matchScore} Punkten zu deinem Tandem-Profil.`
            : `${firstName} und du habt gegenseitiges Interesse gezeigt.`),
        avatarInitial: getInitial(firstName, username),
        avatarColor: getStableColor(userId || username || firstName),
    };
}

export function getPagedResultInfo(data) {
    return {
        page: Number(read(data, "page", "Page") ?? 1),
        pageSize: Number(read(data, "pageSize", "PageSize") ?? 20),
        totalItems: Number(read(data, "totalItems", "TotalItems") ?? 0),
        totalPages: Number(read(data, "totalPages", "TotalPages") ?? 0),
        hasNextPage: Boolean(read(data, "hasNextPage", "HasNextPage")),
        hasPreviousPage: Boolean(read(data, "hasPreviousPage", "HasPreviousPage")),
    };
}

export function getRawMatches(data) {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.Items)) return data.Items;
    if (Array.isArray(data?.matches)) return data.matches;
    if (Array.isArray(data?.Matches)) return data.Matches;

    return [];
}

export function normalizeMatches(data, options = {}) {
    return getRawMatches(data)
        .map((match) => normalizeMatch(match, options))
        .filter((match) => match.id)
        .sort((a, b) => b.matchScore - a.matchScore);
}

export function formatMatchScoreDetails(profile) {
    return [
        ["Sprache", profile?.languageScore],
        ["Hobbys", profile?.hobbyScore],
        ["Lernziele", profile?.learningGoalScore],
        ["Tandem-Präferenz", profile?.tandemPreferenceScore],
    ].filter(([, value]) => value !== undefined && value !== null);
}

export function formatCommonHobbies(profile) {
    const hobbies = profile?.commonHobbies ?? profile?.hobbies ?? [];
    return Array.isArray(hobbies) ? hobbies.map(formatInterest).filter(Boolean) : [];
}

export function formatCommonLearningGoals(profile) {
    const goals = profile?.commonLearningGoals ?? profile?.learningGoals ?? [];
    return Array.isArray(goals) ? goals.map(formatLearningGoal).filter(Boolean) : [];
}

export function normalizeContactProfileDetails(data, fallback = {}, currentProfile = null) {
    const profile = read(data, "user", "User") ?? data ?? {};
    const userId = String(read(profile, "userId", "UserId", "id", "Id") ?? fallback.userId ?? fallback.id ?? "");
    const username = read(profile, "username", "Username") ?? fallback.username ?? "";
    const email = read(profile, "contactEmail", "ContactEmail", "email", "Email") ?? fallback.contactEmail ?? fallback.email ?? "";
    const firstName = read(profile, "firstName", "FirstName") ?? fallback.firstName ?? username ?? "Match";
    const surname = read(profile, "surname", "Surname") ?? fallback.surname ?? "";
    const degree = read(profile, "degree", "Degree") ?? fallback.degree ?? fallback.studyProgram ?? "";
    const country = read(profile, "country", "Country") ?? fallback.country ?? "";
    const motherLanguage = read(profile, "motherLanguage", "MotherLanguage") ?? fallback.motherLanguage ?? fallback.nativeLanguage ?? "";
    const languages = read(profile, "languages", "Languages") ?? fallback.languages ?? [];
    const targetLanguage = read(profile, "targetLanguage", "TargetLanguage") ?? fallback.targetLanguage;
    const hobbies = read(profile, "hobbies", "Hobbies") ?? fallback.hobbies ?? fallback.commonHobbies ?? [];
    const learningGoals = read(profile, "learningGoals", "LearningGoals") ?? fallback.learningGoals ?? fallback.commonLearningGoals ?? [];
    const distinctHobby = read(profile, "distinctHobby", "DistinctHobby", "distincthobby") ?? fallback.distinctHobby ?? fallback.distincthobby ?? "";
    const tandemForm = read(profile, "tandemForm", "TandemForm") ?? fallback.tandemForm;
    const tandemFrequency = read(profile, "tandemFrequency", "TandemFrequency") ?? fallback.tandemFrequency;
    const bio = read(profile, "bio", "Bio") ?? fallback.bio ?? "";
    const hasProfilePicture = Boolean(
        read(profile, "hasProfilePicture", "HasProfilePicture") ??
        read(fallback, "hasProfilePicture", "HasProfilePicture")
    );
    const currentHobbies = read(currentProfile, "hobbies", "Hobbies") ?? [];
    const currentLearningGoals = read(currentProfile, "learningGoals", "LearningGoals") ?? [];
    const currentDistinctHobby = read(currentProfile, "distinctHobby", "DistinctHobby", "distincthobby") ?? "";
    const commonDistinctHobby = getCommonText(currentDistinctHobby, distinctHobby);
    const commonHobbies = uniqueValues([
        ...getCommonValues(currentHobbies, hobbies, fallback.commonHobbies),
        commonDistinctHobby,
    ]);
    const commonLearningGoals = getCommonValues(
        currentLearningGoals,
        learningGoals,
        fallback.commonLearningGoals
    );

    return {
        ...fallback,
        ...profile,
        id: userId,
        userId,
        username,
        email,
        contactEmail: email,
        firstName,
        surname,
        degree,
        studyProgram: degree,
        country,
        bio,
        motherLanguage,
        nativeLanguage: motherLanguage,
        languages,
        targetLanguage,
        hobbies,
        learningGoals,
        commonHobbies,
        commonLearningGoals,
        distinctHobby,
        tandemForm,
        tandemFrequency,
        isMutualMatch: true,
        hasProfilePicture,
        avatarInitial: fallback.avatarInitial ?? getInitial(firstName, username),
        avatarColor: fallback.avatarColor ?? getStableColor(userId || username || firstName),
    };
}
