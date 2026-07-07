import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { languageLevels } from "../data/profileOptions";
import { registerUser } from "../api/authApi.js";
import {
    isSupportedProfilePictureFile,
    PROFILE_PICTURE_MAX_BYTES,
    uploadProfilePicture,
} from "../api/profilePictureApi";
import { useAuth } from "../auth/useAuth";
import { ProfilePictureControl } from "../components/profile/ProfilePictureControl";
import { normalizeUserLanguages } from "../utils/languageUtils";
import { LanguageSwitcher } from "../components/ui/LanguageSwitcher";
import { useI18n } from "../i18n/useI18n";
import { getApiErrorMessage, isUsernameOrEmailConflict } from "../utils/apiErrorMessages";
import { useProfileCatalogs } from "../hooks/useProfileCatalogs";
import { buildProfilePayload, sanitizePhone, sanitizeUsername } from "../utils/profilePayload";
import {
    DISTINCT_HOBBY_MAX_LENGTH,
    EMAIL_MAX_LENGTH,
    FIRST_NAME_MAX_LENGTH,
    LAST_NAME_MAX_LENGTH,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    PHONE_MAX_LENGTH,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
} from "../utils/validationRules";

const INIT = {
    username:"", firstName:"", lastName:"", email:"", contactEmail:"", phone:"",
    studyProgram:"", country:"", nativeLanguage:"",
    targetLanguage:"", searchedLevel:"B2",
    meetingFrequency:"", meetingFormat:"",
    expectations:"", contribution:"", interestsText:"",
    password:"", confirmPassword:"",
};

function getSteps(t) {
    return [
        { id:1, title:t("register.steps.about.title"),  desc:t("register.steps.about.desc") },
        { id:2, title:t("register.steps.languages.title"),   desc:t("register.steps.languages.desc") },
        { id:3, title:t("register.steps.goals.title"),  desc:t("register.steps.goals.desc") },
        { id:4, title:t("register.steps.interests.title"), desc:t("register.steps.interests.desc") },
        { id:5, title:t("register.steps.account.title"),      desc:t("register.steps.account.desc") },
    ];
}

export default function RegisterPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { t } = useI18n();
    const catalogOptions = useProfileCatalogs();
    const steps = useMemo(() => getSteps(t), [t]);
    const [step, setStep]     = useState(0);
    const [dir, setDir]       = useState(1);
    const [animKey, setKey]   = useState(0);
    const [form, setForm]     = useState(INIT);
    const [goals, setGoals]   = useState([]);
    const [selInterests, setSel] = useState([]);
    const [knownLangs, setLangs] = useState([]);
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [profilePicturePreviewUrl, setProfilePicturePreviewUrl] = useState("");
    const [profilePictureError, setProfilePictureError] = useState("");
    const [error, setError]   = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setForm((currentForm) => ({
            ...currentForm,
            targetLanguage: currentForm.targetLanguage || catalogOptions.languages[0]?.value || "",
            meetingFrequency: currentForm.meetingFrequency || catalogOptions.tandemFrequencies[0]?.value || "",
            meetingFormat: currentForm.meetingFormat || catalogOptions.tandemForms[0]?.value || "",
        }));
    }, [catalogOptions.languages, catalogOptions.tandemFrequencies, catalogOptions.tandemForms]);

    useEffect(() => () => {
        if (profilePicturePreviewUrl) {
            URL.revokeObjectURL(profilePicturePreviewUrl);
        }
    }, [profilePicturePreviewUrl]);

    const pct = useMemo(() => {
        const req = [form.username, form.firstName, form.lastName, form.email, form.contactEmail,
            form.studyProgram, form.country, form.nativeLanguage,
            form.password, form.confirmPassword,
            normalizeUserLanguages(knownLangs).length ? "ok" : "", goals.length ? "ok" : ""];
        return Math.round(req.filter(Boolean).length / req.length * 100);
    }, [form, knownLangs, goals]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const v = name==="phone" ? sanitizePhone(value) : name==="username" ? sanitizeUsername(value) : value;
        setForm((p) => ({ ...p, [name]: v }));
        setError("");
    };
    const toggle = (val, setter) => setter((p) => p.includes(val)?p.filter((x)=>x!==val):[...p,val]);
    const profileInitial = (form.firstName || form.username || "?").trim().charAt(0).toUpperCase() || "?";

    const clearProfilePicturePreview = () => {
        setProfilePictureFile(null);
        setProfilePictureError("");
        setProfilePicturePreviewUrl((currentUrl) => {
            if (currentUrl) URL.revokeObjectURL(currentUrl);
            return "";
        });
    };

    const handleProfilePictureFile = (file) => {
        if (!file) return;

        if (!isSupportedProfilePictureFile(file)) {
            setProfilePictureError(t("profilePicture.error.invalid"));
            return;
        }

        if (file.size > PROFILE_PICTURE_MAX_BYTES) {
            setProfilePictureError(t("profilePicture.error.tooLarge"));
            return;
        }

        setProfilePictureFile(file);
        setProfilePictureError("");
        setProfilePicturePreviewUrl((currentUrl) => {
            if (currentUrl) URL.revokeObjectURL(currentUrl);
            return URL.createObjectURL(file);
        });
    };

    const validate = () => {
        if (step===0) {
            const username = form.username.trim();
            if (!username || username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
                return t("register.validation.usernameLength", { min: USERNAME_MIN_LENGTH, max: USERNAME_MAX_LENGTH });
            }
            if (!form.firstName.trim()||!form.lastName.trim())         return t("register.validation.name");
            if (!form.email.trim())        return t("register.validation.email");
            if (!form.contactEmail.trim()) return t("register.validation.contactEmail");
            if (!form.studyProgram.trim()) return t("register.validation.degree");
            if (!form.country.trim())      return t("register.validation.country");
        }
        if (step===1) {
            if (!form.nativeLanguage.trim()) return t("register.validation.nativeLanguage");
            if (!form.targetLanguage.trim()) return t("register.validation.targetLanguage");
            if (!normalizeUserLanguages(knownLangs).length) return t("register.validation.knownLanguages");
        }
        if (step===2) {
            if (!goals.length) return t("register.validation.goals");
            if (!form.meetingFrequency.trim()) return t("register.validation.frequency");
            if (!form.meetingFormat.trim()) return t("register.validation.format");
        }
        if (step===3 && !selInterests.length) return t("register.validation.interests");
        if (step===4) {
            if (!form.password) return t("register.validation.password");
            if (form.password.length < PASSWORD_MIN_LENGTH || form.password.length > PASSWORD_MAX_LENGTH) {
                return t("register.validation.passwordLength", { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH });
            }
            if (form.password!==form.confirmPassword) return t("register.validation.passwordMatch");
        }
        return null;
    };

    const goTo = (newStep, direction) => {
        setDir(direction);
        setKey((k) => k + 1);
        setStep(newStep);
    };

    const next = () => {
        const err = validate(); if (err) { setError(err); return; }
        setError(""); goTo(step+1, 1);
    };
    const back = () => { setError(""); goTo(step-1, -1); };

    const handleSubmit = async () => {
        const err = validate(); if (err) { setError(err); return; }
        setLoading(true);
        try {
            const res = await registerUser(buildProfilePayload({
                form,
                knownLanguages: knownLangs,
                learningGoals: goals,
                interests: selInterests,
                hobbyOptions: catalogOptions.hobbies,
                learningGoalOptions: catalogOptions.learningGoals,
                tandemFormOptions: catalogOptions.tandemForms,
                tandemFrequencyOptions: catalogOptions.tandemFrequencies,
                languageOptions: catalogOptions.languages,
                includePassword: true,
            }));
            login(res);

            if (profilePictureFile) {
                try {
                    await uploadProfilePicture(profilePictureFile);
                } catch (uploadError) {
                    console.error("Could not upload profile picture", uploadError);
                    navigate("/account/edit", { replace: true });
                    return;
                }
            }

            navigate("/home", { replace: true });
        } catch (e) {
            if (isUsernameOrEmailConflict(e)) {
                goTo(0, -1);
            }
            setError(getApiErrorMessage(e, t, "register.error.failed"));
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-ovgu-soft flex flex-col">
            <header className="sticky top-0 z-20 bg-white border-b border-ovgu-border/40 px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-6">
                    <Link to="/login" className="font-display text-2xl font-bold text-ovgu-primary hover:opacity-80 transition-opacity shrink-0">
                        Link<span className="text-ovgu-accent">Up</span>
                    </Link>
                    <div className="hidden sm:flex">
                        <Stepper current={step} total={steps.length} />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <LanguageSwitcher />
                        <Link to="/login" className="text-sm font-semibold text-ovgu-accent hover:text-ovgu-primary transition-colors hidden sm:inline">
                            {t("common.login")}
                        </Link>
                    </div>
                </div>
            </header>

            <div className="h-1.5 bg-ovgu-border/30 overflow-hidden">
                <div className="h-full rounded-r-full shimmer-bar transition-all duration-700"
                     style={{ width: `${pct}%` }} />
            </div>

            <main className="flex-1 flex items-start justify-center px-4 py-10">
                <div className="w-full max-w-3xl">
                    <div className="mb-7 animate-fadeUp">
                        <div className="flex items-center gap-4 mb-3">
                            <span className="font-display text-5xl font-bold leading-none select-none"
                                  style={{ color: "#5F002F", WebkitTextStroke: "2px #5F002F" }}>
                                {String(step+1).padStart(2,"0")}
                            </span>
                            <div>
                                <p className="font-display text-2xl font-bold text-ovgu-ink">{steps[step].title}</p>
                                <p className="text-sm text-gray-400">{steps[step].desc}</p>
                            </div>
                        </div>
                        <div className="h-px bg-ovgu-border/40" />
                    </div>

                    <div key={animKey}
                         className={dir >= 0 ? "animate-slideInRight" : "animate-slideInLeft"}
                         style={{ animationDelay: "0ms" }}>
                        <div className="bg-white rounded-3xl shadow-card p-7 sm:p-9">
                            <p className="text-xs text-gray-400 font-semibold mb-5">{t("common.requiredHint")}</p>
                            {step===0 && (
                                <Step1
                                    form={form}
                                    onChange={handleChange}
                                    profileInitial={profileInitial}
                                    profilePictureFile={profilePictureFile}
                                    profilePicturePreviewUrl={profilePicturePreviewUrl}
                                    profilePictureError={profilePictureError}
                                    onProfilePictureChange={handleProfilePictureFile}
                                    onProfilePictureRemove={clearProfilePicturePreview}
                                />
                            )}
                            {step===1 && <Step2 form={form} onChange={handleChange} knownLangs={knownLangs} toggleLang={setLangs} languages={catalogOptions.languages} />}
                            {step===2 && <Step3 form={form} onChange={handleChange} goals={goals} toggleGoal={(v)=>toggle(v,setGoals)} options={catalogOptions} />}
                            {step===3 && <Step4 form={form} onChange={handleChange} selInterests={selInterests} toggleInterest={(v)=>toggle(v,setSel)} hobbies={catalogOptions.hobbies} />}
                            {step===4 && <Step5 form={form} onChange={handleChange} />}
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 animate-popIn rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="mt-6 flex items-center justify-between animate-fadeUp"
                         style={{ animationDelay: "160ms" }}>
                        <button onClick={back} disabled={step===0}
                                className="px-6 py-3 rounded-xl border border-ovgu-border text-sm font-semibold text-gray-500
                                           transition-all hover:border-ovgu-primary hover:text-ovgu-primary
                                           disabled:opacity-30 disabled:pointer-events-none">
                            {t("register.prev")}
                        </button>

                        <span className="text-xs text-gray-400 font-medium">{step+1} / {steps.length}</span>

                        {step < steps.length-1 ? (
                            <button onClick={next}
                                    className="relative px-7 py-3 rounded-xl font-display font-bold text-sm tracking-wide
                                               overflow-hidden transition-all hover:shadow-cardHov"
                                    style={{ background:"#FFD400", color:"#5F002F" }}>
                                <span className="absolute inset-0 shimmer-bar opacity-0 hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                                <span className="relative">{t("register.next")}</span>
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={loading}
                                    className="relative px-7 py-3 rounded-xl font-display font-bold text-sm tracking-wide
                                               bg-ovgu-primary text-white transition-all hover:bg-ovgu-primaryDark
                                               hover:shadow-cardHov disabled:opacity-60">
                                <span className="relative flex items-center gap-2">
                                    {loading && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spinSlow" />}
                                    {loading ? t("register.creating") : t("register.create")}
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function Stepper({ current, total }) {
    return (
        <div className="flex items-center gap-1.5">
            {Array.from({ length: total }, (_, i) => {
                const done   = i < current;
                const active = i === current;
                return (
                    <div key={i} className="flex items-center gap-1.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                        transition-all duration-300
                                        ${done ? "bg-ovgu-primary text-white" : ""}
                                        ${!done && !active ? "border-2 border-gray-200 text-gray-300" : ""}
                                        ${active ? "animate-stepPop" : ""}`}
                             style={active ? { background:"#FFD400", color:"#5F002F" } : {}}>
                            {done
                                ? <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                                    <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2"
                                          strokeLinecap="round" strokeLinejoin="round"
                                          strokeDasharray="40" className="animate-draw" />
                                </svg>
                                : i+1}
                        </div>
                        {i < total-1 && (
                            <div className={`h-0.5 rounded-full transition-all duration-500 ${done?"bg-ovgu-primary w-8 sm:w-12":"bg-gray-200 w-5 sm:w-8"}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

const inputCls = "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-ovgu-ink outline-none transition-all focus:border-ovgu-accent focus:ring-2 focus:ring-ovgu-accent/10";

function RequiredLabel({ label, required }) {
    return <>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</>;
}

function Field({
    label,
    name,
    type="text",
    value,
    onChange,
    required,
    inputMode,
    placeholder="",
    minLength,
    maxLength,
    hint="",
    autoComplete,
}) {
    return (
        <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5"><RequiredLabel label={label} required={required} /></label>
            <input type={type} name={name} value={value} onChange={onChange} required={required}
                   inputMode={inputMode} placeholder={placeholder} minLength={minLength} maxLength={maxLength}
                   autoComplete={autoComplete} className={inputCls} />
            {hint && <span className="mt-1.5 block text-xs text-gray-400">{hint}</span>}
        </div>
    );
}
function Select({ label, name, value, onChange, options, required }) {
    const { optionLabel } = useI18n();
    const opts = (options ?? []).map((o) => typeof o==="string"?{value:o,label:o}:o);
    return (
        <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5"><RequiredLabel label={label} required={required} /></label>
            <select name={name} value={value} onChange={onChange} required={required} className={inputCls}>
                {opts.map((o) => <option key={o.value} value={o.value}>{optionLabel(o.value, o.label)}</option>)}
            </select>
        </div>
    );
}
function ChipGroup({ label, items, selected, onToggle, required }) {
    const { optionLabel } = useI18n();
    const norm = (items ?? []).map((i) => typeof i==="string"?{value:i,label:i}:i);
    return (
        <div>
            {label && <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2"><RequiredLabel label={label} required={required} /></p>}
            <div className="flex flex-wrap gap-2">
                {norm.map((item, idx) => {
                    const active = selected.includes(item.value);
                    return (
                        <button key={item.value} type="button" onClick={() => onToggle(item.value)}
                                className={`animate-popIn min-h-9 rounded-full border px-4 py-2 text-sm font-medium
                                            transition-all duration-200
                                            ${active ? "bg-ovgu-accent border-ovgu-accent text-white scale-[1.04]"
                                    : "border-gray-200 text-gray-600 hover:border-ovgu-accent/60 hover:text-ovgu-accent"}`}
                                style={{ animationDelay: `${idx * 20}ms` }}>
                            {optionLabel(item.value, item.label)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
function LanguageLevelPicker({ label, items, selected, onChange, required }) {
    const { t, optionLabel } = useI18n();
    const options = (items ?? []).map((item) => typeof item === "string" ? { value: item, label: item } : item);
    const normalizedSelected = normalizeUserLanguages(selected);
    const getLanguageLabel = (language) => {
        const option = options.find((item) => item.value === language);
        return optionLabel(language, option?.label ?? language);
    };

    const isSelected = (language) =>
        normalizedSelected.some((item) => item.language === language);

    const getSelectedLevel = (language) =>
        normalizedSelected.find((item) => item.language === language)?.level ?? "A2";

    const toggleLanguage = (language) => {
        if (isSelected(language)) {
            onChange(normalizedSelected.filter((item) => item.language !== language));
            return;
        }

        onChange([...normalizedSelected, { language, level: "A2" }]);
    };

    const changeLevel = (language, level) => {
        onChange(
            normalizedSelected.map((item) =>
                item.language === language ? { ...item, level } : item
            )
        );
    };

    return (
        <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5"><RequiredLabel label={label} required={required} /></p>
            <div className="max-h-56 overflow-y-auto rounded-2xl border border-gray-200 bg-ovgu-surface p-3">
                <div className="flex flex-wrap gap-2">
                    {options.map((option) => {
                        const active = isSelected(option.value);
                        return (
                            <button key={option.value} type="button" onClick={() => toggleLanguage(option.value)}
                                    className={`min-h-9 rounded-full border px-3 py-2 text-sm font-medium transition-all duration-200
                                                ${active ? "bg-ovgu-accent border-ovgu-accent text-white scale-105"
                                        : "border-gray-200 text-gray-600 hover:border-ovgu-accent/60"}`}>
                                {optionLabel(option.value, option.label)}
                            </button>
                        );
                    })}
                </div>
            </div>
            <p className="mt-1.5 text-xs text-gray-400">{t("languagePicker.help")}</p>

            {normalizedSelected.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {normalizedSelected.map((item) => (
                        <div key={item.language} className="rounded-2xl border border-gray-200 bg-white p-3 animate-popIn">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-bold text-ovgu-ink">{getLanguageLabel(item.language)}</p>
                                <button
                                    type="button"
                                    onClick={() => toggleLanguage(item.language)}
                                    className="min-h-8 rounded-lg px-2 text-xs font-bold text-ovgu-accent hover:bg-ovgu-soft hover:text-ovgu-primary transition-colors"
                                >
                                    {t("languagePicker.remove")}
                                </button>
                            </div>
                            <select
                                value={getSelectedLevel(item.language)}
                                onChange={(event) => changeLevel(item.language, event.target.value)}
                                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-ovgu-ink outline-none transition-all focus:border-ovgu-accent focus:ring-2 focus:ring-ovgu-accent/10"
                            >
                                {languageLevels.map((level) => (
                                    <option key={level.value} value={level.value}>{optionLabel(level.value, level.label)}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
function Textarea({ label, name, value, onChange, rows=4, placeholder="" }) {
    return (
        <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{label}</label>
            <textarea name={name} value={value} onChange={onChange} rows={rows}
                      placeholder={placeholder} className={inputCls + " resize-none"} />
        </div>
    );
}

function Step1({
    form,
    onChange,
    profileInitial,
    profilePictureFile,
    profilePicturePreviewUrl,
    profilePictureError,
    onProfilePictureChange,
    onProfilePictureRemove,
}) {
    const { t } = useI18n();
    const fields = [
        {
            label:t("register.field.username"),
            name:"username",
            minLength: USERNAME_MIN_LENGTH,
            maxLength: USERNAME_MAX_LENGTH,
            hint: t("register.help.usernameLength", { min: USERNAME_MIN_LENGTH, max: USERNAME_MAX_LENGTH }),
            autoComplete:"username",
        },
        { label:t("register.field.firstName"), name:"firstName", maxLength: FIRST_NAME_MAX_LENGTH, autoComplete:"given-name" },
        { label:t("register.field.lastName"), name:"lastName", maxLength: LAST_NAME_MAX_LENGTH, autoComplete:"family-name" },
        { label:t("common.email"), name:"email", type:"email", maxLength: EMAIL_MAX_LENGTH, autoComplete:"email" },
        {
            label:t("register.field.contactEmail"),
            name:"contactEmail",
            type:"email",
            maxLength: EMAIL_MAX_LENGTH,
            hint:t("register.help.contactEmail"),
            autoComplete:"email",
        },
        { label:t("register.field.phoneOptional"), name:"phone", type:"tel", inputMode:"tel", placeholder:"+49123456789", required:false, maxLength: PHONE_MAX_LENGTH, autoComplete:"tel" },
        { label:t("register.field.degree"),    name:"studyProgram" },
        { label:t("register.field.country"),  name:"country" },
    ];
    return (
        <div className="space-y-5">
            <ProfilePictureControl
                label={t("profilePicture.label")}
                help={t("profilePicture.help")}
                chooseLabel={t("profilePicture.choose")}
                changeLabel={t("profilePicture.change")}
                removeLabel={t("profilePicture.remove")}
                fallback={profileInitial}
                color="#7A003F"
                previewUrl={profilePicturePreviewUrl}
                fileName={profilePictureFile?.name ?? ""}
                error={profilePictureError}
                onFileChange={onProfilePictureChange}
                onRemove={onProfilePictureRemove}
            />
            <div className="grid gap-5 sm:grid-cols-2">
                {fields.map((f, i) => (
                    <div key={f.name} className="animate-fadeUp" style={{ animationDelay:`${i*40}ms` }}>
                        <Field {...f} value={form[f.name]} onChange={onChange} required={f.required ?? true} />
                    </div>
                ))}
            </div>
        </div>
    );
}
function Step2({ form, onChange, knownLangs, toggleLang, languages }) {
    const { t } = useI18n();
    return (
        <div className="space-y-6">
            <Select label={t("register.field.nativeLanguage")} name="nativeLanguage" value={form.nativeLanguage} onChange={onChange} options={languages} required />
            <div className="grid gap-5 sm:grid-cols-2">
                <Select label={t("register.field.targetLanguage")} name="targetLanguage" value={form.targetLanguage} onChange={onChange} options={languages} required />
                <Select label={t("register.field.searchedLevel")} name="searchedLevel" value={form.searchedLevel} onChange={onChange} options={languageLevels} required />
            </div>
            <LanguageLevelPicker
                label={t("register.field.knownLanguages")}
                items={languages}
                selected={knownLangs}
                onChange={toggleLang}
                required
            />
        </div>
    );
}
function Step3({ form, onChange, goals, toggleGoal, options }) {
    const { t } = useI18n();
    return (
        <div className="space-y-7">
            <ChipGroup label={t("register.field.goals")} items={options.learningGoals} selected={goals} onToggle={toggleGoal} required />
            <div className="grid gap-5 sm:grid-cols-2">
                <Select label={t("register.field.frequency")} name="meetingFrequency" value={form.meetingFrequency} onChange={onChange} options={options.tandemFrequencies} required />
                <Select label={t("register.field.format")}     name="meetingFormat"    value={form.meetingFormat}    onChange={onChange} options={options.tandemForms} required />
            </div>
        </div>
    );
}
function Step4({ form, onChange, selInterests, toggleInterest, hobbies }) {
    const { t } = useI18n();
    return (
        <div className="space-y-6">
            <ChipGroup label={t("register.field.interests")} items={hobbies} selected={selInterests} onToggle={toggleInterest} required />
            <Field label={t("register.field.otherInterests")} name="interestsText"
                   value={form.interestsText} onChange={onChange} placeholder={t("register.placeholder.otherInterests")}
                   maxLength={DISTINCT_HOBBY_MAX_LENGTH} />
        </div>
    );
}
function Step5({ form, onChange }) {
    const { t } = useI18n();
    return (
        <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
                <Textarea label={t("register.field.expectations")} name="expectations"
                          value={form.expectations} onChange={onChange} placeholder={t("register.placeholder.expectations")} />
                <Textarea label={t("register.field.contribution")} name="contribution"
                          value={form.contribution}  onChange={onChange} placeholder={t("register.placeholder.contribution")} />
            </div>
            <div className="h-px bg-gray-100" />
            <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t("common.password")} name="password" type="password" value={form.password}
                       onChange={onChange} required minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH}
                       hint={t("register.help.passwordLength", { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })}
                       autoComplete="new-password" />
                <Field label={t("register.field.confirmPassword")} name="confirmPassword" type="password" value={form.confirmPassword}
                       onChange={onChange} required minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH}
                       autoComplete="new-password" />
            </div>
        </div>
    );
}
