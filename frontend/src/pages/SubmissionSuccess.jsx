import { ClipboardCheck, ExternalLink, Home, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const SubmissionSuccess = () => {
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const workOrderId = location.state?.workOrderId || "ID_MISSING";

  const handleCopy = () => {
    if (workOrderId !== "ID_MISSING") {
      navigator.clipboard.writeText(workOrderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#0f1115] p-6 font-serif">
      <div className="flex flex-col items-center bg-[#1a1d23] border border-[#2d3139] rounded-xl p-10 md:p-16 shadow-2xl w-full max-w-2xl text-center text-slate-100">
        <div className="w-24 h-24 bg-[#c5a059]/10 rounded-full flex items-center justify-center mb-8 border border-[#c5a059]/20 shadow-[0_0_30px_rgba(197,160,89,0.1)]">
          <ShieldCheck className="text-[#c5a059]" size={48} />
        </div>
        <h2 className="text-[#c5a059] text-3xl font-serif tracking-[0.2em] uppercase mb-4">
          Intake Complete
        </h2>
        <p className="text-slate-400 text-sm mb-10 max-w-sm leading-relaxed">
          Use the reference below to monitor progress in real-time.
        </p>
        <div
          onClick={handleCopy}
          className="bg-[#13151a] border border-[#2d3139] hover:border-[#c5a059]/40 rounded-lg p-6 w-full mb-10 transition-all cursor-pointer group"
        >
          <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-2 font-bold">
            Tracking ID
          </p>
          <div className="flex justify-center items-center gap-3">
            <p
              className={`font-mono text-xl font-bold tracking-widest ${workOrderId === "ID_MISSING" ? "text-red-500" : "text-slate-100"}`}
            >
              {workOrderId}
            </p>
            {copied ? (
              <ClipboardCheck size={18} className="text-emerald-500" />
            ) : (
              <ExternalLink size={16} className="text-slate-600" />
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link
            to={`/track/${workOrderId}`}
            className="flex-1 flex items-center justify-center gap-2 bg-linear-to-b from-[#D4AF37] to-[#C5A059] text-[#0F1115] py-4 rounded-lg font-bold uppercase tracking-wider hover:scale-[1.02] transition-all"
          >
            Track Order
            <ExternalLink size={16} />
          </Link>
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 border border-[#4A4439] text-[#c5a059] py-4 rounded-lg font-bold uppercase tracking-wider hover:bg-[#c5a059]/5 transition-all"
          >
            <Home size={16} />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubmissionSuccess;
