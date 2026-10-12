import { defineStore } from 'pinia'
import { ref } from 'vue'
import adminService, {
  type DashboardStats,
  type AdminUserSummary,
  type AdminUserDetail,
  type AdminUsersQuery,
  type AdminListingSummary,
  type AdminListingDetail,
  type AdminListingsQuery,
} from '@/services/adminService'

export const useAdminStore = defineStore('admin', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const stats = ref<DashboardStats | null>(null)
  const users = ref<AdminUserSummary[]>([])
  const currentUser = ref<AdminUserDetail | null>(null)
  const listings = ref<AdminListingSummary[]>([])
  const currentListing = ref<AdminListingDetail | null>(null)
  const pagination = ref<{
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  } | null>(null)
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref<string | null>(null)

  // ── User Actions ───────────────────────────────────────────────────────────

  async function fetchDashboard() {
    loading.value = true
    error.value = null
    try {
      stats.value = await adminService.getDashboard()
    } catch (err) {
      error.value = extractMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function fetchUsers(query: AdminUsersQuery = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await adminService.getUsers(query)
      users.value = data.users
      pagination.value = data.pagination
    } catch (err) {
      error.value = extractMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function fetchUser(id: string) {
    loading.value = true
    error.value = null
    currentUser.value = null
    try {
      currentUser.value = await adminService.getUserById(id)
    } catch (err) {
      error.value = extractMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function updateUserStatus(id: string, status: string) {
    submitting.value = true
    error.value = null
    try {
      const updated = await adminService.updateUserStatus(id, status)
      // Sync currentUser if it's the one being updated
      if (currentUser.value?.id === id) {
        currentUser.value = updated
      }
      // Sync users list
      const idx = users.value.findIndex((u) => u.id === id)
      if (idx !== -1) {
        users.value[idx] = { ...users.value[idx], status: updated.status }
      }
      return updated
    } catch (err) {
      error.value = extractMessage(err)
      throw err
    } finally {
      submitting.value = false
    }
  }

  // ── Listing Actions ────────────────────────────────────────────────────────

  async function fetchListings(query: AdminListingsQuery = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await adminService.getListings(query)
      listings.value = data.listings
      pagination.value = data.pagination
    } catch (err) {
      error.value = extractMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function fetchListing(id: string) {
    loading.value = true
    error.value = null
    currentListing.value = null
    try {
      currentListing.value = await adminService.getListingById(id)
    } catch (err) {
      error.value = extractMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function updateListingStatus(id: string, status: string) {
    submitting.value = true
    error.value = null
    try {
      const updated = await adminService.updateListingStatus(id, status)
      // Sync currentListing if it's the one being updated
      if (currentListing.value?.id === id) {
        currentListing.value = updated
      }
      // Sync listings list
      const idx = listings.value.findIndex((l) => l.id === id)
      if (idx !== -1) {
        listings.value[idx] = { ...listings.value[idx], status: updated.status }
      }
      return updated
    } catch (err) {
      error.value = extractMessage(err)
      throw err
    } finally {
      submitting.value = false
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function clearError() {
    error.value = null
  }

  function extractMessage(err: unknown): string {
    if (typeof err !== 'object' || err === null) return 'An unexpected error occurred.'
    const e = err as { response?: { data?: { message?: unknown; data?: { message?: unknown } } } }
    const nested = e.response?.data?.data ?? e.response?.data
    if (typeof nested === 'object' && nested !== null) {
      const msg = (nested as { message?: unknown }).message
      if (Array.isArray(msg)) return msg.join(', ')
      if (typeof msg === 'string') return msg
    }
    return 'An unexpected error occurred.'
  }

  return {
    stats,
    users,
    currentUser,
    listings,
    currentListing,
    pagination,
    loading,
    submitting,
    error,
    fetchDashboard,
    fetchUsers,
    fetchUser,
    updateUserStatus,
    fetchListings,
    fetchListing,
    updateListingStatus,
    clearError,
  }
})
