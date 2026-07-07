import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import { useAuth } from "../auth/useAuth";
import { LanguageSwitcher } from "../components/ui/LanguageSwitcher";
import { useI18n } from "../i18n/useI18n";
import { getApiErrorMessage } from "../utils/apiErrorMessages";

export default function LoginPage() {
    const navigate  = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const { t } = useI18n();
    const redirectTo = location.state?.from?.pathname || "/home";
    const [form, setForm]       = useState({ email: "", password: "" });
    const [error, setError]     = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await loginUser({ email: form.email, password: form.password });
            login(res);
            setSuccess(true);
            navigate(redirectTo, { replace: true });
        } catch (e) {
            setError(getApiErrorMessage(e, t, "login.error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-ovgu-soft flex items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-5xl flex rounded-[2rem] overflow-hidden shadow-ovgu">
                <div className="hidden lg:flex flex-col justify-between bg-ovgu-primary w-[46%] p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-72 h-72 rounded-full translate-x-1/3 -translate-y-1/3 animate-floatBlob"
                         style={{ background: "rgba(255,212,0,0.09)", animationDuration: "7s" }} />
                    <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full -translate-x-1/3 translate-y-1/3 animate-floatBlob"
                         style={{ background: "rgba(255,105,120,0.10)", animationDuration: "9s", animationDelay: "2s" }} />
                    <div className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full -translate-x-1/2 -translate-y-1/2 animate-floatBlob"
                         style={{ background: "rgba(255,212,0,0.05)", animationDuration: "11s", animationDelay: "1s" }} />

                    <div className="relative z-10 flex items-center justify-between gap-4 animate-slideInLeft" style={{ animationDelay: "0ms" }}>
                        <span className="font-display text-3xl font-bold text-white tracking-tight">
                            Link<span style={{ color: "#FFD400" }}>Up</span>
                        </span>
                        <LanguageSwitcher dark />
                    </div>

                    <div className="relative z-10">
                        <p className="animate-slideInLeft text-xs font-semibold tracking-[0.28em] uppercase mb-5"
                           style={{ color: "rgba(255,212,0,0.65)", animationDelay: "80ms" }}>
                            {t("app.program")}
                        </p>
                        <h1 className="animate-slideInLeft font-display text-[3.2rem] font-bold text-white leading-[1.05] mb-5"
                            style={{ animationDelay: "160ms" }}>
                            {t("login.hero.title").split("\n").map((line, index, lines) => (
                                <span key={line}>{line}{index < lines.length - 1 && <br />}</span>
                            ))}
                        </h1>
                        <div className="animate-slideInLeft h-1 w-14 rounded-full mb-8"
                             style={{ background: "#FFD400", animationDelay: "240ms" }} />

                        <div className="animate-fadeUp rounded-2xl p-5 hover-lift"
                             style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)", animationDelay: "320ms" }}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                     style={{ background: "linear-gradient(135deg,#FFD400,#FF6978)", color: "#5F002F" }}>L</div>
                                <div>
                                    <p className="text-white text-sm font-semibold">Lena</p>
                                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.42)" }}>{t("login.sample.level")}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {["Sport", "Gaming", "Travel"].map((h, i) => (
                                    <span key={h}
                                          className="animate-popIn rounded-full px-3 py-0.5 text-xs font-medium"
                                          style={{ background: "rgba(255,212,0,0.13)", color: "#FFD400",
                                              border: "1px solid rgba(255,212,0,0.26)", animationDelay: `${380 + i * 60}ms` }}>
                                        {t(`option.${h}`)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <p className="animate-fadeUp relative z-10 text-sm leading-relaxed"
                       style={{ color: "rgba(255,255,255,0.32)", animationDelay: "480ms" }}>
                        {t("login.hero.subtitle")}
                    </p>
                </div>

                <div className="flex-1 bg-white flex flex-col justify-center px-10 py-14">
                    <div className="flex items-center justify-between gap-4 mb-10 lg:hidden animate-fadeUp">
                        <span className="font-display text-2xl font-bold text-ovgu-primary block">
                            Link<span className="text-ovgu-accent">Up</span>
                        </span>
                        <LanguageSwitcher />
                    </div>

                    <div className="max-w-sm w-full">
                        <div className="animate-slideInRight" style={{ animationDelay: "0ms" }}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="block w-2 h-2 rounded-full bg-ovgu-accent animate-pulseSoft" />
                                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-ovgu-accent">{t("login.tag")}</span>
                            </div>
                            <h2 className="font-display text-4xl font-bold text-ovgu-ink leading-tight mb-1">
                                {t("login.title").split("\n").map((line, index, lines) => (
                                    <span key={line}>{line}{index < lines.length - 1 && <br />}</span>
                                ))}
                            </h2>
                            <p className="text-sm text-gray-400 mb-10">{t("login.subtitle")}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="animate-slideInRight" style={{ animationDelay: "80ms" }}>
                                <FormField label={t("common.email")} type="email" name="email"
                                           value={form.email} onChange={handleChange}
                                           placeholder="name@example.com" required />
                            </div>
                            <div className="animate-slideInRight" style={{ animationDelay: "160ms" }}>
                                <FormField label={t("common.password")} type="password" name="password"
                                           value={form.password} onChange={handleChange}
                                           placeholder="••••••••" required />
                                <div className="text-right mt-1.5">
                                    <Link to="/forgot-password"
                                          className="inline-flex min-h-8 items-center text-xs font-semibold text-ovgu-accent hover:text-ovgu-primary transition-colors">
                                        {t("login.forgot")}
                                    </Link>
                                </div>
                            </div>

                            {error && (
                                <div className="animate-popIn rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <div className="animate-slideInRight" style={{ animationDelay: "240ms" }}>
                                <button type="submit" disabled={loading || success}
                                        className="relative w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-wide
                                                   overflow-hidden transition-all hover:shadow-cardHov disabled:opacity-70"
                                        style={{ background: success ? "#22c55e" : "#FFD400",
                                            color: success ? "#fff" : "#5F002F" }}>
                                    <span className="absolute inset-0 shimmer-bar opacity-0 hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                                    <span className="relative flex items-center justify-center gap-2">
                                        {loading && (
                                            <span className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spinSlow" />
                                        )}
                                        {success ? t("login.success") : loading ? t("login.loading") : t("login.submit")}
                                    </span>
                                </button>
                            </div>
                        </form>

                        <p className="animate-fadeUp mt-8 text-sm text-gray-400" style={{ animationDelay: "360ms" }}>
                            {t("login.noAccount")} {" "}
                            <Link to="/register" className="inline-flex min-h-8 items-center font-semibold text-ovgu-primary hover:text-ovgu-accent transition-colors">
                                {t("login.createAccount")}
                            </Link>
                        </p>
                        <p className="animate-fadeUp mt-4 text-xs text-gray-400" style={{ animationDelay: "400ms" }}>
                            <Link to="/impressum" className="inline-flex min-h-8 items-center font-semibold text-ovgu-primary hover:text-ovgu-accent transition-colors">
                                {t("common.imprint")}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FormField({ label, name, type = "text", value, onChange, placeholder, required }) {
    return (
        <label className="block">
            <span className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </span>
            <input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-ovgu-ink outline-none transition-all focus:border-ovgu-accent focus:ring-2 focus:ring-ovgu-accent/10"
            />
        </label>
    );
}
