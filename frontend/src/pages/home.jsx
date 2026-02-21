import { BarChart3, Clock, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-200 font-serif">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-[#0f1115]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="text-2xl font-bold tracking-[0.2em] uppercase text-[#c5a059]">
          Shepherd
          <span className="text-slate-100 font-light opacity-80 italic">
            .flow
          </span>
        </div>
        <div className="space-x-6 font-sans text-[10px] uppercase tracking-[0.2em]">
          <Link to="/login" className="hover:text-[#c5a059] transition-colors">
            Login
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 bg-[#c5a059] text-[#0f1115] rounded-sm hover:bg-[#d4b475] transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-8 pt-24 pb-32 max-w-6xl mx-auto text-center">
        <h1 className="text-6xl md:text-8xl font-medium mb-8 tracking-tight text-white leading-[1.1]">
          The new standard for <br />
          <span className="text-[#c5a059] italic">hardware repair.</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-sans opacity-80 italic">
          Precision management for the modern workshop. Track every component,
          manage every technician, and secure every transaction.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            to="/register"
            className="w-full sm:w-auto px-10 py-4 bg-[#c5a059] text-[#0f1115] font-bold text-lg hover:bg-[#d4b475] transition-all shadow-2xl shadow-[#c5a059]/10"
          >
            Establish Your Shop
          </Link>
          <button className="w-full sm:w-auto px-10 py-4 border border-white/10 hover:bg-white/5 text-lg font-medium transition-all  uppercase tracking-widest ">
            Live Demo
          </button>
        </div>
      </section>

      <section className="px-8 py-24 bg-[#161920] border-y border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-[#c5a059]/10 flex items-center justify-center rounded-lg border border-[#c5a059]/20">
              <Clock className="text-[#c5a059]" />
            </div>
            <h3 className="text-2xl font-medium text-white italic">
              Instant Onboarding
            </h3>
            <p className="text-slate-400 font-sans text-sm leading-relaxed opacity-70">
              Generate secure induction links for customers. Speed up intake
              without compromising data integrity.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-[#c5a059]/10 flex items-center justify-center rounded-lg border border-[#c5a059]/20">
              <Shield className="text-[#c5a059]" />
            </div>
            <h3 className="text-2xl font-medium text-white italic">
              Secure Tracking
            </h3>
            <p className="text-slate-400 font-sans text-sm leading-relaxed opacity-70">
              Token-based tracking allows customers to check status without an
              account. Privacy by design.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-[#c5a059]/10 flex items-center justify-center rounded-lg border border-[#c5a059]/20">
              <BarChart3 className="text-[#c5a059]" />
            </div>
            <h3 className="text-2xl font-medium text-white italic">
              The Ledger
            </h3>
            <p className="text-slate-400 font-sans text-sm leading-relaxed opacity-70">
              A bird’s-eye view of your shop’s health. Track technician
              performance and revenue in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 text-center border-t border-white/5 opacity-40">
        <div className="text-xs font-sans tracking-[0.3em] uppercase">
          © 2026 Shepherd Flow. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home;
