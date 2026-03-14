import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// ── Background decoration circles (matches Figma login page) ─────────────────
function BackgroundDeco() {
  const circles = [
    { size: 340, top: '2%',  left: '28%', fill: true,   opacity: 0.18 },
    { size: 240, top: '8%',  left: '30%', fill: true,   opacity: 0.12 },
    { size: 280, top: '22%', left: '-6%', fill: true,   opacity: 0.14 },
    { size: 280, top: '22%', left: '-6%', fill: false,  opacity: 0.25 },
    { size: 200, top: '15%', left: '57%', fill: true,   opacity: 0.13 },
    { size: 200, top: '15%', left: '57%', fill: false,  opacity: 0.22 },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {circles.map((c, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: c.size, height: c.size, borderRadius: '50%',
          top: c.top, left: c.left,
          transform: 'translate(-50%, -50%)',
          backgroundColor: c.fill ? `rgba(180,140,50,${c.opacity})` : 'transparent',
          border: c.fill ? 'none' : `1px solid rgba(212,168,67,${c.opacity})`,
        }} />
      ))}
      {/* Right side circles */}
      <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', top: '28%', right: '-2%', backgroundColor: 'rgba(180,140,50,0.12)' }} />
      <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', top: '28%', right: '-2%', border: '1px solid rgba(212,168,67,0.2)', backgroundColor: 'transparent' }} />
    </div>
  )
}

export default function AuthForm({ initialMode = 'login' }) {
  const [mode, setMode]             = useState(initialMode)
  const [fields, setFields]         = useState({ username: '', email: '', password1: '', password2: '' })
  const [errors, setErrors]         = useState({})
  const [submitting, setSub]        = useState(false)
  const [googleLoading, setGL]      = useState(false)
  const [registered, setReg]        = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  const { login, register, loginWithTokens } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from     = location.state?.from?.pathname ?? '/discover'

  function set(key, val) {
    setFields(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: undefined, non_field_errors: undefined }))
  }

  function switchMode(m) {
    setMode(m); setErrors({})
    setFields({ username: '', email: '', password1: '', password2: '' })
    setForgotSent(false)
  }

  function parseErrors(raw) {
    if (typeof raw === 'string') return { non_field_errors: raw }
    const flat = {}
    for (const [k, v] of Object.entries(raw))
      flat[k] = Array.isArray(v) ? v[0] : String(v)
    return flat
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSub(true); setErrors({})
    try {
      if (mode === 'login') {
        await login(fields.username, fields.password1)
        navigate(from, { replace: true })
      } else {
        await register({ username: fields.username, email: fields.email, password1: fields.password1, password2: fields.password2 })
        setReg(true)
      }
    } catch (err) {
      setErrors(parseErrors(err))
    } finally { setSub(false) }
  }

  function handleGoogleClick() {
    if (!GOOGLE_CLIENT_ID) { setErrors({ non_field_errors: 'Google login is not configured.' }); return }
    sessionStorage.setItem('google_auth_from', from)
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: window.location.origin + '/auth/google/callback',
      response_type: 'token',
      scope: 'openid email profile',
      prompt: 'select_account',
    })
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }

  async function handleForgot(e) {
    e.preventDefault()
    setSub(true); setErrors({})
    try {
      const res = await fetch(`${API}/authentication/password-reset/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fields.email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong.')
      setForgotSent(true)
    } catch (e) {
      setErrors({ non_field_errors: e.message })
    } finally { setSub(false) }
  }

  // ── Post-register ─────────────────────────────────────────────────────────
  if (registered) {
    return (
      <AuthPage>
        <BackgroundDeco />
        <Card>
          <Logo />
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem', opacity: 0.5 }}>✉</div>
            <p style={{ ...TEXT.label, marginBottom: '0.75rem' }}>Check your email</p>
            <p style={{ ...TEXT.muted, marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Verification link sent to <span style={{ color: 'var(--text-muted)' }}>{fields.email}</span>.
            </p>
            <GhostBtn onClick={() => switchMode('login')}>Back to login →</GhostBtn>
          </div>
        </Card>
      </AuthPage>
    )
  }

  // ── Forgot password ───────────────────────────────────────────────────────
  if (mode === 'forgot') {
    return (
      <AuthPage>
        <BackgroundDeco />
        <Card>
          <Logo />
          <p style={{ ...TEXT.dim, marginBottom: '1.5rem' }}>// enter your email to reset</p>
          {forgotSent ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...TEXT.label, marginBottom: '0.5rem' }}>Check your email</p>
              <p style={{ ...TEXT.muted, marginBottom: '1.25rem', lineHeight: 1.6 }}>
                If an account exists for <span style={{ color: 'var(--text-muted)' }}>{fields.email}</span>, we sent a reset link.
              </p>
              <GhostBtn onClick={() => switchMode('login')}>← back to login</GhostBtn>
            </div>
          ) : (
            <form onSubmit={handleForgot} noValidate style={FORM}>
              <Field label="EMAIL" id="forgot-email" type="email" value={fields.email}
                onChange={v => set('email', v)} error={errors.email} autoComplete="email" />
              <ErrorBanner msg={errors.non_field_errors} />
              <SubmitBtn loading={submitting}>Send reset link →</SubmitBtn>
              <GhostBtn onClick={() => switchMode('login')} style={{ marginTop: '0.75rem' }}>← back to login</GhostBtn>
            </form>
          )}
        </Card>
      </AuthPage>
    )
  }

  // ── Main login / register ─────────────────────────────────────────────────
  return (
    <AuthPage>
      <BackgroundDeco />
      <Card>
        <Logo />
        <p style={{ ...TEXT.dim, marginBottom: '0' }}>// find what to cook, tonight</p>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.25rem', marginTop: '0.75rem' }}>
          {['login', 'register'].map(m => (
            <button key={m} type="button" onClick={() => switchMode(m)} style={{
              paddingBottom: '0.625rem', paddingRight: '1rem',
              fontFamily: 'Inter, sans-serif', fontSize: '0.875rem',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: mode === m ? '2px solid var(--accent)' : '2px solid transparent',
              color: mode === m ? 'var(--text)' : 'var(--text-dim)',
              marginBottom: '-1px', transition: 'color 0.15s',
            }}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* Google button */}
        <button type="button" onClick={handleGoogleClick} disabled={googleLoading} style={{
          width: '100%', height: '2.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '0.25rem', cursor: googleLoading ? 'not-allowed' : 'pointer',
          fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem',
          color: 'var(--text)', opacity: googleLoading ? 0.6 : 1,
          marginBottom: '1rem', transition: 'border-color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          {googleLoading ? <span style={TEXT.dim}>connecting…</span> : <><GoogleIcon /> Continue with Google</>}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
          <span style={{ ...TEXT.dim, fontSize: '0.625rem', letterSpacing: '0.05em' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={FORM}>
          <Field label="USERNAME" id="username" type="text" value={fields.username}
            onChange={v => set('username', v)} error={errors.username} autoComplete="username" />

          {mode === 'register' && (
            <Field label="EMAIL" id="email" type="email" value={fields.email}
              onChange={v => set('email', v)} error={errors.email} autoComplete="email" />
          )}

          <Field label="PASSWORD" id="password1" type="password" value={fields.password1}
            onChange={v => set('password1', v)} error={errors.password1}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />

          {mode === 'register' && (
            <Field label="CONFIRM PASSWORD" id="password2" type="password" value={fields.password2}
              onChange={v => set('password2', v)} error={errors.password2} autoComplete="new-password" />
          )}

          <ErrorBanner msg={errors.non_field_errors} />
          <SubmitBtn loading={submitting}>
            {submitting ? 'working…' : mode === 'login' ? 'Login →' : 'Create account →'}
          </SubmitBtn>
        </form>

        {mode === 'login' && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <GhostBtn onClick={() => switchMode('forgot')}>Forgot password?</GhostBtn>
          </div>
        )}
      </Card>
    </AuthPage>
  )
}

// ── Layout primitives ─────────────────────────────────────────────────────────
function AuthPage({ children }) {
  return (
    <div style={{
      minHeight: '100vh', backgroundColor: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', position: 'relative',
    }}>
      {children}
    </div>
  )
}

function Card({ children }) {
  return (
    <div style={{
      position: 'relative', zIndex: 1,
      width: '100%', maxWidth: '22rem',
      display: 'flex', flexDirection: 'column',
    }}>
      {children}
    </div>
  )
}

function Logo() {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '2.25rem', fontWeight: 400, marginBottom: '0.25rem' }}>
      <span style={{ color: 'var(--text)' }}>di</span>
      <span style={{ color: 'var(--accent)' }}>sh</span>
    </div>
  )
}

function Field({ label, id, type, value, onChange, error, autoComplete }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label htmlFor={id} style={{
        fontFamily: 'Inter, sans-serif', fontSize: '0.625rem',
        color: 'var(--text-dim)', letterSpacing: '0.12em',
      }}>
        {label}
      </label>
      <input id={id} type={type} value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete} spellCheck={false}
        style={{
          height: '2.25rem',
          backgroundColor: 'var(--bg-card)',
          border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
          borderRadius: '0.25rem', padding: '0 0.6875rem',
          color: 'var(--text)', fontSize: '0.8125rem',
          fontFamily: 'Inter, sans-serif', outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = error ? 'var(--error)' : 'var(--accent-dim)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--error)' : 'var(--border)'}
      />
      {error && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.625rem', color: 'var(--error)', letterSpacing: '0.04em' }}>{error}</span>}
    </div>
  )
}

function SubmitBtn({ children, loading }) {
  return (
    <button type="submit" disabled={loading} style={{
      height: '2.75rem', backgroundColor: 'var(--accent)', color: '#11110e',
      fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 500,
      letterSpacing: '0.03em', border: 'none', borderRadius: '0.25rem',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.4 : 1, transition: 'opacity 0.15s',
    }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.85' }}
      onMouseLeave={e => { if (!loading) e.currentTarget.style.opacity = '1' }}
    >{children}</button>
  )
}

function ErrorBanner({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)',
      border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)',
      color: 'var(--error)', fontFamily: 'Inter, sans-serif', fontSize: '0.72rem',
      padding: '0.5rem 0.75rem', borderRadius: '0.25rem',
    }}>{msg}</div>
  )
}

function GhostBtn({ children, onClick, style = {} }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: 'Inter, sans-serif', fontSize: '0.6875rem',
      color: 'var(--text-dim)', letterSpacing: '0.03em',
      transition: 'color 0.15s', ...style,
    }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-muted)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
    >{children}</button>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

// ── Style constants ───────────────────────────────────────────────────────────
const TEXT = {
  label:  { fontFamily: 'Inter, sans-serif', fontSize: '1rem', fontWeight: 400, color: 'var(--text)' },
  muted:  { fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: 'var(--text-muted)' },
  dim:    { fontFamily: 'Inter, sans-serif', fontSize: '0.6875rem', color: 'var(--text-dim)', letterSpacing: '0.06em' },
}
const FORM = { display: 'flex', flexDirection: 'column', gap: '1rem' }