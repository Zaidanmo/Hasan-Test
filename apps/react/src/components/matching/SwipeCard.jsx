import { useEffect, useRef, useState } from "react";
import { Chip } from "../ui/Chip";
import { getCatalogLabel, getDisplayInterests } from "../../utils/profileFormatters";
import { useI18n } from "../../i18n/useI18n";
import { useProfileCatalogs } from "../../hooks/useProfileCatalogs";
import { ProfileAvatar } from "../profile/ProfileAvatar";

function getField(value, ...keys) {
    for (const key of keys) {
        if (value?.[key] !== undefined && value?.[key] !== null) return value[key];
    }

    return undefined;
}

function formatTargetLanguage(language, optionLabel) {
    if (!language) return "";
    if (typeof language === "string") return optionLabel(language, language);

    const name = optionLabel(getField(language, "language", "Language"), getField(language, "language", "Language"));
    const level = optionLabel(getField(language, "level", "Level"), getField(language, "level", "Level"));

    return [name, level].filter(Boolean).join(" · ");
}

export function SwipeCard({ profile, onSwipe, onOpenDetails, isTop, stackIndex = 0, buttonSwipe }) {
    const { t, language, optionLabel } = useI18n();
    const catalogOptions = useProfileCatalogs();
    const cardRef = useRef(null);
    const leftOverlayRef = useRef(null);
    const rightOverlayRef = useRef(null);
    const rafRef = useRef(null);
    const swipeTimeoutRef = useRef(null);
    const dragRef = useRef({ active: false, startX: 0, startY: 0, dx: 0, dy: 0, hasDragged: false });
    const [isDragging, setIsDragging] = useState(false);
    const [leaving, setLeaving] = useState(null);

    const SWIPE_THRESHOLD = 96;
    const externalLeaving = isTop && buttonSwipe?.id === profile.id ? buttonSwipe.dir : null;
    const activeLeaving = leaving || externalLeaving;
    const displayInterests = Array.isArray(profile?.hobbies)
        ? [
            ...profile.hobbies.map((interest) => getCatalogLabel(catalogOptions.hobbies, interest, optionLabel)),
            profile?.distincthobby ?? profile?.distinctHobby ?? profile?.interestsText ?? "",
        ].filter(Boolean).filter((value, index, array) => array.indexOf(value) === index)
        : getDisplayInterests(profile, catalogOptions.hobbies, optionLabel);
    const targetLanguage = formatTargetLanguage(profile.targetLanguage, optionLabel);
    const tandemForm = getCatalogLabel(catalogOptions.tandemForms, profile.tandemForm, optionLabel);
    const tandemFrequency = getCatalogLabel(catalogOptions.tandemFrequencies, profile.tandemFrequency, optionLabel);
    const tandemText = [tandemForm, tandemFrequency].filter(Boolean).join(" · ");
    const baseScale = 1 - stackIndex * 0.035;
    const baseY = stackIndex * 12;

    const getDragTransform = (dx = 0, dy = 0, lift = false) => {
        const rotation = Math.max(-18, Math.min(18, dx / 16));
        const dragY = dy * 0.28;
        const liftY = lift ? -6 : 0;
        return `translate3d(${dx}px, ${baseY + dragY + liftY}px, 0) rotate(${rotation}deg) scale(${baseScale})`;
    };

    const setOverlayOpacity = (dx = 0, forcedDir = null) => {
        const opacity = forcedDir ? 1 : Math.min(Math.abs(dx) / SWIPE_THRESHOLD, 1);
        const isRight = forcedDir === "right" || (!forcedDir && dx > 0);

        if (leftOverlayRef.current) {
            leftOverlayRef.current.style.opacity = !isRight && opacity > 0 ? String(opacity) : "0";
        }

        if (rightOverlayRef.current) {
            rightOverlayRef.current.style.opacity = isRight && opacity > 0 ? String(opacity) : "0";
        }
    };

    const applyDragTransform = (dx, dy) => {
        if (!cardRef.current) return;

        cardRef.current.style.transform = getDragTransform(dx, dy, true);
        setOverlayOpacity(dx);
    };

    useEffect(() => () => {
        if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
        if (swipeTimeoutRef.current) window.clearTimeout(swipeTimeoutRef.current);
    }, []);

    useEffect(() => {
        if (activeLeaving) {
            setOverlayOpacity(0, activeLeaving);
        }
    }, [activeLeaving]);

    const onPointerDown = (e) => {
        if (!isTop || activeLeaving) return;

        cardRef.current?.setPointerCapture(e.pointerId);
        dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, hasDragged: false };

        if (cardRef.current) {
            cardRef.current.style.transition = "none";
            cardRef.current.style.boxShadow = "0 16px 50px rgba(122,0,63,0.22)";
        }

        setIsDragging(true);
    };

    const onPointerMove = (e) => {
        if (!dragRef.current.active || activeLeaving) return;

        e.preventDefault();

        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        dragRef.current.dx = dx;
        dragRef.current.dy = dy;
        dragRef.current.hasDragged = Math.abs(dx) > 8 || Math.abs(dy) > 8;

        if (rafRef.current) return;

        rafRef.current = window.requestAnimationFrame(() => {
            rafRef.current = null;
            applyDragTransform(dragRef.current.dx, dragRef.current.dy);
        });
    };

    const onPointerUp = () => {
        if (!dragRef.current.active || activeLeaving) return;

        dragRef.current.active = false;
        setIsDragging(false);

        if (rafRef.current) {
            window.cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        const { dx } = dragRef.current;

        if (Math.abs(dx) > SWIPE_THRESHOLD) {
            const dir = dx > 0 ? "right" : "left";
            setLeaving(dir);
            swipeTimeoutRef.current = window.setTimeout(() => onSwipe(dir, profile.id), 320);
            return;
        }

        if (cardRef.current) {
            cardRef.current.style.transition = "transform 0.28s cubic-bezier(0.22,1,0.36,1), opacity 0.28s";
            cardRef.current.style.transform = getDragTransform(0, 0, false);
            cardRef.current.style.boxShadow = "0 8px 40px rgba(122,0,63,0.16)";
        }

        setOverlayOpacity(0);
    };

    const handleClick = () => {
        if (!isTop || dragRef.current.hasDragged || activeLeaving) return;
        onOpenDetails(profile);
    };

    let transform = getDragTransform(0, 0, isDragging);
    if (activeLeaving === "right") transform = "translate3d(115vw, -8vh, 0) rotate(24deg) scale(0.92)";
    if (activeLeaving === "left") transform = "translate3d(-115vw, -8vh, 0) rotate(-24deg) scale(0.92)";

    return (
        <div
            ref={cardRef}
            onClick={handleClick}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`absolute inset-0 rounded-3xl select-none ${isTop ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"}`}
            style={{
                transform,
                opacity: activeLeaving ? 0.98 : 1 - stackIndex * 0.08,
                transition: activeLeaving || !isDragging
                    ? "transform 0.34s cubic-bezier(0.22,1,0.36,1), opacity 0.34s"
                    : "none",
                touchAction: "none",
                willChange: "transform",
                zIndex: 20 - stackIndex,
                transformOrigin: "50% 90%",
                boxShadow: isDragging || activeLeaving
                    ? "0 16px 50px rgba(122,0,63,0.22)"
                    : "0 8px 40px rgba(122,0,63,0.16)",
            }}
        >
            <div
                className="w-full h-full rounded-3xl overflow-hidden flex flex-col"
                style={{ background: "#fff" }}
            >
                <div
                    className="flex-1 flex items-center justify-center relative overflow-hidden"
                    style={{ background: `linear-gradient(160deg, ${profile.avatarColor}22, ${profile.avatarColor}08)` }}
                >
                    <div
                        className="absolute top-5 left-5 rounded-full px-3 py-1 text-xs font-bold animate-slideInLeft"
                        style={{ background: "rgba(255,255,255,0.74)", color: "#7A003F", backdropFilter: "blur(10px)", animationDelay: "120ms" }}
                    >
                        {profile.compatibility} {t("common.points")}
                    </div>

                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onOpenDetails(profile); }}
                        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center text-sm font-bold text-ovgu-primary shadow-card transition-all hover:scale-105"
                        aria-label={t("card.info")}
                    >
                        ℹ
                    </button>

                    <div
                        ref={leftOverlayRef}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-t-3xl transition-opacity"
                        style={{ background: "rgba(239,68,68,0.15)", opacity: activeLeaving === "left" ? 1 : 0 }}
                    >
                        <span className="font-display font-bold text-5xl text-red-500 rotate-[-25deg] animate-popIn">
                            {t("matchModal.later")}
                        </span>
                    </div>

                    <div
                        ref={rightOverlayRef}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-t-3xl transition-opacity"
                        style={{ background: "rgba(34,197,94,0.15)", opacity: activeLeaving === "right" ? 1 : 0 }}
                    >
                        <span className="font-display font-bold text-5xl text-green-500 rotate-[25deg] animate-popIn">
                            Like
                        </span>
                    </div>

                    <ProfileAvatar
                        userId={profile.userId || profile.id}
                        hasProfilePicture={profile.hasProfilePicture}
                        fallback={profile.avatarInitial}
                        color={profile.avatarColor}
                        className="h-28 w-28 animate-stepPop"
                        textClassName="text-5xl"
                        imageAlt={profile.firstName}
                    />
                </div>

                <div className="p-5 pb-6 bg-white">
                    <div className="flex items-start justify-between gap-3 mb-1 animate-fadeUp" style={{ animationDelay: "120ms" }}>
                        <div>
                            <h2 className="font-display text-2xl font-bold text-ovgu-ink">
                                {profile.firstName}
                            </h2>
                            <p className="text-sm font-semibold text-ovgu-muted">
                                {[profile.country, profile.studyProgram].filter(Boolean).join(" · ")}
                            </p>
                            {(targetLanguage || tandemText) && (
                                <p className="text-xs font-semibold text-ovgu-muted mt-1">
                                    {[targetLanguage, tandemText].filter(Boolean).join(" · ")}
                                </p>
                            )}
                        </div>
                    </div>

                    <p className="text-sm text-ovgu-muted leading-relaxed line-clamp-2 mb-4 animate-fadeUp" style={{ animationDelay: "170ms" }}>
                        {language === "de" ? (profile.matchReason || profile.bio) : t("profile.goodFitDefault")}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {displayInterests.slice(0, 3).map((item, index) => (
                            <Chip key={item} index={index} animated>{item}</Chip>
                        ))}
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 animate-fadeUp" style={{ animationDelay: "260ms" }}>
                        <div className="rounded-2xl bg-ovgu-soft p-2.5 text-center">
                            <p className="text-[9px] uppercase font-bold text-ovgu-muted tracking-wide">{t("card.score.language")}</p>
                            <p className="font-display font-bold text-ovgu-primary">{profile.languageScore}</p>
                        </div>
                        <div className="rounded-2xl bg-ovgu-soft p-2.5 text-center">
                            <p className="text-[9px] uppercase font-bold text-ovgu-muted tracking-wide">{t("card.score.hobby")}</p>
                            <p className="font-display font-bold text-ovgu-primary">{profile.hobbyScore}</p>
                        </div>
                        <div className="rounded-2xl bg-ovgu-soft p-2.5 text-center">
                            <p className="text-[9px] uppercase font-bold text-ovgu-muted tracking-wide">{t("card.score.goals")}</p>
                            <p className="font-display font-bold text-ovgu-primary">{profile.learningGoalScore}</p>
                        </div>
                        <div className="rounded-2xl bg-ovgu-soft p-2.5 text-center">
                            <p className="text-[9px] uppercase font-bold text-ovgu-muted tracking-wide">{t("card.score.tandem")}</p>
                            <p className="font-display font-bold text-ovgu-primary">{profile.tandemPreferenceScore}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
