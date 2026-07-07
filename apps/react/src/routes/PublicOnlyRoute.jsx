import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function PublicOnlyRoute() {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const fallbackPath = location.state?.from?.pathname || "/home";

    if (isAuthenticated) {
        return <Navigate to={fallbackPath} replace />;
    }

    return <Outlet />;
}
