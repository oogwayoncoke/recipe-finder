import { Compass } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center px-4 font-serif">
      <div className="max-w-md w-full bg-[#1a1d23] border border-[#2d3139] rounded-2xl shadow-2xl p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-[#c5a059] to-transparent opacity-30" />

        <div className="mb-8 flex justify-center">
          <div className="p-4 bg-[#c5a059]/5 rounded-full border border-[#c5a059]/20 animate-pulse">
            <Compass className="w-12 h-12 text-[#c5a059] opacity-80" />
          </div>
        </div>

        <h1 className="text-7xl font-bold text-[#c5a059] mb-2 tracking-tighter italic opacity-90">
          404
        </h1>

        <h2 className="text-[#c5a059] text-xs uppercase tracking-[0.4em] mb-6 font-bold">
          Path Uncharted
        </h2>

        <p className="text-slate-400 font-sans text-sm leading-relaxed mb-8">
          The ledger contains no record of this destination. You have wandered
          beyond the borders of the estate.
        </p>

        <Link
          to="/dashboard"
          className="inline-block w-full py-3 bg-linear-to-b from-[#D4AF37] to-[#C5A059] text-[#0F1115] rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] shadow-[0_4px_0_rgb(74,68,57)] hover:translate-y-0.5 active:translate-y-1 transition-all"
        >
          Return to Workshop
        </Link>

        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-slate-600 text-[10px] uppercase tracking-widest italic">
            Shepherd Management Systems
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
