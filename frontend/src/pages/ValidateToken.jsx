import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

const ValidateToken = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const response = await api.get(`/shops/validate/${token}/`);
        const { role } = response.data;

        if (role === "TECHNICIAN") {
          navigate(`/induction/${token}`);
        } else if (role === "CUSTOMER") {
          navigate(`/work-order-setup/${token}`);
        } else {
          console.error("Unknown role detected:", role);
          alert("Invalid invitation type.");
          navigate("/login");
        }
      } catch (err) {
        console.error("Token verification failed", err);
        alert("This invitation link has expired or is invalid.");
        navigate("/login");
      }
    };
    checkToken();
  }, [token, navigate]);

  return (
    <div className="h-screen bg-[#0f1115] flex items-center justify-center">
      <p className="text-[#c5a059] font-serif animate-pulse">
        Analyzing Credentials...
      </p>
    </div>
  );
};

export default ValidateToken;
