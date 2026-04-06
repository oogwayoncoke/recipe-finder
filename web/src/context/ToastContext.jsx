import { nanoid } from "nanoid";
import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "error", duration = 4000) => {
    const id = nanoid();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: "4.5rem",
        right: "1.25rem",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "0.625rem",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

const VARIANTS = {
  error: {
    icon: "✕",
    color: "var(--error)",
    bg: "color-mix(in srgb, var(--error) 10%, var(--bg-card))",
    border: "color-mix(in srgb, var(--error) 35%, transparent)",
  },
  success: {
    icon: "✓",
    color: "var(--success)",
    bg: "color-mix(in srgb, var(--success) 10%, var(--bg-card))",
    border: "color-mix(in srgb, var(--success) 35%, transparent)",
  },
  info: {
    icon: "◆",
    color: "var(--accent)",
    bg: "color-mix(in srgb, var(--accent) 10%, var(--bg-card))",
    border: "color-mix(in srgb, var(--accent) 35%, transparent)",
  },
};

function Toast({ toast, onDismiss }) {
  const v = VARIANTS[toast.type] ?? VARIANTS.error;
  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(1.5rem); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div
        style={{
          pointerEvents: "auto",
          display: "flex",
          alignItems: "flex-start",
          gap: "0.625rem",
          minWidth: "18rem",
          maxWidth: "22rem",
          padding: "0.75rem 1rem",
          borderRadius: "0.375rem",
          backgroundColor: v.bg,
          border: `1px solid ${v.border}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          animation: "toastIn 0.2s ease-out both",
        }}
      >
        <span
          style={{
            color: v.color,
            fontFamily: "Inter, sans-serif",
            fontSize: "0.7rem",
            fontWeight: 600,
            flexShrink: 0,
            marginTop: "0.1rem",
          }}
        >
          {v.icon}
        </span>
        <span
          style={{
            flex: 1,
            fontFamily: "Inter, sans-serif",
            fontSize: "0.8125rem",
            color: "var(--text)",
            lineHeight: 1.5,
          }}
        >
          {toast.message}
        </span>
        <button
          onClick={() => onDismiss(toast.id)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-dim)",
            fontSize: "0.75rem",
            lineHeight: 1,
            flexShrink: 0,
            padding: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-dim)")
          }
        >
          ✕
        </button>
      </div>
    </>
  );
}
