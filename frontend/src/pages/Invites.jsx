import { jwtDecode } from "jwt-decode";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Link as LinkIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api";

const Invite = () => {
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("customer");
  const [techLevel, setTechLevel] = useState("SABI");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [notification, setNotification] = useState({ text: "", type: "" });

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

  useEffect(() => {
    if (notification.text) {
      const timer = setTimeout(
        () => setNotification({ text: "", type: "" }),
        5000,
      );
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (text, type = "info") => {
    setNotification({ text, type });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      showNotification("Link secured to clipboard.", "success");
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showNotification("Link secured to clipboard (fallback).", "success");
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
        showNotification("Invitation forged successfully.", "success");
      }
    } catch (error) {
      showNotification(
        error.response?.data?.detail ||
          "Invitation failed. Verify permissions.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen justify-center items-center bg-[#0f1115] px-4 font-serif">
      {notification.text && (
        <div
          className={`fixed top-10 right-10 flex items-center gap-3 px-6 py-4 rounded-xl border animate-in slide-in-from-right-10 duration-500 z-50 ${
            notification.type === "error"
              ? "bg-red-500/10 border-red-500/50 text-red-500"
              : "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
          }`}
        >
          {notification.type === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span className="text-[12px] uppercase tracking-widest font-bold italic">
            {notification.text}
          </span>
        </div>
      )}

      <div className="flex flex-col items-center justify-center bg-[#1a1d23] border border-[#2d3139] rounded-2xl p-8 shadow-2xl w-full max-w-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-[#c5a059] to-transparent opacity-30" />

        <h2 className="text-[#c5a059] text-2xl tracking-[0.3em] uppercase mb-8 text-center">
          Issue Invitation
        </h2>

        <form
          onSubmit={handleInvite}
          className="w-full max-w-sm flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <label className="text-slate-500 text-[10px] uppercase tracking-[0.2em] ml-1">
              Recipient Identity
            </label>
            <input
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-[#13151a] border border-[#4A4439] text-slate-100 rounded-lg p-3 outline-none focus:border-[#C5A059] transition-all placeholder:text-slate-800 font-sans"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-slate-500 text-[10px] uppercase tracking-[0.2em] ml-1">
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
              <label className="text-slate-500 text-[10px] uppercase tracking-[0.2em] ml-1">
                Expertise Designation
              </label>
              <select
                value={techLevel}
                onChange={(e) => setTechLevel(e.target.value)}
                className="bg-[#13151a] border border-[#4A4439] text-slate-100 rounded-lg p-3 outline-none focus:border-[#C5A059] appearance-none cursor-pointer font-sans"
                required
              >
                <option value="SABI">Junior Tech</option>
                <option value="OSTA">Senior Tech</option>
                <option value="NONE">None</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-linear-to-b from-[#D4AF37] to-[#C5A059] text-[#0F1115] py-4 rounded-lg font-bold uppercase tracking-[0.2em] shadow-[0_4px_0_rgb(74,68,57)] hover:translate-y-0.5 hover:shadow-[0_2px_0_rgb(74,68,57)] active:translate-y-1 active:shadow-none transition-all mt-4 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Forging Token..." : "Generate Link"}
          </button>
        </form>

        {inviteLink && (
          <div className="mt-10 p-6 bg-[#13151a] border border-[#c5a059] border-dashed rounded-xl w-full animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center justify-center gap-2 mb-4">
              <LinkIcon size={14} className="text-[#c5a059]" />
              <p className="text-[#c5a059] text-[10px] uppercase tracking-widest italic text-center">
                Official Invitation Link
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <code className="text-slate-400 break-all text-[11px] bg-black/40 p-4 rounded-lg border border-[#2d3139] text-center font-mono">
                {inviteLink}
              </code>
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center justify-center gap-2 text-[#c5a059] text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#d4af37] transition-colors cursor-pointer"
              >
                <ClipboardCheck size={14} />[ Copy to Clipboard ]
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invite;