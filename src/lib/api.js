import axios from 'axios'

const API_BASE_URL = import.meta.env.MODE === 'production' 
  ? import.meta.env.VITE_API_BASE_URL_PROD 
  : import.meta.env.VITE_API_BASE_URL_DEV

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const authAPI = {
  signup: (userData) => api.post('/auth/signup', userData),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  login: (credentials) => api.post('/auth/login', credentials),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data)
}

export const userAPI = {
  getSubmissions: (questionId, token) => api.get(`/user/submissions/${questionId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getActivities: (token) => api.get('/user/activities', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getRank: (token) => api.get('/user/rank', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getStreak: (token) => api.get('/user/streak', {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export default api