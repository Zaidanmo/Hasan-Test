import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCurrentUser } from "../../api/userApi";
import { useAuth } from "../../auth/useAuth";
import { useI18n } from "../../i18n/useI18n";
import { ProfileAvatar } from "../profile/ProfileAvatar";

function read(value, ...keys) {
    for (const key of keys) {
        if (value?.[key] !== undefined && value?.[key] !== null) {
            return value[key];
        }
    }

    return undefined;
}

function unwrapUserProfile(data) {
    return data?.user ?? data?.User ?? data ?? {};
}

function getInitial(firstName, username, email) {
    const source = firstName || username || email || "?";
    return source.trim().charAt(0).toUpperCase() || "?";
}

export function HeaderProfileLink() {
    const { user } = useAuth();
    const { t } = useI18n();
    const [profile, setProfile] = useState(null);
    const userId = user?.id ?? user?.Id ?? "";

    useEffect(() => {
        let active = true;

        (async () => {
            try {
                const response = await getCurrentUser();
                if (active) {
                    setProfile(unwrapUserProfile(response));
                }
            } catch (requestError) {
                console.error("Could not load header profile picture", requestError);
            }
        })();

        return () => {
            active = false;
        };
    }, [userId]);

    const avatar = useMemo(() => {
        const firstName = read(profile, "firstName", "FirstName") ?? user?.firstName ?? user?.FirstName ?? "";
        const username = user?.username ?? user?.Username ?? "";
        const email = user?.email ?? user?.Email ?? "";
        const hasProfilePicture = Boolean(
            read(profile, "hasProfilePicture", "HasProfilePicture") ??
            read(user, "hasProfilePicture", "HasProfilePicture")
        );

        return {
            fallback: getInitial(firstName, username, email),
            hasProfilePicture,
        };
    }, [profile, user]);

    return (
        <Link
            to="/account/edit"
            className="rounded-full transition-all hover:scale-105 focus:outline-none focus:ring-4 focus:ring-ovgu-accent/30"
            title={t("common.profile")}
            aria-label={t("common.profile")}
        >
            <ProfileAvatar
                userId={userId}
                hasProfilePicture={avatar.hasProfilePicture}
                fallback={avatar.fallback}
                color="#7A003F"
                className="h-9 w-9"
                textClassName="text-sm"
                imageAlt={t("common.profile")}
            />
        </Link>
    );
}
