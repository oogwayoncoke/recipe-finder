import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import VerifyEmail from './components/auth/VerifyEmail'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import NotFoundPage from './pages/NotFoundPage'
import DiscoverPage from './pages/DiscoverPage'
import GoogleCallbackPage from './pages/GoogleCallbackPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import GetStartedPage from './pages/GetStartedPage'
import MealPlannerPage from './pages/MealPlannerPage'
import GroceryListPage from './pages/GroceryListPage'
import DietSetupPage from './pages/DietSetupPage'
import DishChatbot from './components/chat/DishChatbot'

// Show chatbot on app pages, hide on auth/onboarding
const CHATBOT_HIDE_PREFIXES = [
  '/login', '/register', '/get-started', '/diet-setup',
  '/verify-email', '/auth/', '/reset-password',
]

function ChatbotWrapper() {
  const { pathname } = useLocation()
  if (CHATBOT_HIDE_PREFIXES.some(p => pathname.startsWith(p))) return null
  return <DishChatbot />
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/"                           element={<Navigate to="/get-started" replace />} />
            <Route path="/login"                      element={<LoginPage />} />
            <Route path="/register"                   element={<RegisterPage />} />
            <Route path="/verify-email/:key"          element={<VerifyEmail />} />
            <Route path="/auth/google/callback"       element={<GoogleCallbackPage />} />
            <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />

            {/* Onboarding – public */}
            <Route path="/get-started" element={<GetStartedPage />} />
            <Route path="/diet-setup"  element={<DietSetupPage />} />

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route path="/discover"     element={<DiscoverPage />} />
              <Route path="/meal-planner" element={<MealPlannerPage />} />
              <Route path="/grocery-list" element={<GroceryListPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          {/* Floating chatbot – lives outside route switch so it persists */}
          <ChatbotWrapper />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
