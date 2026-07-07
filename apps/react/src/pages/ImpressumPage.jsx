import { Link } from "react-router-dom";
import { FloatingBlobs } from "../components/ui/FloatingBlobs";
import { LanguageSwitcher } from "../components/ui/LanguageSwitcher";
import { useI18n } from "../i18n/useI18n";

function InfoBlock({ title, children }) {
    return (
        <section className="rounded-3xl bg-white p-6 shadow-card border border-[#E8D0DA] animate-fadeUp">
            <h2 className="font-display text-xl font-bold text-ovgu-ink mb-3">{title}</h2>
            <div className="text-sm text-ovgu-muted leading-relaxed space-y-1">{children}</div>
        </section>
    );
}

export default function ImpressumPage() {
    const { t } = useI18n();

    return (
        <div className="min-h-screen bg-ovgu-soft relative overflow-hidden">
            <FloatingBlobs />

            <header className="relative z-10 bg-white border-b border-ovgu-border/40 px-5 py-4">
                <div className="mx-auto max-w-3xl flex items-center justify-between gap-4">
                    <Link to="/" className="font-display text-2xl font-bold text-ovgu-primary hover:opacity-80 transition-opacity">
                        Link<span className="text-ovgu-accent">Up</span>
                    </Link>
                    <LanguageSwitcher />
                </div>
            </header>

            <main className="relative z-10 mx-auto max-w-3xl px-5 py-10 space-y-5">
                <div className="animate-slideInRight">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-ovgu-accent mb-2">{t("imprint.kicker")}</p>
                    <h1 className="font-display text-4xl font-bold text-ovgu-ink mb-3">{t("imprint.title")}</h1>
                    <p className="text-sm text-ovgu-muted">{t("imprint.subtitle")}</p>
                </div>

                <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-5 text-sm text-yellow-900 animate-fadeUp">
                    <p className="font-bold mb-1">{t("imprint.noticeTitle")}</p>
                    <p>{t("imprint.noticeText")}</p>
                </div>

                <InfoBlock title={t("imprint.provider")}>
                    <p className="font-bold text-ovgu-ink">{t("imprint.placeholder.name")}</p>
                    <p>{t("imprint.placeholder.street")}</p>
                    <p>{t("imprint.placeholder.city")}</p>
                    <p>{t("imprint.country")}</p>
                </InfoBlock>

                <InfoBlock title={t("imprint.contact")}>
                    <p>{t("common.email")}: <a className="font-bold text-ovgu-primary hover:underline" href={`mailto:${t("imprint.placeholder.email")}`}>{t("imprint.placeholder.email")}</a></p>
                    <p>{t("imprint.phone")}: {t("imprint.placeholder.phone")}</p>
                </InfoBlock>

                <InfoBlock title={t("imprint.responsible")}>
                    <p>{t("imprint.placeholder.name")}</p>
                    <p>{t("imprint.placeholder.street")}, {t("imprint.placeholder.city")}</p>
                </InfoBlock>

                <InfoBlock title={t("imprint.disclaimer")}>
                    <p>{t("imprint.disclaimerText")}</p>
                </InfoBlock>
            </main>
        </div>
    );
}
