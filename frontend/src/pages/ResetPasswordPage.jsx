import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

export default function ResetPasswordPage() {
  const { uid, token } = useParams()
  const navigate       = useNavigate()

  const [password, setPassword]   = useState('')
  const [password2, setPassword2] = useState('')
  const [submitting, setSub]      = useState(false)
  const [error, setError]         = useState(null)
  const [done, setDone]           = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.'); return
    }
    if (password !== password2) {
      setError('Passwords do not match.'); return
    }

    setSub(true)
    try {
      const res = await fetch(`${API}/authentication/password-reset/confirm/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ uid, token, new_password: password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Reset failed.')
      setDone(true)
    } catch (e) {
      setError(e.message)
    } finally { setSub(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: '22rem' }}>

        {/* Logo */}
        <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: '2rem', color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '0.25rem' }}>
          di<span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>sh</span>
        </div>

        {done ? (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.5 }}>✓</div>
            <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: '1.25rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
              Password updated
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', fontWeight: 300, marginBottom: '1.5rem' }}>
              You can now log in with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                backgroundColor: 'var(--accent)', color: '#111110',
                fontFamily: '"DM Mono", monospace', fontSize: '0.8rem', fontWeight: 500,
                letterSpacing: '0.06em', padding: '0.75rem 1.5rem',
                borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
              }}
            >
              Go to login →
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: '0.1em', marginTop: '0.25rem', marginBottom: '2rem' }}>
              // choose a new password
            </p>

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <PasswordField label="new password"    id="pw1" value={password}  onChange={setPassword} />
              <PasswordField label="confirm password" id="pw2" value={password2} onChange={setPassword2} />

              {error && (
                <div style={{
                  backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)',
                  color: 'var(--error)',
                  fontFamily: '"DM Mono", monospace', fontSize: '0.72rem',
                  padding: '0.625rem 0.875rem', borderRadius: '0.375rem',
                }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={submitting} style={{
                backgroundColor: 'var(--accent)', color: '#111110',
                fontFamily: '"DM Mono", monospace', fontSize: '0.8rem', fontWeight: 500,
                letterSpacing: '0.06em', padding: '0.75rem',
                borderRadius: '0.375rem', border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.4 : 1, transition: 'opacity 0.15s',
              }}>
                {submitting ? 'updating…' : 'Set new password →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function PasswordField({ label, id, value, onChange }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label htmlFor={id} style={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete="new-password"
          style={{
            width: '100%', boxSizing: 'border-box',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: '0.375rem', padding: '0.625rem 2.5rem 0.625rem 0.875rem',
            color: 'var(--text)', fontSize: '0.875rem', fontWeight: 300,
            fontFamily: '"DM Sans", sans-serif',
            outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent-dim)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: '"DM Mono", monospace', fontSize: '0.6rem',
            color: 'var(--text-dim)', letterSpacing: '0.05em',
          }}
        >
          {show ? 'hide' : 'show'}
        </button>
      </div>
    </div>
  )
}
