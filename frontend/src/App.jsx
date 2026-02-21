import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import VerifyEmail from "./components/VerifyEmail";
import Home from "./pages/Home";
import Induction from "./pages/Induction";
import Invite from "./pages/Invites";
import Login from "./pages/login";
import NotFound from "./pages/notfound";
import Signup from "./pages/signup";
import SubmissionSucces from "./pages/SubmissionSuccess";
import ValidateToken from "./pages/ValidateToken";
import WorkOrderForm from "./pages/WorkOrderForm";
function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/verify-email/:key" element={<VerifyEmail />} />
        <Route
          path="/invites"
          element={
            <ProtectedRoute>
              <Invite />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Submission-Success"
          element={<SubmissionSucces></SubmissionSucces>}
        />
        <Route path="/validate/:token" element={<ValidateToken />} />
        <Route path="/induction/:token" element={<Induction />} />
        <Route path="/work-order-setup/:token" element={<WorkOrderForm />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}