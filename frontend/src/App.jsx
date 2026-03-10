import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import VerifyEmail from "./components/auth/VerifyEmail";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import RegisterPage from "./pages/RegisterPage";

const Discover = () => (
  <div className="min-h-screen bg-[#111110] flex items-center justify-center">
    <span className="font-serif text-2xl text-[#e8e6e0]">
      di<span className="text-[#d4a843] italic">sh</span>
      <span className="font-mono text-sm text-[#6b6b67] ml-4">
        // discover page coming soon
      </span>
    </span>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email/:key" element={<VerifyEmail />} />

          {/* Protected Routes Wrapper */}
          <Route element={<ProtectedRoute />}>
            <Route path="/discover" element={<Discover />} />
          </Route>

          {/* 404 Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}