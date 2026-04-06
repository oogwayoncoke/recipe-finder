import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import VerifyEmail from "./components/auth/VerifyEmail";
import DishChatbot from "./components/chat/DishChatbot";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import DietSetupPage from "./pages/DietSetupPage";
import DiscoverPage from "./pages/DiscoverPage";
import GetStartedPage from "./pages/GetStartedPage";
import GoogleCallbackPage from "./pages/GoogleCallbackPage";
import GroceryListPage from "./pages/GroceryListPage";
import LoginPage from "./pages/LoginPage";
import MealPlannerPage from "./pages/MealPlannerPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

const CHATBOT_HIDE_PREFIXES = [
  "/login",
  "/register",
  "/get-started",
  "/diet-setup",
  "/verify-email",
  "/auth/",
  "/reset-password",
];

function ChatbotWrapper() {
  const { pathname } = useLocation();
  if (CHATBOT_HIDE_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  return <DishChatbot />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route
                path="/"
                element={<Navigate to="/get-started" replace />}
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email/:key" element={<VerifyEmail />} />
              <Route
                path="/auth/google/callback"
                element={<GoogleCallbackPage />}
              />
              <Route
                path="/reset-password/:uid/:token"
                element={<ResetPasswordPage />}
              />
              <Route path="/get-started" element={<GetStartedPage />} />
              <Route path="/diet-setup" element={<DietSetupPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/meal-planner" element={<MealPlannerPage />} />
                <Route path="/grocery-list" element={<GroceryListPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <ChatbotWrapper />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
