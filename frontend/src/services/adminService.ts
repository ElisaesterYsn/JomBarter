import apiService from './apiService'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  users: {
    total: number
    active: number
    suspended: number
    banned: number
  }
  listings: {
    total: number
    active: number
    draft: number
  }
  offers: {
    total: number
    pending: number
  }
  trades: {
    completed: number
  }
}

export interface AdminUserSummary {
  id: string
  email: string
  username: string
  displayName: string
  profileImage: string | null
  role: string
  status: string
  createdAt: string
  listingCount: number
  offersSentCount: number
  offersReceivedCount: number
}

export interface AdminUserDetail {
  id: string
  email: string
  username: string
  displayName: string
  profileImage: string | null
  bio: string | null
  location: string | null
  role: string
  status: string
  createdAt: string
  updatedAt: string
  listingCount: number
  activeListingCount: number
  offersSentCount: number
  offersReceivedCount: number
  completedTradeCount: number
}

export interface AdminUsersResponse {
  users: AdminUserSummary[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface AdminUsersQuery {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: string
}

// ── Listing Types ──────────────────────────────────────────────────────────────

export interface AdminListingSummary {
  id: string
  title: string
  status: string
  condition: string
  estimatedValue: number | null
  location: string | null
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    displayName: string
    username: string
    profileImage: string | null
  }
  category: {
    id: string
    name: string
    slug: string
  }
  images: Array<{
    id: string
    imageUrl: string | null
    videoUrl: string | null
  }>
}

export interface AdminListingDetail {
  id: string
  title: string
  description: string
  listingType: string
  condition: string
  status: string
  estimatedValue: number | null
  location: string | null
  lookingFor: string | null
  tradePreference: string | null
  exchangeMethod: string | null
  interestedInCategories: string | null
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    email: string
    displayName: string
    username: string
    profileImage: string | null
    status: string
  }
  category: {
    id: string
    name: string
    slug: string
  }
  images: Array<{
    id: string
    imageUrl: string | null
    videoUrl: string | null
    sortOrder: number
  }>
}

export interface AdminListingsResponse {
  listings: AdminListingSummary[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface AdminListingsQuery {
  page?: number
  limit?: number
  search?: string
  status?: string
  categoryId?: string
  condition?: string
}

// ── Service ────────────────────────────────────────────────────────────────────

const adminService = {
  async getDashboard(): Promise<DashboardStats> {
    const res = await apiService.get<{ data: { stats: DashboardStats } }>('/admin/dashboard')
    return res.data.data.stats
  },

  async getUsers(query: AdminUsersQuery = {}): Promise<AdminUsersResponse> {
    const params = new URLSearchParams()
    if (query.page) params.set('page', String(query.page))
    if (query.limit) params.set('limit', String(query.limit))
    if (query.search) params.set('search', query.search)
    if (query.role) params.set('role', query.role)
    if (query.status) params.set('status', query.status)
    const qs = params.toString()
    const res = await apiService.get<{ data: AdminUsersResponse }>(
      `/admin/users${qs ? `?${qs}` : ''}`,
    )
    return res.data.data
  },

  async getUserById(id: string): Promise<AdminUserDetail> {
    const res = await apiService.get<{ data: { user: AdminUserDetail } }>(`/admin/users/${id}`)
    return res.data.data.user
  },

  async updateUserStatus(id: string, status: string): Promise<AdminUserDetail> {
    const res = await apiService.patch<{ data: { user: AdminUserDetail } }>(
      `/admin/users/${id}/status`,
      { status },
    )
    return res.data.data.user
  },

  async getListings(query: AdminListingsQuery = {}): Promise<AdminListingsResponse> {
    const params = new URLSearchParams()
    if (query.page) params.set('page', String(query.page))
    if (query.limit) params.set('limit', String(query.limit))
    if (query.search) params.set('search', query.search)
    if (query.status) params.set('status', query.status)
    if (query.categoryId) params.set('categoryId', query.categoryId)
    if (query.condition) params.set('condition', query.condition)
    const qs = params.toString()
    const res = await apiService.get<{ data: AdminListingsResponse }>(
      `/admin/listings${qs ? `?${qs}` : ''}`,
    )
    return res.data.data
  },

  async getListingById(id: string): Promise<AdminListingDetail> {
    const res = await apiService.get<{ data: { listing: AdminListingDetail } }>(
      `/admin/listings/${id}`,
    )
    return res.data.data.listing
  },

  async updateListingStatus(id: string, status: string): Promise<AdminListingDetail> {
    const res = await apiService.patch<{ data: { listing: AdminListingDetail } }>(
      `/admin/listings/${id}/status`,
      { status },
    )
    return res.data.data.listing
  },
}

export default adminService
