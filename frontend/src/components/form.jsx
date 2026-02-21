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

  const navigate = useNavigate();
  const name = method === "login" ? "Login" : "Register";

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();

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
        alert("Signup successful! Please check your email.");
        navigate("/login");
      }
    } catch (error) {
      const errorMsg = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "flex items-center w-3/4 p-3 bg-[#13151a] border border-[#4A4439] rounded-lg transition-all focus:border-[#C5A059] outline-none font-serif text-slate-100 placeholder:text-slate-600";

  return (
    <div className="flex h-screen justify-center items-center bg-[#0f1115]">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-center items-center gap-4 bg-[#1a1d23] border border-[#2d3139] h-fit py-8 w-full max-w-md rounded-2xl shadow-2xl p-6"
      >
        <div className="text-center mb-4">
          <h1 className="text-4xl text-[#c5a059] font-serif tracking-widest uppercase mb-2">
            Shepherd
          </h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest italic">
            {name} to the estate
          </p>
        </div>

        <input
          type="text"
          value={username}
          className={inputClass}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />

        {method === "signup" && (
          <>
            <input
              type="text"
              value={shopName}
              className={inputClass}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Shop Name"
              required
            />
            <input
              type="text"
              value={fullName}
              className={inputClass}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              required
            />
            <input
              type="email"
              value={email}
              className={inputClass}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
            />
          </>
        )}

        <div className="flex items-center w-3/4 bg-[#13151a] border border-[#4A4439] rounded-lg transition-all focus-within:border-[#C5A059] font-serif">
          <input
            type={showPassword ? "text" : "password"}
            value={password1}
            onChange={(e) => setPassword1(e.target.value)}
            className="grow p-3 outline-none bg-transparent text-slate-100 placeholder:text-slate-600"
            placeholder="Secret Phrase"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="px-3 text-[10px] font-bold tracking-widest text-[#4A4439] hover:text-[#C5A059] uppercase italic font-serif"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {method === "signup" && (
          <input
            type={showPassword ? "text" : "password"}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className={inputClass}
            placeholder="Confirm Secret Phrase"
            required
          />
        )}

        <button
          className="relative w-1/2 h-12 mt-4 rounded-lg font-serif tracking-[0.2em] uppercase text-xs font-bold bg-linear-to-b from-[#D4AF37] to-[#C5A059] text-[#0F1115] shadow-[0_4px_0_rgb(74,68,57)] hover:translate-y-0.5 active:translate-y-1 disabled:opacity-50 cursor-pointer"
          type="submit"
          disabled={loading}
        >
          {loading ? "Authorizing..." : name}
        </button>

        <p className="text-sm mt-6 text-slate-500 uppercase tracking-widest text-[10px]">
          {method === "signup" ? "Member?" : "New?"}
          <Link
            to={method === "signup" ? "/login" : "/signup"}
            className="text-[#C5A059] hover:text-[#D4AF37] italic font-serif ml-2"
          >
            {method === "signup" ? "Login" : "Register"}
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Form;