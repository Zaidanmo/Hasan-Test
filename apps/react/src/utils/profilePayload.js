import { getProfileOptionValues } from "../data/profileOptions";
import {
    getTargetLanguageLevel,
    getTargetLanguageName,
    normalizeUserLanguages,
    toLanguageOptionValue,
    toApiUserLanguage,
    toApiUserLanguages,
} from "./languageUtils";

export const BIO_EXPECTATIONS_LABEL = "Erwartungen an den Tandem-Partner:";
export const BIO_CONTRIBUTION_LABEL = "Was ich einbringen kann:";

export const EMPTY_PROFILE_FORM = {
    id: "",
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    contactEmail: "",
    phone: "",
    studyProgram: "",
    country: "",
    nativeLanguage: "",
    targetLanguage: "",
    searchedLevel: "B2",
    knownLanguages: [],
    meetingFrequency: "",
    meetingFormat: "",
    learningGoals: [],
    expectations: "",
    contribution: "",
    interests: [],
    interestsText: "",
    hasProfilePicture: false,
};

export function sanitizePhone(value) {
    const cleaned = value.replace(/[^\d+]/g, "");
    return cleaned.startsWith("+")
        ? `+${cleaned.replace(/\+/g, "")}`
        : cleaned.replace(/\+/g, "");
}

export function sanitizeUsername(value) {
    return value.replace(/\s+/g, "").replace(/[^a-zA-Z0-9._-]/g, "");
}

export function buildBio(expectations, contribution) {
    return [
        expectations.trim() && `${BIO_EXPECTATIONS_LABEL}\n${expectations.trim()}`,
        contribution.trim() && `${BIO_CONTRIBUTION_LABEL}\n${contribution.trim()}`,
    ].filter(Boolean).join("\n\n");
}

export function parseBio(bio) {
    const text = (bio ?? "").trim();

    if (!text) {
        return { expectations: "", contribution: "" };
    }

    const expectationsIndex = text.indexOf(BIO_EXPECTATIONS_LABEL);
    const contributionIndex = text.indexOf(BIO_CONTRIBUTION_LABEL);

    if (expectationsIndex !== -1 || contributionIndex !== -1) {
        return {
            expectations: expectationsIndex !== -1
                ? text
                    .slice(
                        expectationsIndex + BIO_EXPECTATIONS_LABEL.length,
                        contributionIndex !== -1 && contributionIndex > expectationsIndex
                            ? contributionIndex
                            : text.length
                    )
                    .trim()
                : "",
            contribution: contributionIndex !== -1
                ? text.slice(contributionIndex + BIO_CONTRIBUTION_LABEL.length).trim()
                : "",
        };
    }

    const parts = text.split(/\n\s*\n/);

    return parts.length >= 2
        ? { expectations: parts[0].trim(), contribution: parts.slice(1).join("\n\n").trim() }
        : { expectations: text, contribution: "" };
}

function readField(value, ...keys) {
    for (const key of keys) {
        if (value?.[key] !== undefined && value?.[key] !== null) {
            return value[key];
        }
    }

    return undefined;
}

function normalizeStringList(values) {
    return Array.isArray(values)
        ? values.map((value) => String(value ?? "").trim()).filter(Boolean)
        : [];
}

export function getAllowedCatalogCodes(options = []) {
    return new Set(getProfileOptionValues(options));
}

export function buildCatalogCodes(selectedCodes, options = []) {
    const allowedCodes = getAllowedCatalogCodes(options);
    const selected = normalizeStringList(selectedCodes).filter((code) =>
        allowedCodes.size === 0 || allowedCodes.has(code)
    );
    const uniqueSelected = [...new Set(selected)];

    return uniqueSelected;
}

export function buildCatalogCode(selectedCode, options = []) {
    const allowedCodes = getAllowedCatalogCodes(options);
    const code = String(selectedCode ?? "").trim();

    if (!code || (allowedCodes.size > 0 && !allowedCodes.has(code))) {
        return "";
    }

    return code;
}

export function mapUserToProfileForm(user, { hobbyOptions = [], learningGoalOptions = [] } = {}) {
    const bio = parseBio(readField(user, "bio", "Bio"));
    const allowedHobbies = getAllowedCatalogCodes(hobbyOptions);
    const hobbies = normalizeStringList(readField(user, "hobbies", "Hobbies"))
        .filter((hobby) => allowedHobbies.size === 0 || allowedHobbies.has(hobby));
    const learningGoals = buildCatalogCodes(
        readField(user, "learningGoals", "LearningGoals"),
        learningGoalOptions
    );

    return {
        ...EMPTY_PROFILE_FORM,
        id: readField(user, "id", "Id", "userId", "UserId") ?? "",
        username: readField(user, "username", "Username") ?? "",
        firstName: readField(user, "firstName", "FirstName") ?? "",
        lastName: readField(user, "surname", "Surname", "lastName", "LastName") ?? "",
        email: readField(user, "email", "Email") ?? "",
        contactEmail: readField(user, "contactEmail", "ContactEmail") ?? "",
        phone: readField(user, "telephoneNumber", "TelephoneNumber", "phone", "Phone") ?? "",
        studyProgram: readField(user, "degree", "Degree", "studyProgram", "StudyProgram") ?? "",
        country: readField(user, "country", "Country") ?? "",
        nativeLanguage: toLanguageOptionValue(
            readField(user, "motherLanguage", "MotherLanguage", "nativeLanguage", "NativeLanguage")
        ),
        targetLanguage: getTargetLanguageName(user),
        searchedLevel: getTargetLanguageLevel(user),
        knownLanguages: normalizeUserLanguages(readField(user, "languages", "Languages")),
        meetingFrequency: readField(user, "tandemFrequency", "TandemFrequency", "meetingFrequency", "MeetingFrequency") ?? "",
        meetingFormat: readField(user, "tandemForm", "TandemForm", "meetingFormat", "MeetingFormat") ?? "",
        learningGoals,
        expectations: bio.expectations,
        contribution: bio.contribution,
        interests: hobbies,
        interestsText: readField(user, "distinctHobby", "DistinctHobby", "distincthobby", "interestsText") ?? "",
        hasProfilePicture: Boolean(readField(user, "hasProfilePicture", "HasProfilePicture")),
    };
}

export function buildProfilePayload({
    form,
    knownLanguages,
    learningGoals,
    interests,
    hobbyOptions = [],
    learningGoalOptions = [],
    tandemFormOptions = [],
    tandemFrequencyOptions = [],
    languageOptions = [],
    includePassword = false,
}) {
    const languageCodes = getAllowedCatalogCodes(languageOptions);
    const isAllowedLanguage = (value) => {
        const language = toLanguageOptionValue(value);
        return !language || languageCodes.size === 0 || languageCodes.has(language);
    };
    const nativeLanguage = toLanguageOptionValue(form.nativeLanguage);
    const targetLanguage = toLanguageOptionValue(form.targetLanguage);
    const knownCatalogLanguages = normalizeUserLanguages(knownLanguages)
        .filter((language) => isAllowedLanguage(language.language));

    const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        contactEmail: form.contactEmail.trim(),
        bio: buildBio(form.expectations, form.contribution),
        firstName: form.firstName.trim(),
        surname: form.lastName.trim(),
        telephoneNumber: form.phone.trim(),
        degree: form.studyProgram.trim(),
        country: form.country.trim(),
        motherLanguage: isAllowedLanguage(nativeLanguage) ? nativeLanguage : "",
        languages: toApiUserLanguages(knownCatalogLanguages),
        targetLanguage: toApiUserLanguage({
            language: isAllowedLanguage(targetLanguage) ? targetLanguage : "",
            level: form.searchedLevel,
        }),
        hobbies: buildCatalogCodes(interests, hobbyOptions),
        distinctHobby: form.interestsText.trim(),
        tandemForm: buildCatalogCode(form.meetingFormat, tandemFormOptions),
        learningGoals: buildCatalogCodes(learningGoals, learningGoalOptions),
        tandemFrequency: buildCatalogCode(form.meetingFrequency, tandemFrequencyOptions),
    };

    if (includePassword) {
        payload.password = form.password;
    }

    return payload;
}
