import apiService from './apiService'

// ── Types ─────────────────────────────────────────────────────────────────────

/** Full private profile — only for the authenticated user's own view */
export interface PrivateProfile {
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
}

/** Public profile — safe for viewing by any user */
export interface PublicProfile {
  id: string
  username: string
  displayName: string
  profileImage: string | null
  bio: string | null
  location: string | null
  createdAt: string
  activeListingCount: number
  completedTradeCount: number
}

export interface UpdateProfilePayload {
  displayName?: string
  username?: string
  bio?: string | null
  location?: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolve a profileImage filename to a displayable URL.
 * Reuses the same logic as listingService.mediaUrl.
 */
export function avatarUrl(filename: string | null | undefined): string | null {
  if (!filename) return null
  if (filename.startsWith('http')) return filename
  const base = (import.meta.env.VITE_API_BASE_URL as string) || '/api'
  if (base.startsWith('/')) return `/uploads/${filename}`
  const serverRoot = base.replace(/\/api\/?$/, '')
  return `${serverRoot}/uploads/${filename}`
}

/**
 * Returns the first letter of the display name as a fallback initial.
 */
export function avatarInitial(displayName: string | null | undefined): string {
  return displayName?.charAt(0)?.toUpperCase() ?? '?'
}

// ── Service ───────────────────────────────────────────────────────────────────

const userService = {
  /** GET /users/me — authenticated user's full private profile */
  async getMe(): Promise<PrivateProfile> {
    const res = await apiService.get<{ data: { user: PrivateProfile } }>('/users/me')
    return res.data.data.user
  },

  /** PATCH /users/me — update display name, username, bio, location */
  async updateMe(payload: UpdateProfilePayload): Promise<PrivateProfile> {
    const res = await apiService.patch<{ data: { user: PrivateProfile } }>('/users/me', payload)
    return res.data.data.user
  },

  /** POST /users/me/avatar — upload/replace avatar image */
  async uploadAvatar(file: File): Promise<PrivateProfile> {
    const fd = new FormData()
    fd.append('avatar', file)
    const res = await apiService.post<{ data: { user: PrivateProfile } }>('/users/me/avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data.user
  },

  /** DELETE /users/me/avatar — remove avatar */
  async removeAvatar(): Promise<PrivateProfile> {
    const res = await apiService.delete<{ data: { user: PrivateProfile } }>('/users/me/avatar')
    return res.data.data.user
  },

  /** GET /users/:username — public profile */
  async getPublicProfile(username: string): Promise<PublicProfile> {
    const res = await apiService.get<{ data: { profile: PublicProfile } }>(`/users/${username}`)
    return res.data.data.profile
  },

  avatarUrl,
  avatarInitial,
}

export default userService
