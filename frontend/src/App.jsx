import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import VerifyEmail from "./components/VerifyEmail";
import Home from "./pages/home";
import Login from "./pages/login";
import NotFound from "./pages/notfound";
import Signup from "./pages/signup";

function Logout() {
  localStorage.clear();
  return <Navigate to="/login/" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Signup />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home></Home>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login></Login>} />
        <Route path="/logout" element={<Logout></Logout>} />
        <Route path="/signup" element={<Signup></Signup>} />
        <Route path="/verify-email/:key" element={<VerifyEmail />} />
        <Route path="/*" element={<NotFound></NotFound>} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
