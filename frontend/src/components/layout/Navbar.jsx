import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const initial = user?.username?.[0]?.toUpperCase() ?? "?";
  const username = user?.username ?? "guest";

  return (
    <nav className="h-14 border-b border-[#2e2e2b] flex items-center justify-between px-6 bg-[#111110] sticky top-0 z-50 flex-shrink-0">
      {/* Logo */}
      <div className="font-serif text-[1.4rem] text-[#e8e6e0] tracking-tight leading-none">
        di<span className="text-[#d4a843] italic">sh</span>
      </div>

      {/* Right — user menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 font-mono text-[0.78rem] text-[#a8a6a0] hover:text-[#e8e6e0] transition-colors tracking-wide"
        >
          <span className="w-6 h-6 rounded-full bg-[#2e2e2b] border border-[#3e3e3b] flex items-center justify-center text-[0.65rem] text-[#d4a843] font-medium">
            {initial}
          </span>
          {username}
          <span
            className={`text-[0.6rem] transition-transform duration-150 ${menuOpen ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-44 bg-[#1a1a18] border border-[#2e2e2b] rounded-md overflow-hidden shadow-xl animate-fade-up z-50">
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate("/profile");
              }}
              className="w-full text-left px-4 py-2.5 font-mono text-[0.75rem] text-[#a8a6a0] hover:bg-[#222220] hover:text-[#e8e6e0] transition-colors"
            >
              Profile
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate("/settings");
              }}
              className="w-full text-left px-4 py-2.5 font-mono text-[0.75rem] text-[#a8a6a0] hover:bg-[#222220] hover:text-[#e8e6e0] transition-colors"
            >
              Settings
            </button>
            <div className="border-t border-[#2e2e2b]" />
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 font-mono text-[0.75rem] text-[#c0574a] hover:bg-[#c0574a]/10 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
