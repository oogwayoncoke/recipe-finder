import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

const Induction = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        await api.get(`/shops/validate/${token}/`);
        setTokenValid(true);
      } catch (err) {
        setError(
          err.response?.data?.detail || "Invalid or expired invite link.",
        );
        setTokenValid(false);
      } finally {
        setLoading(false);
      }
    };
    if (token) verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const payload = {
      token: token.trim(), // Killing any invisible spaces from the URL
      username: formData.username,
      password: formData.password,
    };

    // This will appear in your F12 Console.
    // Verify these match your Postman body EXACTLY.
    console.table(payload);

    try {
      // FORCE the trailing slash. Django is often silent if this is missing.
      const response = await api.post(
        "/authentication/activate-tech/",
        payload,
      );

      console.log("SUCCESS_LEDGER_SIGNED:", response.data);
      navigate("/login", {
        state: { message: "Account created! You can now log in." },
      });
    } catch (err) {
      // Log the full object to see if it's a 403 (CORS/CSRF) or 400 (Validation)
      console.error("SHEPHERD_REJECTED_HANDSHAKE:", err);
      console.log("SERVER_RESPONSE_DATA:", err.response?.data);

      const serverError = err.response?.data;
      setError(
        serverError?.token?.[0] ||
          serverError?.non_field_errors?.[0] ||
          serverError?.detail ||
          "Registration failed. Check the F12 Console now.",
      );
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center gap-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c5a059] opacity-40"></div>
        <div className="text-center">
          <h1 className="text-[#c5a059] text-xl font-serif tracking-[0.3em] uppercase mb-1">
            Shepherd
          </h1>
          <p className="text-[#c5a059] text-[10px] uppercase tracking-[0.2em] font-serif italic opacity-70">
            Validating Invitation...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0f1115] flex items-center justify-center px-4 font-serif">
      <div className="max-w-md w-full bg-[#161920] border border-white/5 p-8 rounded-xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#c5a059]/10 rounded-full mb-4 border border-[#c5a059]/20">
            <Lock className="text-[#c5a059] w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight italic">
            Staff Activation
          </h2>
          <p className="text-slate-400 mt-2 font-sans text-sm">
            Join the workshop ledger.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md mb-6 text-sm font-sans">
            {error}
          </div>
        )}

        {!tokenValid ? (
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all font-sans uppercase tracking-widest text-xs"
          >
            Return Home
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-sans uppercase tracking-widest text-slate-400 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-[#c5a059] opacity-50" />
                <input
                  type="text"
                  required
                  className="w-full bg-[#0f1115] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] outline-none transition-all font-sans"
                  placeholder="technician_name"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans uppercase tracking-widest text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-[#0f1115] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#c5a059] outline-none transition-all pr-12"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-[#c5a059] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans uppercase tracking-widest text-slate-400 mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-[#0f1115] border border-white/10 rounded-lg py-2.5 px-4 text-white focus:border-[#c5a059] outline-none transition-all"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-[#c5a059] hover:bg-[#d4b475] text-[#0f1115] font-bold rounded-sm transition-all shadow-lg shadow-[#c5a059]/10 uppercase tracking-widest text-sm"
            >
              Sign the Ledger
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Induction;
