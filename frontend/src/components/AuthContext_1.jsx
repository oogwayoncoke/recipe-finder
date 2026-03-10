import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function decodeJWT(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

function isExpired(token) {
  const p = decodeJWT(token)
  if (!p?.exp) return true
  return Date.now() / 1000 > p.exp - 30 // 30s buffer
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)  // decoded JWT payload
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const access  = localStorage.getItem('access')
    const refresh = localStorage.getItem('refresh')

    if (!access || !refresh) { setLoading(false); return }

    if (!isExpired(access)) {
      setUser(decodeJWT(access))
      setLoading(false)
      return
    }

    silentRefresh(refresh).finally(() => setLoading(false))
  }, [])

  async function silentRefresh(refreshToken) {
    try {
      const res = await fetch(`${API}/authentication/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      _storeTokens(data.access, data.refresh ?? refreshToken)
    } catch {
      _clearTokens()
    }
  }

  async function login(username, password) {
    const res = await fetch(`${API}/authentication/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) throw data
    _storeTokens(data.access, data.refresh)
    return data
  }

  async function register(payload) {
    const res = await fetch(`${API}/authentication/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw data
    return data
  }

  function logout() { _clearTokens() }

  function _storeTokens(access, refresh) {
    localStorage.setItem('access', access)
    localStorage.setItem('refresh', refresh)
    setUser(decodeJWT(access))
  }

  function _clearTokens() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
