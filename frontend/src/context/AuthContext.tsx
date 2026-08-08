import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { authApi, type UserOut } from '../services/api'

interface AuthContextValue {
  user: UserOut | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (full_name: string, email: string, password: string, role: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('churn_token'))
  const [user, setUser] = useState<UserOut | null>(() => {
    const raw = localStorage.getItem('churn_user')
    return raw ? JSON.parse(raw) : null
  })

  const persist = (t: string, u: UserOut) => {
    localStorage.setItem('churn_token', t)
    localStorage.setItem('churn_user', JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    persist(res.data.access_token, res.data.user)
  }, [])

  const register = useCallback(async (full_name: string, email: string, password: string, role: string) => {
    const res = await authApi.register({ full_name, email, password, role })
    persist(res.data.access_token, res.data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('churn_token')
    localStorage.removeItem('churn_user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
