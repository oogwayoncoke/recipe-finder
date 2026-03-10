import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  FAILED: "failed",
};

export default function VerifyEmail() {
  const { key } = useParams(); // route: /verify-email/:key
  const navigate = useNavigate();
  const [status, setStatus] = useState(STATUS.LOADING);

  useEffect(() => {
    if (!key) {
      setStatus(STATUS.FAILED);
      return;
    }

    fetch(`${API}/authentication/verify-email/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || data.error) {
          setStatus(STATUS.FAILED);
          return;
        }
        setStatus(STATUS.SUCCESS);
      })
      .catch(() => setStatus(STATUS.FAILED));
  }, [key]);

  return (
    <div className="min-h-screen bg-[#111110] flex items-center justify-center p-8">
      <div className="w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="font-serif text-[2rem] text-[#e8e6e0] tracking-tight leading-none mb-8">
          di<span className="text-[#d4a843] italic">sh</span>
        </div>

        <div className="bg-[#1a1a18] border border-[#2e2e2b] rounded-md p-8 text-center">
          {status === STATUS.LOADING && (
            <>
              <Spinner />
              <h2 className="font-serif text-lg text-[#e8e6e0] mb-2">
                Verifying your email
              </h2>
              <p className="font-mono text-xs text-[#6b6b67] tracking-wide">
                hang on a second...
              </p>
            </>
          )}

          {status === STATUS.SUCCESS && (
            <>
              <div className="w-10 h-10 rounded-full bg-[#5a8a5a]/15 border border-[#5a8a5a]/40 flex items-center justify-center mx-auto mb-4">
                <span className="text-[#5a8a5a] text-sm font-mono">✓</span>
              </div>
              <h2 className="font-serif text-xl text-[#e8e6e0] mb-2">
                You're verified
              </h2>
              <p className="text-sm text-[#6b6b67] font-light leading-relaxed mb-6">
                Your account is active. You can log in now.
              </p>
              <button
                onClick={() => navigate("/login", { replace: true })}
                className="bg-[#d4a843] text-[#111110] font-mono text-[0.78rem] font-medium tracking-wider px-5 py-2.5 rounded-md hover:opacity-85 transition-opacity"
              >
                Go to login →
              </button>
            </>
          )}

          {status === STATUS.FAILED && (
            <>
              <div className="w-10 h-10 rounded-full bg-[#c0574a]/15 border border-[#c0574a]/40 flex items-center justify-center mx-auto mb-4">
                <span className="text-[#c0574a] text-sm font-mono">✕</span>
              </div>
              <h2 className="font-serif text-xl text-[#e8e6e0] mb-2">
                Link invalid or expired
              </h2>
              <p className="text-sm text-[#6b6b67] font-light leading-relaxed mb-6">
                This verification link has expired or already been used. Try
                registering again.
              </p>
              <button
                onClick={() => navigate("/login", { replace: true })}
                className="font-mono text-xs text-[#6b6b67] hover:text-[#a8a6a0] transition-colors tracking-wide"
              >
                Back to login →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center mb-4">
      <div className="w-8 h-8 border border-[#2e2e2b] border-t-[#d4a843] rounded-full animate-spin" />
    </div>
  );
}
