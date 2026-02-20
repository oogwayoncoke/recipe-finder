import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

function ActivateTech() {
  const { tokenId } = useParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/authentication/activate-tech/", {
        username,
        password,
        token_id: tokenId,
      });
      alert("Induction Complete. Welcome to the Estate.");
      navigate("/login");
    } catch (error) {
      const errorMsg = error.response?.data
        ? JSON.stringify(error.response.data)
        : "The invitation is invalid or has expired.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen justify-center items-center bg-[#0f1115] font-sans">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 justify-center items-center bg-[#1a1d23] h-fit w-full max-w-md rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#2d3139] p-10"
      >
        <div className="text-center">
          <h1 className="text-[#c5a059] text-4xl font-serif tracking-widest uppercase mb-2">
            Shepherd
          </h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em]">
            Technician Induction
          </p>
        </div>

        <input
          type="text"
          value={username}
          className="bg-[#13151a] border border-[#4A4439] text-slate-100 rounded-lg p-3 w-3/4 outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all placeholder:text-slate-600"
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Choose Username"
          required
        />

        <div className="flex items-center w-3/4 bg-[#13151a] border border-[#4A4439] rounded-lg transition-all focus-within:border-[#C5A059]">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="grow p-3 outline-none bg-transparent text-slate-100 placeholder:text-slate-600"
            placeholder="Set Secret Phrase"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="px-4 text-[10px] font-bold tracking-[0.2em] text-[#4A4439] hover:text-[#C5A059] transition-colors uppercase font-serif"
          >
            {showPassword ? "Conceal" : "Reveal"}
          </button>
        </div>

        <button
          className="w-1/2 h-12 mt-4 bg-linear-to-b from-[#D4AF37] to-[#C5A059] border border-[#4A4439] text-[#0F1115] rounded-lg font-serif tracking-[0.2em] uppercase text-xs font-bold transition-all shadow-[0_4px_0_rgb(74,68,57)] hover:translate-y-0.5 active:shadow-none active:translate-y-1"
          type="submit"
          disabled={loading}
        >
          {loading ? "Inducting..." : "Claim Access"}
        </button>
      </form>
    </div>
  );
}

export default ActivateTech;
