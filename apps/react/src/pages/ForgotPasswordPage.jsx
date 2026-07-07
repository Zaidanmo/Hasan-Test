import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { forgotPassword, verifyResetCode, resetPassword } from "../api/authApi";
import { LanguageSwitcher } from "../components/ui/LanguageSwitcher";
import { useI18n } from "../i18n/useI18n";

function FloatingBlobs() {
    return (
        <>
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full translate-x-1/3 -translate-y-1/3 animate-floatBlob pointer-events-none"
                 style={{ background: "rgba(122,0,63,0.055)", animationDuration: "7s" }} />
            <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full -translate-x-1/3 translate-y-1/3 animate-floatBlob pointer-events-none"
                 style={{ background: "rgba(255,105,120,0.09)", animationDuration: "9s", animationDelay: "2s" }} />
        </>
    );
}

// ── Schritt 1: E-Mail eingeben ────────────────────────────────────────────────
function StepEmail({ onNext }) {
    const { t } = useI18n();
    const [email, setEmail]     = useState("");
    const [error, setError]     = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await forgotPassword(email);
            onNext(email);
        } catch {
            setError(t("forgot.emailError"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fadeUp">
            <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-ovgu-accent mb-2">{t("forgot.step1")}</p>
                <h1 className="font-display text-3xl font-bold text-ovgu-ink mb-2">{t("forgot.emailTitle")}</h1>
                <p className="text-sm text-ovgu-muted">
                    {t("forgot.emailText")}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-ovgu-muted mb-1.5">
                        {t("forgot.emailLabel")}
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        placeholder="name@example.com"
                        required
                        className="w-full px-4 py-3 rounded-xl border text-sm text-ovgu-ink outline-none transition-all"
                        style={{ borderColor: error ? "#ef4444" : "#E8D0DA", background: "#fff" }}
                        onFocus={(e) => e.target.style.borderColor = "#7A003F"}
                        onBlur={(e) => e.target.style.borderColor = error ? "#ef4444" : "#E8D0DA"}
                    />
                    {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full py-3.5 rounded-xl font-display font-bold text-sm overflow-hidden transition-all hover:shadow-cardHov disabled:opacity-60"
                    style={{ background: "#7A003F", color: "#fff" }}
                >
                    <span className="absolute inset-0 shimmer-bar opacity-0 hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                    <span className="relative flex items-center justify-center gap-2">
                        {loading ? (
                            <>
                                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spinSlow" />
                                {t("forgot.sending")}
                            </>
                        ) : t("forgot.sendCode")}
                    </span>
                </button>
            </form>
        </div>
    );
}

// ── Schritt 2: 6-stelligen Code eingeben ─────────────────────────────────────
function StepCode({ email, onNext, onBack }) {
    const { t } = useI18n();
    const [code, setCode]       = useState(["", "", "", "", "", ""]);
    const [error, setError]     = useState("");
    const [loading, setLoading] = useState(false);
    const inputsRef             = useRef([]);

    const handleChange = (val, idx) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...code];
        next[idx] = val;
        setCode(next);
        setError("");
        if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
    };

    const handleKeyDown = (e, idx) => {
        if (e.key === "Backspace" && !code[idx] && idx > 0) {
            inputsRef.current[idx - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (text.length === 6) {
            setCode(text.split(""));
            inputsRef.current[5]?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fullCode = code.join("");
        if (fullCode.length < 6) { setError(t("forgot.codeMissing")); return; }
        setLoading(true);
        try {
            const data = await verifyResetCode(email, fullCode);
            onNext(data.resetToken);
        } catch {
            setError(t("forgot.codeError"));
            setCode(["", "", "", "", "", ""]);
            inputsRef.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fadeUp">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-ovgu-muted mb-6 hover:text-ovgu-primary transition-colors">
                ← {t("common.back")}
            </button>

            <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-ovgu-accent mb-2">{t("forgot.step2")}</p>
                <h1 className="font-display text-3xl font-bold text-ovgu-ink mb-2">{t("forgot.codeTitle")}</h1>
                <p className="text-sm text-ovgu-muted">
                    {t("forgot.codeText", { email })}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Code Boxes */}
                <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
                    {code.map((digit, idx) => (
                        <input
                            key={idx}
                            ref={(el) => (inputsRef.current[idx] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(e.target.value, idx)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            className="w-11 h-14 rounded-xl border text-center text-xl font-display font-bold outline-none transition-all animate-popIn"
                            style={{
                                borderColor: error ? "#ef4444" : digit ? "#7A003F" : "#E8D0DA",
                                background: digit ? "rgba(122,0,63,0.04)" : "#fff",
                                color: "#1B1B1F",
                                animationDelay: `${idx * 45}ms`,
                            }}
                            onFocus={(e) => e.target.style.borderColor = "#7A003F"}
                            onBlur={(e) => e.target.style.borderColor = error ? "#ef4444" : digit ? "#7A003F" : "#E8D0DA"}
                        />
                    ))}
                </div>

                {error && (
                    <p className="text-red-500 text-xs text-center animate-fadeUp">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={loading || code.join("").length < 6}
                    className="relative w-full py-3.5 rounded-xl font-display font-bold text-sm overflow-hidden transition-all hover:shadow-cardHov disabled:opacity-50"
                    style={{ background: "#7A003F", color: "#fff" }}
                >
                    <span className="absolute inset-0 shimmer-bar opacity-0 hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                    <span className="relative flex items-center justify-center gap-2">
                        {loading ? (
                            <>
                                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spinSlow" />
                                {t("forgot.checking")}
                            </>
                        ) : t("common.next")}
                    </span>
                </button>
            </form>
        </div>
    );
}

// ── Schritt 3: {t("forgot.newPassword")} setzen ─────────────────────────────────────────
function StepReset({ resetToken, onBack, onDone }) {
    const { t } = useI18n();
    const [form, setForm]       = useState({ password: "", confirm: "" });
    const [show, setShow]       = useState({ password: false, confirm: false });
    const [error, setError]     = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 8) {
            setError(t("forgot.minPassword"));
            return;
        }
        if (form.password !== form.confirm) {
            setError(t("forgot.passwordMismatch"));
            return;
        }
        setLoading(true);
        try {
            await resetPassword(resetToken, form.password);
            onDone();
        } catch {
            setError(t("forgot.resetError"));
        } finally {
            setLoading(false);
        }
    };

    const EyeBtn = ({ field }) => (
        <button type="button" tabIndex={-1}
                onClick={() => setShow((s) => ({ ...s, [field]: !s[field] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ovgu-muted hover:text-ovgu-primary transition-colors text-xs font-semibold">
            {show[field] ? t("common.hide") : t("common.show")}
        </button>
    );

    return (
        <div className="animate-fadeUp">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-ovgu-muted mb-6 hover:text-ovgu-primary transition-colors">
                ← {t("common.back")}
            </button>

            <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-ovgu-accent mb-2">{t("forgot.step3")}</p>
                <h1 className="font-display text-3xl font-bold text-ovgu-ink mb-2">{t("forgot.resetTitle")}</h1>
                <p className="text-sm text-ovgu-muted">{t("forgot.resetText")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* {t("forgot.newPassword")} */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-ovgu-muted mb-1.5">
                        {t("forgot.newPassword")}
                    </label>
                    <div className="relative">
                        <input
                            type={show.password ? "text" : "password"}
                            value={form.password}
                            onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setError(""); }}
                            placeholder={t("forgot.passwordPlaceholder")}
                            required
                            className="w-full px-4 py-3 pr-24 rounded-xl border text-sm text-ovgu-ink outline-none transition-all"
                            style={{ borderColor: "#E8D0DA", background: "#fff" }}
                            onFocus={(e) => e.target.style.borderColor = "#7A003F"}
                            onBlur={(e) => e.target.style.borderColor = "#E8D0DA"}
                        />
                        <EyeBtn field="password" />
                    </div>
                </div>

                {/* {t("forgot.confirmPassword")} */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-ovgu-muted mb-1.5">
                        {t("forgot.confirmPassword")}
                    </label>
                    <div className="relative">
                        <input
                            type={show.confirm ? "text" : "password"}
                            value={form.confirm}
                            onChange={(e) => { setForm((f) => ({ ...f, confirm: e.target.value })); setError(""); }}
                            placeholder={t("forgot.repeatPlaceholder")}
                            required
                            className="w-full px-4 py-3 pr-24 rounded-xl border text-sm text-ovgu-ink outline-none transition-all"
                            style={{ borderColor: error && form.confirm ? "#ef4444" : "#E8D0DA", background: "#fff" }}
                            onFocus={(e) => e.target.style.borderColor = "#7A003F"}
                            onBlur={(e) => e.target.style.borderColor = "#E8D0DA"}
                        />
                        <EyeBtn field="confirm" />
                    </div>
                </div>

                {error && <p className="text-red-500 text-xs animate-fadeUp">{error}</p>}

                <div className="flex gap-3 pt-1">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex-1 py-3 rounded-xl border font-display font-bold text-sm transition-all hover:shadow-card"
                        style={{ borderColor: "#E8D0DA", color: "#7A003F" }}
                    >
                        {t("common.cancel")}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="relative flex-1 py-3 rounded-xl font-display font-bold text-sm overflow-hidden transition-all hover:shadow-cardHov disabled:opacity-60"
                        style={{ background: "#7A003F", color: "#fff" }}
                    >
                        <span className="absolute inset-0 shimmer-bar opacity-0 hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                        <span className="relative flex items-center justify-center gap-2">
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spinSlow" />
                                    {t("common.saving")}
                                </>
                            ) : t("common.save")}
                        </span>
                    </button>
                </div>
            </form>
        </div>
    );
}

// ── Erfolg ────────────────────────────────────────────────────────────────────
function StepSuccess() {
    const { t } = useI18n();
    return (
        <div className="flex flex-col items-center text-center animate-fadeUp">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-5 animate-stepPop"
                 style={{ background: "rgba(34,197,94,0.12)" }}>
                ✅
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-ovgu-accent mb-2 animate-fadeUp" style={{ animationDelay: "80ms" }}>
                {t("forgot.done")}
            </p>
            <h1 className="font-display text-3xl font-bold text-ovgu-ink mb-2 animate-fadeUp" style={{ animationDelay: "120ms" }}>
                {t("forgot.successTitle")}
            </h1>
            <p className="text-sm text-ovgu-muted mb-7 animate-fadeUp" style={{ animationDelay: "160ms" }}>
                {t("forgot.successText")}
            </p>
            <Link
                to="/login"
                className="relative px-8 py-3.5 rounded-xl font-display font-bold text-sm overflow-hidden transition-all hover:shadow-cardHov animate-fadeUp"
                style={{ background: "#FFD400", color: "#5F002F", animationDelay: "200ms" }}
            >
                <span className="absolute inset-0 shimmer-bar opacity-0 hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                <span className="relative">{t("forgot.toLogin")}</span>
            </Link>
        </div>
    );
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
    const { t } = useI18n();
    const [step, setStep]             = useState(1); // 1 | 2 | 3 | 4
    const [email, setEmail]           = useState("");
    const [resetToken, setResetToken] = useState("");

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
             style={{ background: "#F7EEF3" }}>
            <FloatingBlobs />

            <div className="relative z-10 w-full max-w-sm">
                {/* Logo */}
                <div className="mb-8 flex items-center justify-center gap-4 animate-fadeUp">
                    <Link to="/login" className="font-display text-2xl font-bold text-ovgu-primary">
                        Link<span style={{ color: "#FFD400" }}>Up</span>
                    </Link>
                    <LanguageSwitcher />
                </div>

                {/* Card */}
                <div className="rounded-3xl bg-white p-8 shadow-ovgu animate-popIn">
                    {/* Step indicator dots */}
                    {step < 4 && (
                        <div className="flex justify-center gap-2 mb-7">
                            {[1, 2, 3].map((s) => (
                                <span key={s} className="rounded-full transition-all duration-300"
                                      style={{
                                          width: s === step ? "20px" : "8px",
                                          height: "8px",
                                          background: s <= step ? "#7A003F" : "#E8D0DA",
                                      }} />
                            ))}
                        </div>
                    )}

                    {step === 1 && (
                        <StepEmail onNext={(e) => { setEmail(e); setStep(2); }} />
                    )}
                    {step === 2 && (
                        <StepCode
                            email={email}
                            onNext={(token) => { setResetToken(token); setStep(3); }}
                            onBack={() => setStep(1)}
                        />
                    )}
                    {step === 3 && (
                        <StepReset
                            resetToken={resetToken}
                            onBack={() => setStep(2)}
                            onDone={() => setStep(4)}
                        />
                    )}
                    {step === 4 && <StepSuccess />}
                </div>

                {step < 4 && (
                    <p className="text-center text-sm text-ovgu-muted mt-5 animate-fadeUp">
                        {t("forgot.remembered")}{" "}
                        <Link to="/login" className="text-ovgu-primary font-bold hover:underline">
                            {t("common.login")}
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
