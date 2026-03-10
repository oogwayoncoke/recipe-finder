import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import VerifyEmail from "./components/VerifyEmail";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import RegisterPage from "./pages/RegisterPage";

// Placeholder — replace with real Discover page
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
          {/* Public */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email/:key" element={<VerifyEmail />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/discover" element={<Discover />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
