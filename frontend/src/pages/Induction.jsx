import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

const Induction = ({ role }) => {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Tech Fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Customer Fields
  const [deviceName, setDeviceName] = useState("");
  const [issue, setIssue] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Choose endpoint and data based on role
    const endpoint =
      role === "tech" ? "/api/activate-tech/" : "/api/customer-onboard/";
    const data =
      role === "tech"
        ? { username, password, token_id: tokenId }
        : {
            device_name: deviceName,
            issue_description: issue,
            token_id: tokenId,
          };

    try {
      await api.post(endpoint, data);
      alert(
        role === "tech"
          ? "Induction Complete. Welcome to the Staff."
          : "Report Logged. We will contact you soon.",
      );
      navigate(role === "tech" ? "/login" : "/success");
    } catch (err) {
      alert("Invalid or Expired Invitation.", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen justify-center items-center bg-[#0f1115]">
      <form
        onSubmit={handleSubmit}
        className="bg-[#1a1d23] border border-[#2d3139] p-10 rounded-xl w-full max-w-md shadow-2xl flex flex-col gap-6"
      >
        <div className="text-center">
          <h1 className="text-[#c5a059] text-3xl font-serif tracking-widest uppercase mb-2">
            Shepherd
          </h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest italic">
            {role === "tech" ? "Staff Induction" : "Device Registration"}
          </p>
        </div>

        {role === "tech" ? (
          <>
            <input
              type="text"
              placeholder="Assign Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-[#13151a] border border-[#4A4439] text-slate-100 rounded-lg p-3 outline-none focus:border-[#C5A059] transition-all"
              required
            />
            <input
              type="password"
              placeholder="Set Secret Phrase"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#13151a] border border-[#4A4439] text-slate-100 rounded-lg p-3 outline-none focus:border-[#C5A059] transition-all"
              required
            />
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Device Name (e.g. Gaming PC, MacBook)"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="bg-[#13151a] border border-[#4A4439] text-slate-100 rounded-lg p-3 outline-none focus:border-[#C5A059] transition-all"
              required
            />
            <textarea
              placeholder="Describe the Malfunction"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              className="bg-[#13151a] border border-[#4A4439] text-slate-100 rounded-lg p-3 outline-none focus:border-[#C5A059] transition-all h-32 resize-none"
              required
            />
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-linear-to-b from-[#D4AF37] to-[#C5A059] text-[#0F1115] font-serif font-bold py-3 rounded-lg uppercase tracking-widest hover:translate-y-[-px] transition-all active:scale-95"
        >
          {loading ? "Processing..." : "Submit to Ledger"}
        </button>
      </form>
    </div>
  );
};

export default Induction;
