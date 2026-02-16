import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

const VerifyEmail = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        await api.post("/authentication/user/verify-email/", { key });
        setStatus("success");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (error) {
        alert(error);
      }
    };
    confirmEmail();
  }, [key, navigate]);
  return (
    <div>
      {status === "verifying" && <h2>Verifying your email...</h2>}
      {status === "success" && <h2>Verified! Redirecting to login...</h2>}
      {status === "error" && <h2>Invalid or expired link.</h2>}
    </div>
  );
};
export default VerifyEmail;
