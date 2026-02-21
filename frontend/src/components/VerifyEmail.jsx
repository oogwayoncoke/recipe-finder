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
        await api.post("/authentication/verify-email/", { key });
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
    <div className="flex h-screen justify-center items-center bg-[#0f1115] font-sans">
      <div className="flex flex-col gap-8 justify-center items-center bg-[#1a1d23] h-fit w-full max-w-md rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#2d3139] p-12 text-center">
        <h1 className="text-[#c5a059] text-3xl font-serif tracking-widest uppercase mb-2">
          Shepherd
        </h1>

        {status === "verifying" && (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c5a059]"></div>
            <h2 className="text-slate-100 font-serif italic tracking-wide">
              Authenticating your credentials...
            </h2>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
            <div className="text-[#c5a059] text-6xl mb-2">✓</div>
            <h2 className="text-slate-100 text-xl font-serif tracking-wide">
              Identity Verified
            </h2>
            <p className="text-slate-500 text-sm uppercase tracking-widest">
              Redirecting to the estate login...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-red-900 text-6xl mb-2">✕</div>
            <h2 className="text-slate-100 font-serif tracking-wide">
              Invalid or Expired Link
            </h2>
            <button
              onClick={() => navigate("/signup")}
              className="text-[#c5a059] hover:underline text-sm uppercase tracking-widest italic"
            >
              Request New Invitation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default VerifyEmail;
