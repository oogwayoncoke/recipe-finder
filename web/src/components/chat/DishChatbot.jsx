/**
 * DishChatbot
 *
 * Floating chat widget that lives at the bottom-right of every page.
 * Passes full user context (prefs, history, favourites, meal plan, current recipe)
 * to the backend on every message.
 *
 * Usage: drop <DishChatbot /> inside App.jsx once, outside the router switch.
 *        Optionally pass currentRecipe={recipeObj} from a detail page.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useChatContext } from "../../context/ChatContext.jsx";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

// ── Markdown renderer (zero deps, handles **bold**, `code`, bullet lists) ──
function renderMarkdown(text) {
  if (!text) return [];
  const lines = text.split("\n");
  const nodes = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line → spacer
    if (!line.trim()) {
      nodes.push(<div key={i} style={{ height: "0.5rem" }} />);
      i++;
      continue;
    }

    // Bullet list item
    if (line.startsWith("- ") || line.startsWith("• ")) {
      const items = [];
      while (
        i < lines.length &&
        (lines[i].startsWith("- ") || lines[i].startsWith("• "))
      ) {
        items.push(<li key={i}>{inlineFormat(lines[i].slice(2))}</li>);
        i++;
      }
      nodes.push(
        <ul
          key={`ul-${i}`}
          style={{ paddingLeft: "1.25rem", margin: "0.25rem 0" }}
        >
          {items}
        </ul>,
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(
          <li key={i}>{inlineFormat(lines[i].replace(/^\d+\.\s/, ""))}</li>,
        );
        i++;
      }
      nodes.push(
        <ol
          key={`ol-${i}`}
          style={{ paddingLeft: "1.25rem", margin: "0.25rem 0" }}
        >
          {items}
        </ol>,
      );
      continue;
    }

    // Heading
    if (line.startsWith("## ")) {
      nodes.push(
        <p
          key={i}
          style={{
            fontWeight: 600,
            color: "var(--accent)",
            fontSize: "0.8rem",
            letterSpacing: "0.06em",
            margin: "0.75rem 0 0.25rem",
            textTransform: "uppercase",
          }}
        >
          {line.slice(3)}
        </p>,
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      nodes.push(
        <p
          key={i}
          style={{
            fontWeight: 600,
            color: "var(--text)",
            fontSize: "0.8125rem",
            margin: "0.5rem 0 0.25rem",
          }}
        >
          {line.slice(4)}
        </p>,
      );
      i++;
      continue;
    }

    // Paragraph
    nodes.push(
      <p key={i} style={{ margin: "0.15rem 0", lineHeight: "1.55" }}>
        {inlineFormat(line)}
      </p>,
    );
    i++;
  }
  return nodes;
}

function inlineFormat(text) {
  // **bold**, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ color: "var(--text)", fontWeight: 600 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          style={{
            background: "rgba(212,168,67,0.12)",
            color: "var(--accent)",
            padding: "0.1em 0.35em",
            borderRadius: "3px",
            fontSize: "0.8em",
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ── Typing indicator ────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        padding: "0.5rem 0",
        alignItems: "center",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            backgroundColor: "var(--accent)",
            opacity: 0.7,
            animation: `dishDotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Suggested prompts ───────────────────────────────────────────────────────
const SUGGESTIONS = [
  "What should I cook tonight?",
  "Make a shopping list for my meal plan",
  "Suggest a high-protein breakfast",
  "What can I make with chickpeas?",
  "How do I make shakshuka?",
  "Find something quick under 20 min",
];

// ── Main component ──────────────────────────────────────────────────────────
export default function DishChatbot({ currentRecipe = null }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const { buildContext } = useChatContext();

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120);
      setUnread(0);
    }
  }, [open]);

  const sendMessage = useCallback(
    async (text) => {
      const msg = (text || input).trim();
      if (!msg || loading) return;

      setInput("");
      setError(null);

      const userMsg = { role: "user", content: msg, ts: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      const context = buildContext(currentRecipe);
      const history = messages
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const access = localStorage.getItem("access");
        const res = await fetch(`${API}/chatbot/chat/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(access ? { Authorization: `Bearer ${access}` } : {}),
          },
          body: JSON.stringify({ message: msg, history, context }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `Server error ${res.status}`);
        }

        const botMsg = {
          role: "assistant",
          content: data.reply,
          ts: Date.now(),
        };
        setMessages((prev) => [...prev, botMsg]);

        if (!open) setUnread((n) => n + 1);
      } catch (err) {
        setError(err.message || "Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, buildContext, currentRecipe, open],
  );

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* ── CSS keyframes ── */}
      <style>{`
        @keyframes dishDotPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.4); opacity: 1; }
        }
        @keyframes dishChatIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dishMsgIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dish-chat-msg { animation: dishMsgIn 0.18s ease-out both; }
        .dish-chat-fab:hover { transform: scale(1.06); }
        .dish-chat-fab { transition: transform 0.15s, box-shadow 0.15s; }
        .dish-send-btn:hover:not(:disabled) { opacity: 0.85; }
        .dish-send-btn { transition: opacity 0.15s; }
        .dish-suggestion:hover { background: rgba(212,168,67,0.1) !important; border-color: var(--accent) !important; color: var(--accent) !important; }
        .dish-suggestion { transition: all 0.15s; }
      `}</style>

      {/* ── FAB ── */}
      <button
        className="dish-chat-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open dish AI chat"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 9999,
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "var(--accent)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(212,168,67,0.35)",
        }}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M2 2l14 14M16 2L2 16"
              stroke="#11110e"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M17 3H3a1 1 0 00-1 1v10a1 1 0 001 1h3l3 3 3-3h5a1 1 0 001-1V4a1 1 0 00-1-1z"
              stroke="#11110e"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
            <path
              d="M6 8h8M6 11h5"
              stroke="#11110e"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
        {!open && unread > 0 && (
          <div
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "#c0574a",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unread}
          </div>
        )}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "5.5rem",
            right: "1.5rem",
            zIndex: 9998,
            width: "380px",
            maxWidth: "calc(100vw - 3rem)",
            height: "560px",
            maxHeight: "calc(100vh - 8rem)",
            backgroundColor: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
            overflow: "hidden",
            animation: "dishChatIn 0.22s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "0.875rem 1rem",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              flexShrink: 0,
              backgroundColor: "var(--bg-card)",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(212,168,67,0.15)",
                border: "1px solid rgba(212,168,67,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 2a1 1 0 000 2 5 5 0 110 10A5 5 0 018 4a1 1 0 000-2z"
                  fill="none"
                />
                <circle
                  cx="8"
                  cy="9"
                  r="4.5"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 6.5v3l2 1.5"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                dish <span style={{ color: "var(--accent)" }}>AI</span>
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-dim)",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                culinary assistant · context-aware
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => {
                  setMessages([]);
                  setError(null);
                }}
                title="Clear chat"
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-dim)",
                  padding: "0.25rem",
                  fontSize: "0.7rem",
                  fontFamily: "Inter, sans-serif",
                  letterSpacing: "0.04em",
                }}
              >
                clear
              </button>
            )}
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0.875rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {/* Empty state + suggestions */}
            {isEmpty && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.625rem",
                }}
              >
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.8rem",
                    color: "var(--text-dim)",
                    textAlign: "center",
                    padding: "0.5rem 0 0.75rem",
                  }}
                >
                  What can I help you cook?
                </p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="dish-suggestion"
                    onClick={() => sendMessage(s)}
                    style={{
                      textAlign: "left",
                      padding: "0.5rem 0.75rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className="dish-chat-msg"
                style={{
                  display: "flex",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  gap: "0.5rem",
                  alignItems: "flex-start",
                }}
              >
                {/* Avatar */}
                {msg.role === "assistant" && (
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "rgba(212,168,67,0.15)",
                      border: "1px solid rgba(212,168,67,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "0.1rem",
                      fontSize: "10px",
                      color: "var(--accent)",
                    }}
                  >
                    AI
                  </div>
                )}

                {/* Bubble */}
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "0.625rem 0.875rem",
                    borderRadius:
                      msg.role === "user"
                        ? "12px 12px 4px 12px"
                        : "12px 12px 12px 4px",
                    backgroundColor:
                      msg.role === "user"
                        ? "rgba(212,168,67,0.12)"
                        : "var(--bg-card)",
                    border: `1px solid ${msg.role === "user" ? "rgba(212,168,67,0.25)" : "var(--border)"}`,
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.8125rem",
                    color: "var(--text)",
                    lineHeight: "1.5",
                  }}
                >
                  {msg.role === "user" ? (
                    <p style={{ margin: 0 }}>{msg.content}</p>
                  ) : (
                    renderMarkdown(msg.content)
                  )}
                </div>
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div
                className="dish-chat-msg"
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "rgba(212,168,67,0.15)",
                    border: "1px solid rgba(212,168,67,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "10px",
                    color: "var(--accent)",
                  }}
                >
                  AI
                </div>
                <div
                  style={{
                    padding: "0.5rem 0.875rem",
                    borderRadius: "12px 12px 12px 4px",
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <TypingDots />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  background: "rgba(192,87,74,0.1)",
                  border: "1px solid rgba(192,87,74,0.3)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.75rem",
                  color: "#c0574a",
                }}
              >
                ⚠ {error}
                <button
                  onClick={() => setError(null)}
                  style={{
                    marginLeft: "0.5rem",
                    background: "none",
                    border: "none",
                    color: "#c0574a",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                  }}
                >
                  dismiss
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "0.75rem",
              borderTop: "1px solid var(--border)",
              backgroundColor: "var(--bg-card)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "flex-end",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "0.5rem 0.625rem",
                transition: "border-color 0.15s",
              }}
              onFocus={() => {}}
              onClick={() => inputRef.current?.focus()}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask anything about cooking…"
                rows={1}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  overflowY: "hidden",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.8125rem",
                  color: "var(--text)",
                  lineHeight: "1.5",
                  minHeight: "1.5rem",
                  maxHeight: "6rem",
                  caretColor: "var(--accent)",
                }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
              />
              <button
                className="dish-send-btn"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "6px",
                  background:
                    input.trim() && !loading
                      ? "var(--accent)"
                      : "var(--bg-hover)",
                  border: "none",
                  cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M12 7L2 2l2.5 5L2 12l10-5z"
                    fill={
                      input.trim() && !loading ? "#11110e" : "var(--text-dim)"
                    }
                  />
                </svg>
              </button>
            </div>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.65rem",
                color: "var(--text-dim)",
                textAlign: "center",
                marginTop: "0.375rem",
                marginBottom: 0,
              }}
            >
              dish AI · reads your prefs, history & current page
            </p>
          </div>
        </div>
      )}
    </>
  );
}
