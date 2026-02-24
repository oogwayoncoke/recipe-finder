import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import VerifyEmail from "./components/VerifyEmail";
import FinanceDashboard from "./pages/FinanceDashboard";
import Home from "./pages/Home";
import Induction from "./pages/Induction";
import InventoryTerminal from "./pages/Inventory";
import Invite from "./pages/Invites";
import InvoiceDetail from "./pages/InvoiceDetails";
import Login from "./pages/login";
import NotFound from "./pages/notfound";
import OstaTerminal from "./pages/OstaTermianal";
import OwnerDashboard from "./pages/OwnerDashboard";
import SabiTerminal from "./pages/SabiTerminal";
import Signup from "./pages/signup";
import SubmissionSucces from "./pages/SubmissionSuccess";
import TrackOrder from "./pages/TrackOrder";
import TreasuryConfig from "./pages/TreasuryConfig";
import ValidateToken from "./pages/ValidateToken";
import WorkOrderAssignment from "./pages/WorkOrderAssignment";
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
          path="/owner-dashboard"
          element={
            <ProtectedRoute requiredRole="OWNER">
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/osta-control"
          element={
            <ProtectedRoute requiredRole="TECH" requiredLevel="OSTA">
              <OstaTerminal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sabi-terminal"
          element={
            <ProtectedRoute requiredRole="TECH" requiredLevel="SABI">
              <SabiTerminal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/invites"
          element={
            <ProtectedRoute>
              <Invite />
            </ProtectedRoute>
          }
        />
        <Route
          path="/work-orders"
          element={
            <ProtectedRoute>
              <WorkOrderAssignment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <InventoryTerminal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/treasury"
          element={
            <ProtectedRoute requiredRole="OWNER">
              <TreasuryConfig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance"
          element={
            <ProtectedRoute requiredRole={"OWNER"}>
              <FinanceDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/Submission-Success" element={<SubmissionSucces />} />
        <Route path="/validate/:token" element={<ValidateToken />} />
        <Route path="/track/:ticketId" element={<TrackOrder />} />
        <Route path="/induction/:token" element={<Induction />} />
        <Route path="/work-order-setup/:token" element={<WorkOrderForm />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}