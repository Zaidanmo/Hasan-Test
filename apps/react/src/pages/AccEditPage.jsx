import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAuthSession, getStoredAuthSession, setStoredAuthSession } from "../storage/authStorage";
import { deleteCurrentUser, getCurrentUser, updateCurrentUser } from "../api/userApi";
import {
    deleteProfilePicture,
    isSupportedProfilePictureFile,
    PROFILE_PICTURE_MAX_BYTES,
    uploadProfilePicture,
} from "../api/profilePictureApi";
import { languageLevels } from "../data/profileOptions";
import { ProfileAvatar } from "../components/profile/ProfileAvatar";
import { ProfilePictureControl } from "../components/profile/ProfilePictureControl";
import { normalizeUserLanguages } from "../utils/languageUtils";
import { LanguageSwitcher } from "../components/ui/LanguageSwitcher";
import { useI18n } from "../i18n/useI18n";
import { getApiErrorMessage } from "../utils/apiErrorMessages";
import { useProfileCatalogs } from "../hooks/useProfileCatalogs";
import {
    buildProfilePayload,
    EMPTY_PROFILE_FORM,
    mapUserToProfileForm,
    sanitizePhone,
} from "../utils/profilePayload";
import {
    DISTINCT_HOBBY_MAX_LENGTH,
    EMAIL_MAX_LENGTH,
    FIRST_NAME_MAX_LENGTH,
    LAST_NAME_MAX_LENGTH,
    PHONE_MAX_LENGTH,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
} from "../utils/validationRules";

function getSections(t) {
    return [
        { id:"personal",  label:t("account.section.personal") },
        { id:"languages", label:t("account.section.languages") },
        { id:"interests", label:t("account.section.interests") },
        { id:"wishes",    label:t("account.section.wishes") },
    ];
}

export default function AccountEditPage() {
    const navigate = useNavigate();
    const { t } = useI18n();
    const catalogOptions = useProfileCatalogs();
    const sections = useMemo(() => getSections(t), [t]);
    const [form, setForm]     = useState(EMPTY_PROFILE_FORM);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError]   = useState("");
    const [activeSection, setActive] = useState("personal");
    const [saved, setSaved]   = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteCountdown, setDeleteCountdown] = useState(5);
    const [deleteError, setDeleteError] = useState("");
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [profilePictureVersion, setProfilePictureVersion] = useState(0);
    const [profilePicturePreviewUrl, setProfilePicturePreviewUrl] = useState("");
    const [profilePictureError, setProfilePictureError] = useState("");
    const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
    const [deletingProfilePicture, setDeletingProfilePicture] = useState(false);
    const sectionRefs = useRef({});

    useEffect(() => {
        if (catalogOptions.loading) return undefined;

        let active = true;

        (async () => {
            try {
                const res = await getCurrentUser();
                const profile = res?.user ?? res;
                const auth = getStoredAuthSession() ?? {};
                if (active) {
                    setForm(mapUserToProfileForm(
                        { ...auth, ...profile },
                        {
                            hobbyOptions: catalogOptions.hobbies,
                            learningGoalOptions: catalogOptions.learningGoals,
                        }
                    ));
                    setProfilePictureVersion((version) => version + 1);
                }
            } catch (e) {
                if (active) {
                    setError(e.response?.data?.message || t("account.loadError"));
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            active = false;
        };
    }, [catalogOptions.hobbies, catalogOptions.learningGoals, catalogOptions.loading, t]);

    useEffect(() => {
        if (loading) return;
        const obs = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
            { rootMargin: "-30% 0px -60% 0px" }
        );
        Object.values(sectionRefs.current).forEach((el) => el && obs.observe(el));
        return () => obs.disconnect();
    }, [loading]);

    useEffect(() => {
        if (!deleteDialogOpen) return undefined;

        setDeleteCountdown(5);
        const intervalId = window.setInterval(() => {
            setDeleteCountdown((current) => {
                if (current <= 1) {
                    window.clearInterval(intervalId);
                    return 0;
                }

                return current - 1;
            });
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [deleteDialogOpen]);

    useEffect(() => () => {
        if (profilePicturePreviewUrl) {
            URL.revokeObjectURL(profilePicturePreviewUrl);
        }
    }, [profilePicturePreviewUrl]);

    const scrollTo = (id) => sectionRefs.current[id]?.scrollIntoView({ behavior:"smooth", block:"start" });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: name==="phone"?sanitizePhone(value):value }));
        setError(""); setMessage("");
    };

    const toggleArr = (key, val) => {
        setForm((p) => ({ ...p, [key]: p[key].includes(val)?p[key].filter((x)=>x!==val):[...p[key],val] }));
        setError(""); setMessage("");
    };

    const handleLogout = () => {
        clearAuthSession();
        navigate("/login", { replace: true });
    };

    const setProfilePicturePreview = (url) => {
        setProfilePicturePreviewUrl((currentUrl) => {
            if (currentUrl) URL.revokeObjectURL(currentUrl);
            return url;
        });
    };

    const handleProfilePictureUpload = async (file) => {
        if (!file || uploadingProfilePicture || deletingProfilePicture) return;

        if (!isSupportedProfilePictureFile(file)) {
            setProfilePictureError(t("profilePicture.error.invalid"));
            return;
        }

        if (file.size > PROFILE_PICTURE_MAX_BYTES) {
            setProfilePictureError(t("profilePicture.error.tooLarge"));
            return;
        }

        setUploadingProfilePicture(true);
        setProfilePictureError("");
        setProfilePicturePreview(URL.createObjectURL(file));

        try {
            await uploadProfilePicture(file);
            setProfilePicturePreview("");
            setProfilePictureVersion((version) => version + 1);
            setForm((currentForm) => ({ ...currentForm, hasProfilePicture: true }));
            setStoredAuthSession({
                ...(getStoredAuthSession() ?? {}),
                hasProfilePicture: true,
            });
        } catch (requestError) {
            setProfilePicturePreview("");
            setProfilePictureError(requestError?.response?.data?.message || t("profilePicture.error.upload"));
        } finally {
            setUploadingProfilePicture(false);
        }
    };

    const handleProfilePictureDelete = async () => {
        if (uploadingProfilePicture || deletingProfilePicture) return;

        setDeletingProfilePicture(true);
        setProfilePictureError("");

        try {
            await deleteProfilePicture();
            setProfilePicturePreview("");
            setProfilePictureVersion((version) => version + 1);
            setForm((currentForm) => ({ ...currentForm, hasProfilePicture: false }));
            setStoredAuthSession({
                ...(getStoredAuthSession() ?? {}),
                hasProfilePicture: false,
            });
        } catch (requestError) {
            setProfilePictureError(requestError?.response?.data?.message || t("profilePicture.error.delete"));
        } finally {
            setDeletingProfilePicture(false);
        }
    };

    const openDeleteDialog = () => {
        setDeleteError("");
        setDeleteDialogOpen(true);
    };

    const closeDeleteDialog = () => {
        if (deletingAccount) return;

        setDeleteDialogOpen(false);
        setDeleteError("");
    };

    const handleDeleteAccount = async () => {
        if (deleteCountdown > 0 || deletingAccount) return;

        setDeletingAccount(true);
        setDeleteError("");

        try {
            await deleteCurrentUser();
            clearAuthSession();
            navigate("/login", { replace: true });
        } catch (requestError) {
            setDeleteError(requestError?.response?.data?.message || t("account.delete.error"));
        } finally {
            setDeletingAccount(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const username = form.username.trim();
        if (!username || username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
            setError(t("register.validation.usernameLength", { min: USERNAME_MIN_LENGTH, max: USERNAME_MAX_LENGTH }));
            return;
        }
        if (!form.contactEmail.trim()) { setError(t("register.validation.contactEmail")); return; }
        if (!form.nativeLanguage.trim()) { setError(t("register.validation.nativeLanguage")); return; }
        if (!form.targetLanguage.trim()) { setError(t("register.validation.targetLanguage")); return; }
        if (!normalizeUserLanguages(form.knownLanguages).length) { setError(t("account.validation.knownLanguages")); return; }
        if (!form.learningGoals.length)  { setError(t("account.validation.goals")); return; }
        if (!form.meetingFrequency.trim()) { setError(t("register.validation.frequency")); return; }
        if (!form.meetingFormat.trim()) { setError(t("register.validation.format")); return; }
        if (!form.interests.length) { setError(t("register.validation.interests")); return; }
        setSaving(true); setError(""); setMessage(""); setSaved(false);
        try {
            const res = await updateCurrentUser(buildProfilePayload({
                form,
                knownLanguages: form.knownLanguages,
                learningGoals: form.learningGoals,
                interests: form.interests,
                hobbyOptions: catalogOptions.hobbies,
                learningGoalOptions: catalogOptions.learningGoals,
                tandemFormOptions: catalogOptions.tandemForms,
                tandemFrequencyOptions: catalogOptions.tandemFrequencies,
                languageOptions: catalogOptions.languages,
            }));
            const updated = res?.user ?? res;
            const nextAuth = {
                ...(getStoredAuthSession() ?? {}),
                username: form.username.trim(),
                email: form.email.trim(),
                contactEmail: form.contactEmail.trim(),
            };
            setStoredAuthSession(nextAuth);
            if (updated) {
                setForm(mapUserToProfileForm(
                    { ...nextAuth, ...updated },
                    {
                        hobbyOptions: catalogOptions.hobbies,
                        learningGoalOptions: catalogOptions.learningGoals,
                    }
                ));
            }
            setMessage(t("account.saved"));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            setError(getApiErrorMessage(e, t, "account.saveError"));
        } finally { setSaving(false); }
    };

    const initials = useMemo(() => {
        const f=form.firstName?.trim()[0]??"";
        const l=form.lastName?.trim()[0]??"";
        return (f+l).toUpperCase()||"?";
    }, [form.firstName, form.lastName]);
    const currentUserId = form.id || getStoredAuthSession()?.id || "";

    const completionPct = useMemo(() => {
        const fields = [form.username, form.firstName, form.lastName, form.email, form.contactEmail,
            form.studyProgram, form.country, form.nativeLanguage,
            normalizeUserLanguages(form.knownLanguages).length ? "ok" : "", form.learningGoals.length ? "ok" : ""];
        return Math.round(fields.filter(Boolean).length / fields.length * 100);
    }, [form]);

    if (loading) return (
        <div className="min-h-screen bg-ovgu-soft flex items-center justify-center">
            <div className="animate-fadeUp flex items-center gap-3 bg-white rounded-2xl shadow-card px-7 py-4">
                <span className="w-5 h-5 rounded-full border-2 border-ovgu-border border-t-ovgu-accent animate-spinSlow" />
                <span className="text-sm text-gray-500">{t("account.loading")}</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-ovgu-soft flex">
            <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-ovgu-primary sticky top-0 h-screen overflow-y-auto animate-slideInLeft">
                <div className="px-7 pt-8 pb-6 border-b border-white/10">
                    <Link to="/home" className="font-display text-2xl font-bold text-white hover:opacity-80 transition-opacity">
                        Link<span style={{ color:"#FFD400" }}>Up</span>
                    </Link>
                </div>

                <div className="px-7 py-6 border-b border-white/10">
                    <ProfileAvatar
                        userId={currentUserId}
                        hasProfilePicture={form.hasProfilePicture}
                        pictureVersion={profilePictureVersion}
                        previewUrl={profilePicturePreviewUrl}
                        fallback={initials}
                        color="#FF6978"
                        className="mb-3 h-14 w-14 rounded-2xl transition-transform duration-200 hover:scale-105"
                        textClassName="text-xl"
                        imageAlt={t("profilePicture.label")}
                    />
                    <p className="text-white font-semibold text-sm">{form.firstName||form.username||"—"} {form.lastName}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color:"rgba(255,255,255,0.4)" }}>{form.email||"—"}</p>
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color:"rgba(255,255,255,0.38)" }}>{t("common.profile")}</span>
                            <span className="text-[11px] font-bold" style={{ color:"#FFD400" }}>{completionPct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full transition-[width] duration-700 ease-out"
                                 style={{ width:`${completionPct}%`, background:"linear-gradient(90deg,#FFD400,#FF6978)" }} />
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-5 space-y-0.5">
                    {sections.map((s) => {
                        const active = activeSection === s.id;
                        return (
                            <button key={s.id} onClick={() => scrollTo(s.id)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all duration-200"
                                    style={active
                                        ? { background:"rgba(255,212,0,0.14)", color:"#FFD400", fontWeight:600 }
                                        : { color:"rgba(255,255,255,0.45)", fontWeight:500 }}>
                                <span className="w-1 h-4 rounded-full flex-shrink-0 transition-all duration-300"
                                      style={{ background:"#FFD400", opacity: active ? 1 : 0 }} />
                                <span>{s.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="px-5 py-6 space-y-3 border-t border-white/10">
                    <LanguageSwitcher dark />
                    <button
                        onClick={(e) => { e.preventDefault(); document.getElementById("edit-form").requestSubmit(); }}
                        disabled={saving}
                        className="relative w-full py-3 rounded-xl font-display font-bold text-sm overflow-hidden
                                   transition-all hover:opacity-90 hover:shadow-cardHov disabled:opacity-60"
                        style={{ background: saved ? "#22c55e" : "#FFD400", color: saved ? "#fff" : "#5F002F" }}>
                        <span className="absolute inset-0 shimmer-bar opacity-0 hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                        <span className="relative flex items-center justify-center gap-2">
                            {saving && <span className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spinSlow" />}
                            {saved ? t("account.button.saved") : saving ? t("account.button.saving") : t("account.button.save")}
                        </span>
                    </button>
                    <Link to="/login"
                          onClick={handleLogout}
                          className="block w-full py-2.5 rounded-xl text-sm font-medium text-center transition-colors hover:text-white/60"
                          style={{ color:"rgba(255,255,255,0.35)" }}>
                        {t("common.logout")}
                    </Link>
                    <button
                        type="button"
                        onClick={openDeleteDialog}
                        className="w-full py-2.5 rounded-xl border border-red-400/25 bg-red-500/10 text-sm font-bold text-red-200 transition-all hover:bg-red-500/20"
                    >
                        {t("account.delete.button")}
                    </button>
                </div>
            </aside>

            <div className="flex-1 min-w-0">
                <header className="lg:hidden sticky top-0 z-10 bg-white border-b border-ovgu-border/40 px-5 py-4 flex items-center justify-between gap-3">
                    <Link to="/home" className="flex min-h-9 items-center whitespace-nowrap font-display text-xl font-bold text-ovgu-primary">
                        Link<span className="text-ovgu-accent">Up</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher />
                        <button form="edit-form" type="submit" disabled={saving}
                                className="px-5 py-2 rounded-xl text-sm font-bold font-display transition-all active:scale-[.97] disabled:opacity-60"
                                style={{ background:"#FFD400", color:"#5F002F" }}>
                            {saving ? "…" : t("common.save")}
                        </button>
                    </div>
                </header>

                <div className="px-6 pt-10 pb-6 max-w-3xl animate-fadeUp">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-ovgu-accent mb-1">{t("account.heading.kicker")}</p>
                    <h1 className="font-display text-4xl font-bold text-ovgu-ink">{t("account.heading.title")}</h1>
                    <p className="text-gray-400 text-sm mt-2">{t("account.heading.text")}</p>
                </div>

                <form id="edit-form" onSubmit={handleSubmit} className="px-6 pb-16 max-w-3xl space-y-6">
                    <SectionCard id="personal" title={t("account.section.personal")}
                                 refFn={(el) => (sectionRefs.current.personal = el)}
                                 delay={80}>
                        <div className="space-y-5">
                            <ProfilePictureControl
                                label={t("profilePicture.label")}
                                help={t("profilePicture.help")}
                                chooseLabel={t("profilePicture.choose")}
                                changeLabel={t("profilePicture.change")}
                                removeLabel={t("profilePicture.remove")}
                                fallback={initials}
                                color="#FF6978"
                                userId={currentUserId}
                                hasProfilePicture={form.hasProfilePicture}
                                pictureVersion={profilePictureVersion}
                                previewUrl={profilePicturePreviewUrl}
                                uploading={uploadingProfilePicture}
                                deleting={deletingProfilePicture}
                                error={profilePictureError}
                                onFileChange={handleProfilePictureUpload}
                                onRemove={handleProfilePictureDelete}
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                            <Field label={t("register.field.username")} name="username" value={form.username} onChange={handleChange}
                                   minLength={USERNAME_MIN_LENGTH} maxLength={USERNAME_MAX_LENGTH}
                                   hint={t("register.help.usernameLength", { min: USERNAME_MIN_LENGTH, max: USERNAME_MAX_LENGTH })} />
                            <Field label={t("register.field.firstName")} name="firstName" value={form.firstName} onChange={handleChange} maxLength={FIRST_NAME_MAX_LENGTH} />
                            <Field label={t("register.field.lastName")} name="lastName" value={form.lastName} onChange={handleChange} maxLength={LAST_NAME_MAX_LENGTH} />
                            <Field label={t("common.email")} type="email" name="email" value={form.email}
                                   onChange={handleChange} maxLength={EMAIL_MAX_LENGTH} />
                            <Field label={t("register.field.contactEmail")} type="email" name="contactEmail"
                                   value={form.contactEmail} onChange={handleChange} maxLength={EMAIL_MAX_LENGTH}
                                   hint={t("register.help.contactEmail")} />
                            <Field label={t("register.field.phoneOptional")} type="tel" inputMode="tel"
                                   name="phone" value={form.phone} onChange={handleChange} placeholder="+49123456789" maxLength={PHONE_MAX_LENGTH} />
                            <Field label={t("register.field.degree")}     name="studyProgram"   value={form.studyProgram}   onChange={handleChange} />
                            <Field label={t("register.field.country")}   name="country"        value={form.country}        onChange={handleChange} />
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard id="languages" title={t("account.section.languages")}
                                 refFn={(el) => (sectionRefs.current.languages = el)}
                                 delay={160}>
                        <div className="space-y-5">
                            <Dropdown label={t("register.field.nativeLanguage")} name="nativeLanguage" value={form.nativeLanguage} onChange={handleChange} options={catalogOptions.languages} />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Dropdown label={t("register.field.targetLanguage")} name="targetLanguage" value={form.targetLanguage} onChange={handleChange} options={catalogOptions.languages} />
                                <Dropdown label={t("register.field.searchedLevel")} name="searchedLevel" value={form.searchedLevel} onChange={handleChange} options={languageLevels} />
                            </div>
                            <LanguageLevelPicker
                                label={t("register.field.knownLanguages")}
                                options={catalogOptions.languages}
                                selected={form.knownLanguages}
                                onChange={(languages) => setForm((prev) => ({ ...prev, knownLanguages: languages }))}
                            />
                            <ChipGroup label={t("register.field.goals")} items={catalogOptions.learningGoals}
                                       selected={form.learningGoals} onToggle={(v) => toggleArr("learningGoals", v)} />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Dropdown label={t("register.field.frequency")} name="meetingFrequency" value={form.meetingFrequency} onChange={handleChange} options={catalogOptions.tandemFrequencies} />
                                <Dropdown label={t("register.field.format")}     name="meetingFormat"    value={form.meetingFormat}    onChange={handleChange} options={catalogOptions.tandemForms} />
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard id="interests" title={t("account.section.interests")}
                                 refFn={(el) => (sectionRefs.current.interests = el)}
                                 delay={240}>
                        <ChipGroup items={catalogOptions.hobbies} selected={form.interests} onToggle={(v) => toggleArr("interests", v)} />
                        <div className="mt-4">
                            <Field label={t("account.field.moreInterests")} name="interestsText"
                                   value={form.interestsText} onChange={handleChange} placeholder={t("account.placeholder.moreInterests")}
                                   maxLength={DISTINCT_HOBBY_MAX_LENGTH} />
                        </div>
                    </SectionCard>

                    <SectionCard id="wishes" title={t("account.section.wishes")}
                                 refFn={(el) => (sectionRefs.current.wishes = el)}
                                 delay={320}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Textarea label={t("register.field.expectations")} name="expectations" value={form.expectations} onChange={handleChange} />
                            <Textarea label={t("register.field.contribution")}           name="contribution"  value={form.contribution}  onChange={handleChange} />
                        </div>
                    </SectionCard>

                    {(error || message) && (
                        <div className={`animate-popIn rounded-2xl border px-4 py-3 text-sm ${
                            error ? "border-red-200 bg-red-50 text-red-600" : "border-green-200 bg-green-50 text-green-700"
                        }`}>
                            {error || message}
                        </div>
                    )}

                    <div className="lg:hidden space-y-3">
                        <button type="submit" disabled={saving}
                                className="w-full py-3.5 rounded-xl font-display font-bold text-sm
                                           transition-all hover:shadow-card active:scale-[.98] disabled:opacity-60"
                                style={{ background:"#FFD400", color:"#5F002F" }}>
                            {saving ? t("account.button.saving") : t("account.button.saveChanges")}
                        </button>
                        <button type="button" onClick={handleLogout}
                                className="w-full py-3 rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-red-600
                                           transition-all active:scale-[.98] hover:bg-red-100">
                            {t("common.logout")}
                        </button>
                        <button type="button" onClick={openDeleteDialog}
                                className="w-full py-3 rounded-xl border border-red-200 bg-white text-sm font-bold text-red-600
                                           transition-all active:scale-[.98] hover:bg-red-50">
                            {t("account.delete.button")}
                        </button>
                    </div>
                </form>
            </div>

            <DeleteAccountDialog
                open={deleteDialogOpen}
                countdown={deleteCountdown}
                error={deleteError}
                deleting={deletingAccount}
                onClose={closeDeleteDialog}
                onConfirm={handleDeleteAccount}
            />
        </div>
    );
}

function DeleteAccountDialog({ open, countdown, error, deleting, onClose, onConfirm }) {
    const { t } = useI18n();

    if (!open) return null;

    const disabled = countdown > 0 || deleting;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 animate-fadeUp" onClick={onClose}>
            <section
                className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-card animate-popIn"
                role="dialog"
                aria-modal="true"
                aria-label={t("account.delete.aria")}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-500 mb-1">{t("account.delete.kicker")}</p>
                    <h2 className="font-display text-2xl font-bold text-ovgu-ink">{t("account.delete.title")}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-ovgu-muted">
                        {t("account.delete.text")}
                    </p>
                </div>

                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {countdown > 0
                        ? t("account.delete.wait", { seconds: countdown })
                        : t("account.delete.ready")}
                </div>

                {error && (
                    <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 transition-all hover:border-ovgu-primary hover:text-ovgu-primary disabled:opacity-60"
                    >
                        {t("common.cancel")}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={disabled}
                        className="rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {deleting ? t("account.delete.deleting") : countdown > 0 ? `${countdown}s` : t("account.delete.confirm")}
                    </button>
                </div>
            </section>
        </div>
    );
}

function SectionCard({ id, title, children, delay, refFn }) {
    return (
        <section id={id} ref={refFn}
                 className="animate-fadeUp bg-white rounded-3xl shadow-card hover-lift p-7 scroll-mt-6"
                 style={{ animationDelay: `${delay}ms` }}>
            <div className="flex items-center gap-2.5 mb-5">
                <span className="block w-2.5 h-2.5 rounded-full bg-ovgu-accent animate-pulseSoft" />
                <h2 className="font-display text-lg font-bold text-ovgu-ink">{title}</h2>
            </div>
            {children}
        </section>
    );
}

const inputCls = "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-ovgu-ink outline-none transition-all focus:border-ovgu-accent focus:ring-2 focus:ring-ovgu-accent/10";

function Field({ label, name, value, onChange, type="text", inputMode, placeholder="", minLength, maxLength, hint="" }) {
    return (
        <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{label}</label>
            <input type={type} name={name} value={value} onChange={onChange}
                   inputMode={inputMode} placeholder={placeholder} minLength={minLength} maxLength={maxLength} className={inputCls} />
            {hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
        </div>
    );
}
function Dropdown({ label, name, value, onChange, options }) {
    const { optionLabel } = useI18n();
    const opts = (options ?? []).map((o) => typeof o==="string"?{value:o,label:o}:o);
    return (
        <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{label}</label>
            <select name={name} value={value} onChange={onChange} className={inputCls}>
                {opts.map((o) => <option key={o.value} value={o.value}>{optionLabel(o.value, o.label)}</option>)}
            </select>
        </div>
    );
}
function ChipGroup({ label, items, selected, onToggle }) {
    const { optionLabel } = useI18n();
    const norm = (items ?? []).map((i) => typeof i==="string"?{value:i,label:i}:i);
    return (
        <div>
            {label && <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>}
            <div className="flex flex-wrap gap-2">
                {norm.map((item) => {
                    const active = selected.includes(item.value);
                    return (
                        <button key={item.value} type="button" onClick={() => onToggle(item.value)}
                                className={`min-h-9 rounded-full border px-4 py-2 text-sm font-medium
                                            transition-all duration-200
                                            ${active ? "bg-ovgu-accent border-ovgu-accent text-white scale-[1.04]"
                                    : "border-gray-200 text-gray-600 hover:border-ovgu-accent/60 hover:text-ovgu-accent"}`}>
                            {optionLabel(item.value, item.label)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
function LanguageLevelPicker({ label, options, selected, onChange }) {
    const { t, optionLabel } = useI18n();
    const languageOptions = (options ?? []).map((item) => typeof item === "string" ? { value: item, label: item } : item);
    const normalizedSelected = normalizeUserLanguages(selected);
    const getLanguageLabel = (language) => {
        const option = languageOptions.find((item) => item.value === language);
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
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{label}</p>
            <div className="max-h-44 overflow-y-auto rounded-2xl border border-gray-200 bg-ovgu-surface p-3">
                <div className="flex flex-wrap gap-2">
                    {languageOptions.map((option) => {
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
function Textarea({ label, name, value, onChange, rows=5 }) {
    return (
        <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{label}</label>
            <textarea name={name} value={value} onChange={onChange} rows={rows}
                      className={inputCls + " resize-none"} />
        </div>
    );
}
