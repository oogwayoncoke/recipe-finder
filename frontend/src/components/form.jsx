import { Eye, EyeOff, Lock, Mail, Store, User, UserCircle } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

function Form({ route, method }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [shopName, setShopName] = useState("");
  const [fullName, setFullName] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();
  const name = method === "login" ? "Login" : "Register";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    const requestData =
      method === "signup"
        ? {
            username,
            email,
            shop_name: shopName,
            first_name: firstName,
            last_name: lastName,
            password1: password1,
            password2: password2,
          }
        : { username, password: password1 };

    try {
      const res = await api.post(route, requestData);
      if (method === "login") {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        navigate("/");
      } else {
        setSuccess("Success. The invitation has been sent to your email.");
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch (error) {
      const data = error.response?.data;
      let errorMsg = "The ledger rejected this entry.";

      if (data) {
        if (typeof data === "string") {
          errorMsg = data;
        } else {
          const firstKey = Object.keys(data)[0];
          const firstVal = data[firstKey];
          errorMsg = Array.isArray(firstVal) ? firstVal[0] : firstVal;
          if (firstKey !== "detail" && firstKey !== "non_field_errors") {
            errorMsg = `${firstKey}: ${errorMsg}`;
          }
        }
      } else {
        errorMsg = error.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const inputWrapper = "relative w-3/4";
  const iconClass = "absolute left-3 top-3 w-5 h-5 text-[#c5a059] opacity-50";
  const inputClass =
    "w-full p-3 pl-10 bg-[#13151a] border border-[#4A4439] rounded-lg transition-all focus:border-[#C5A059] outline-none font-serif text-slate-100 placeholder:text-slate-600";

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#0f1115] px-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-center items-center gap-4 bg-[#1a1d23] border border-[#2d3139] h-fit py-10 w-full max-w-md rounded-2xl shadow-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-[#c5a059] to-transparent opacity-50" />

        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-[#c5a059]/10 rounded-full mb-4 border border-[#c5a059]/20 flex items-center justify-center">
            <Lock className="text-[#c5a059] w-8 h-8" />
          </div>
          <h1 className="text-4xl text-[#c5a059] font-serif tracking-widest uppercase mb-1">
            Shepherd
          </h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] italic">
            {name} to the estate
          </p>
        </div>

        {error && (
          <div className="w-3/4 p-3 mb-2 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-500 text-[11px] font-sans uppercase tracking-wider text-center">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="w-3/4 p-3 mb-2 bg-emerald-500/10 border border-emerald-500/50 rounded-lg">
            <p className="text-emerald-500 text-[11px] font-sans uppercase tracking-wider text-center italic">
              {success}
            </p>
          </div>
        )}

        <div className={inputWrapper}>
          <User className={iconClass} />
          <input
            type="text"
            value={username}
            className={inputClass}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
        </div>

        {method === "signup" && (
          <>
            <div className={inputWrapper}>
              <Store className={iconClass} />
              <input
                type="text"
                value={shopName}
                className={inputClass}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Shop Name"
                required
              />
            </div>
            <div className={inputWrapper}>
              <UserCircle className={iconClass} />
              <input
                type="text"
                value={fullName}
                className={inputClass}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                required
              />
            </div>
            <div className={inputWrapper}>
              <Mail className={iconClass} />
              <input
                type="email"
                value={email}
                className={inputClass}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                required
              />
            </div>
          </>
        )}

        <div className={inputWrapper}>
          <Lock className={iconClass} />
          <input
            type={showPassword ? "text" : "password"}
            value={password1}
            onChange={(e) => setPassword1(e.target.value)}
            className={`${inputClass} pr-12`}
            placeholder="Secret Phrase"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-slate-500 hover:text-[#c5a059] transition-colors cursor-pointer"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        {method === "signup" && (
          <div className={inputWrapper}>
            <Lock className={iconClass} />
            <input
              type={showPassword ? "text" : "password"}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className={inputClass}
              placeholder="Confirm Secret Phrase"
              required
            />
          </div>
        )}

        <button
          className="relative w-1/2 h-12 mt-6 rounded-lg font-serif tracking-[0.2em] uppercase text-xs font-bold bg-linear-to-b from-[#D4AF37] to-[#C5A059] text-[#0F1115] shadow-[0_4px_0_rgb(74,68,57)] hover:translate-y-0.5 active:translate-y-1 disabled:opacity-50 cursor-pointer transition-all"
          type="submit"
          disabled={loading}
        >
          {loading ? "Authorizing..." : name}
        </button>

        <p className="text-sm mt-8 text-slate-500 uppercase tracking-widest text-[10px]">
          {method === "signup" ? "Member?" : "New?"}
          <Link
            to={method === "signup" ? "/login" : "/Register"}
            className="text-[#C5A059] hover:text-[#D4AF37] italic font-serif ml-2 transition-colors"
          >
            {method === "signup" ? "Login" : "Register"}
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Form;
