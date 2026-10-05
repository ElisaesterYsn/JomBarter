import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService, { type RegisterPayload, type LoginPayload } from '@/services/authService'

export interface AuthUser {
  id: string
  email: string
  username: string
  displayName: string
  profileImage: string | null
  role: string
  createdAt: string
}

export const useAuthStore = defineStore('auth', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const user = ref<AuthUser | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── Getters ────────────────────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Restore session from localStorage on app startup */
  function init() {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')
    if (storedToken && storedUser) {
      try {
        token.value = storedToken
        user.value = JSON.parse(storedUser)
      } catch {
        clearSession()
      }
    }
  }

  async function register(payload: RegisterPayload) {
    loading.value = true
    error.value = null
    try {
      const result = await authService.register(payload)
      // Registration succeeds but does not log the user in automatically.
      // The user needs to log in after registering (login endpoint is Phase 2 next step).
      return result
    } catch (err: any) {
      error.value = extractErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function login(payload: LoginPayload) {
    loading.value = true
    error.value = null
    try {
      const result = await authService.login(payload)
      token.value = result.access_token
      user.value = result.user
      localStorage.setItem('auth_token', result.access_token)
      localStorage.setItem('auth_user', JSON.stringify(result.user))
      return result
    } catch (err: any) {
      error.value = extractErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function logout() {
    clearSession()
  }

  function clearError() {
    error.value = null
  }

  /**
   * Patch selected fields on the in-memory auth user and persist to localStorage.
   * Called by profileStore after a successful profile update so the navbar avatar
   * and display name update immediately without a full re-login.
   */
  function updateUser(patch: Partial<Pick<AuthUser, 'displayName' | 'username' | 'profileImage'>>) {
    if (!user.value) return
    user.value = { ...user.value, ...patch }
    localStorage.setItem('auth_user', JSON.stringify(user.value))
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function clearSession() {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  function extractErrorMessage(err: any): string {
    // NestJS validation errors come back as { data: { message: string[] } }
    const nested = err?.response?.data?.data ?? err?.response?.data
    if (Array.isArray(nested?.message)) {
      return nested.message.join(', ')
    }
    if (typeof nested?.message === 'string') {
      return nested.message
    }
    return 'An unexpected error occurred. Please try again.'
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    init,
    register,
    login,
    logout,
    clearError,
    updateUser,
  }
})
