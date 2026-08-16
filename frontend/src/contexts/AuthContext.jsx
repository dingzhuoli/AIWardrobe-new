import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { API_BASE, apiFetch } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [configured, setConfigured] = useState(true)
  const [loading, setLoading] = useState(true)

  const checkSession = useCallback(async () => {
    try {
      const response = await apiFetch(`${API_BASE}/auth/me`)
      const data = await response.json().catch(() => ({}))
      setConfigured(data.configured !== false)
      setAdmin(response.ok && data.authenticated ? { username: data.username } : null)
    } catch {
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  useEffect(() => {
    const handleUnauthorized = () => setAdmin(null)
    window.addEventListener('aiwardrobe:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('aiwardrobe:unauthorized', handleUnauthorized)
  }, [])

  const login = useCallback(async (username, password) => {
    const response = await apiFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await response.json().catch(() => ({}))
    setConfigured(data.configured !== false && response.status !== 503)
    if (!response.ok) {
      throw new Error(data.reason || data.detail || '登录失败，请稍后重试')
    }
    setAdmin({ username: data.username })
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiFetch(`${API_BASE}/auth/logout`, { method: 'POST' })
    } finally {
      setAdmin(null)
    }
  }, [])

  const value = useMemo(() => ({
    admin,
    configured,
    loading,
    login,
    logout,
    refresh: checkSession,
  }), [admin, configured, loading, login, logout, checkSession])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
