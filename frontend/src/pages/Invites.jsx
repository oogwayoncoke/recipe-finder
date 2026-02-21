import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import api from "../api";

const Invite = () => {
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("customer");
  const [techLevel, setTechLevel] = useState("SABI");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  const token = localStorage.getItem("access");
  let userRole = null;

  try {
    if (token) {
      const decoded = jwtDecode(token);
      userRole = decoded.role;
    }
  } catch (err) {
    console.error(err);
  }

  const isOwner = userRole === "OWNER";

  useEffect(() => {
    if (!isOwner) {
      setType("customer");
    }
  }, [isOwner]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert("Link secured to clipboard.");
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Link secured to clipboard (fallback).");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setInviteLink("");

    try {
      const isTech = type === "tech";
      const payload = {
        phone_number: phone,
        token_type: isTech ? "STAFF_INVITE" : "CUSTOMER_INVITE",
        role: isTech ? "TECH" : "CUSTOMER",
        tech_level: isTech ? techLevel : "NONE",
      };

      const response = await api.post("/shops/invites/", payload);

      if (response.data?.id) {
        setInviteLink(`${window.location.origin}/validate/${response.data.id}`);
      }
    } catch (error) {
      alert(
        error.response?.data?.detail ||
          "Invitation failed. Verify permissions.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen justify-center items-center bg-[#0f1115]">
      <div className="flex flex-col items-center justify-center bg-[#1a1d23] border border-[#2d3139] rounded-xl p-8 shadow-2xl w-full max-w-lg mx-auto mt-10">
        <h2 className="text-[#c5a059] text-2xl font-serif tracking-[0.3em] uppercase mb-6 text-center">
          Issue Invitation
        </h2>

        <form
          onSubmit={handleInvite}
          className="w-full max-w-sm flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <label className="text-[#c5a059] text-[10px] uppercase tracking-widest font-serif ml-1">
              Recipient Identity
            </label>
            <input
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-[#13151a] border border-[#4A4439] text-slate-100 rounded-lg p-3 outline-none focus:border-[#C5A059] transition-all placeholder:text-slate-700 font-sans"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[#c5a059] text-[10px] uppercase tracking-widest font-serif ml-1">
              Induction Level
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-[#13151a] border border-[#4A4439] text-slate-100 rounded-lg p-3 outline-none focus:border-[#C5A059] appearance-none cursor-pointer font-sans"
            >
              <option value="customer">Customer Access</option>
              {isOwner && <option value="tech">Technician Access</option>}
            </select>
          </div>

          {type === "tech" && isOwner && (
            <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-300">
              <label className="text-[#c5a059] text-[10px] uppercase tracking-widest font-serif ml-1">
                Expertise Designation
              </label>
              <select
                value={techLevel}
                onChange={(e) => setTechLevel(e.target.value)}
                className="bg-[#13151a] border border-[#4A4439] text-slate-100 rounded-lg p-3 outline-none focus:border-[#C5A059] appearance-none cursor-pointer font-sans"
                required
              >
                <option value="SABI">Sabi</option>
                <option value="OSTA">Osta</option>
                <option value="NONE">None</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-linear-to-b from-[#D4AF37] to-[#C5A059] text-[#0F1115] py-3 rounded-lg font-serif font-bold uppercase tracking-[0.2em] shadow-[0_4px_0_rgb(74,68,57)] hover:translate-y-0.5 hover:shadow-[0_2px_0_rgb(74,68,57)] active:translate-y-1 active:shadow-none transition-all mt-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Forging Token..." : "Generate Link"}
          </button>
        </form>

        {inviteLink && (
          <div className="mt-8 p-5 bg-[#13151a] border border-[#c5a059] border-dashed rounded-lg w-full animate-in fade-in slide-in-from-top-2 duration-500">
            <p className="text-[#c5a059] text-[10px] uppercase tracking-widest mb-3 italic text-center">
              Official Invitation Link
            </p>
            <div className="flex flex-col gap-3">
              <code className="text-slate-400 break-all text-[10px] bg-black/40 p-3 rounded border border-[#2d3139] text-center font-mono">
                {inviteLink}
              </code>
              <button
                type="button"
                onClick={copyToClipboard}
                className="text-[#c5a059] text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#d4af37] transition-colors cursor-pointer"
              >
                [ Copy to Clipboard ]
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invite;
