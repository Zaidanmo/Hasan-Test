import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { I18nProvider } from "./i18n/I18nProvider";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicOnlyRoute from "./routes/PublicOnlyRoute";
import RootRedirect from "./routes/RootRedirect";
import AccountEditPage from "./pages/AccEditPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import ContactsPage from "./pages/ContactsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ImpressumPage from "./pages/ImpressumPage";

function App() {
    return (
        <I18nProvider>
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/impressum" element={<ImpressumPage />} />

                    <Route element={<PublicOnlyRoute />}>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    </Route>

                    <Route element={<ProtectedRoute />}>
                        <Route path="/account/edit" element={<AccountEditPage />} />
                        <Route path="/home" element={<HomePage />} />
                        <Route path="/kontakte" element={<ContactsPage />} />
                        <Route path="/favoriten" element={<Navigate to="/kontakte" replace />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
        </I18nProvider>
    );
}

export default App;
