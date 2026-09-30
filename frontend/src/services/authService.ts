import apiService from './apiService'

// ── Request payloads ──────────────────────────────────────────────────────────

export interface RegisterPayload {
  email: string
  password: string
  displayName: string
}

export interface LoginPayload {
  email: string
  password: string
}

// ── Response shapes ───────────────────────────────────────────────────────────

export interface RegisteredUser {
  id: string
  email: string
  username: string
  displayName: string
  role: string
  createdAt: string
}

export interface RegisterResponse {
  message: string
  user: RegisteredUser
}

export interface LoginResponse {
  access_token: string
  user: RegisteredUser
}

// ── Service ───────────────────────────────────────────────────────────────────

const authService = {
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    // TransformInterceptor wraps the response: { data: RegisterResponse, timestamp }
    const response = await apiService.post<{ data: RegisterResponse }>('/auth/register', payload)
    return response.data.data
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await apiService.post<{ data: LoginResponse }>('/auth/login', payload)
    return response.data.data
  },
}

export default authService
