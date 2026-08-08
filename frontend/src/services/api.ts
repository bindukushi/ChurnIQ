import axios from 'axios'

// Distinguish "not set" (local dev without .env) from "explicitly empty"
// (production behind the nginx proxy, which serves the API on the same origin).
const rawApiUrl = import.meta.env.VITE_API_URL
export const API_BASE = rawApiUrl !== undefined ? rawApiUrl : 'http://localhost:8000'

export const api = axios.create({ baseURL: API_BASE })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('churn_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('churn_token')
      localStorage.removeItem('churn_user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ---------- Types ----------
export interface UserOut {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'analyst' | 'manager'
  is_active: boolean
}

export interface FeatureImpact {
  feature: string
  impact: number
}

export interface PredictionOut {
  prediction: string
  will_churn: boolean
  probability: number
  confidence: number
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical'
  top_features: FeatureImpact[]
  recommendations: string[]
  model_used: string
}

export interface DashboardKPIs {
  total_customers: number
  total_churn: number
  retention_rate: number
  monthly_revenue: number
  average_tenure: number
  average_charges: number
  prediction_accuracy: number
}

export interface CustomerInput {
  customer_code?: string
  tenure: number
  monthly_charges: number
  total_charges: number
  num_support_calls: number
  contract: 'Month-to-month' | 'One year' | 'Two year'
  internet_service: 'DSL' | 'Fiber optic' | 'No'
  tech_support: 'Yes' | 'No'
  online_security: 'Yes' | 'No'
  payment_method: 'Electronic check' | 'Mailed check' | 'Bank transfer' | 'Credit card'
  paperless_billing: 'Yes' | 'No'
  senior_citizen: '0' | '1'
  partner: 'Yes' | 'No'
  dependents: 'Yes' | 'No'
}

// ---------- Auth ----------
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  register: (payload: { full_name: string; email: string; password: string; role: string }) =>
    api.post('/api/auth/register', payload),
  me: () => api.get<UserOut>('/api/auth/me'),
}

// ---------- Prediction ----------
export const predictionApi = {
  predict: (payload: CustomerInput) => api.post<PredictionOut>('/api/predict', payload),
  history: (limit = 50) => api.get(`/api/predictions/history?limit=${limit}`),
}

// ---------- Training ----------
export const trainApi = {
  train: () => api.post('/api/train'),
  leaderboard: () => api.get('/api/train/leaderboard'),
}

// ---------- Dashboard ----------
export const dashboardApi = {
  kpis: () => api.get<DashboardKPIs>('/api/dashboard/kpis'),
  riskDistribution: () => api.get('/api/dashboard/risk-distribution'),
  churnByContract: () => api.get('/api/dashboard/churn-by-contract'),
}

// ---------- Customers ----------
export const customerApi = {
  list: (params: { search?: string; contract?: string; page?: number; page_size?: number }) =>
    api.get('/api/customers', { params }),
}

// ---------- Chat ----------
export const chatApi = {
  send: (message: string, prediction_id?: string) =>
    api.post('/api/chat', { message, prediction_id }),
}

// ---------- Reports ----------
export const reportUrl = (format: 'csv' | 'excel' | 'pdf') =>
  `${API_BASE}/api/reports/predictions/${format}`
