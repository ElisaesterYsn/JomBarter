import apiService from './apiService'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ListingCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR'
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'TRADED' | 'ARCHIVED' | 'REMOVED'

export interface Category {
  id: string
  name: string
  slug: string
}

export interface ListingMedia {
  id: string
  listingId: string
  imageUrl: string | null
  videoUrl: string | null
  sortOrder: number
  createdAt: string
}

export interface Listing {
  id: string
  userId: string
  categoryId: string
  category: Category | null
  title: string
  description: string
  condition: ListingCondition
  estimatedValue: number | null
  location: string | null
  lookingFor: string | null
  status: ListingStatus
  images: ListingMedia[]
  createdAt: string
  updatedAt: string
}

export interface FeedListing extends Listing {
  user: {
    id: string
    displayName: string
    username: string
    profileImage: string | null
  }
}

export interface FeedResponse {
  listings: FeedListing[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface CreateListingPayload {
  title: string
  description: string
  categoryId: string
  condition: ListingCondition
  location?: string
  lookingFor?: string
}

export interface UpdateListingPayload {
  title?: string
  description?: string
  categoryId?: string
  condition?: ListingCondition
  location?: string
  lookingFor?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a FormData for multipart/form-data submission.
 * Text fields are appended as plain values; images[] are appended under the 'images' key.
 */
function buildFormData(fields: Record<string, string | undefined>, images: File[]): FormData {
  const fd = new FormData()
  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined && val !== '') fd.append(key, val)
  }
  for (const img of images) fd.append('images', img)
  return fd
}

// ── Service ───────────────────────────────────────────────────────────────────

const listingService = {
  // ── Categories ──────────────────────────────────────────────────────────────

  /** Fetch all active categories — public, no auth required */
  async getCategories(): Promise<Category[]> {
    const res = await apiService.get<{ data: { categories: Category[] } }>('/categories')
    return res.data.data.categories
  },

  // ── Feed ─────────────────────────────────────────────────────────────────────

  /** Browse all active listings — public, no auth required */
  async getPublicFeed(page = 1, limit = 12): Promise<FeedResponse> {
    const res = await apiService.get<{ data: FeedResponse }>(
      `/listings?page=${page}&limit=${limit}`,
    )
    return res.data.data
  },

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  /** Create a new listing (multipart/form-data, images optional) */
  async create(payload: CreateListingPayload, images: File[] = []): Promise<Listing> {
    const fd = buildFormData(
      {
        title: payload.title,
        description: payload.description,
        categoryId: payload.categoryId,
        condition: payload.condition,
        location: payload.location,
        lookingFor: payload.lookingFor,
      },
      images,
    )
    const res = await apiService.post<{ data: { listing: Listing } }>('/listings', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data.listing
  },

  /** Get all listings belonging to the authenticated user */
  async getMyListings(): Promise<Listing[]> {
    const res = await apiService.get<{ data: { listings: Listing[] } }>('/listings/my')
    return res.data.data.listings
  },

  /** Get a single listing by id */
  async getOne(id: string): Promise<Listing> {
    const res = await apiService.get<{ data: { listing: Listing } }>(`/listings/${id}`)
    return res.data.data.listing
  },

  /** Update a listing (multipart/form-data) */
  async update(id: string, payload: UpdateListingPayload, images: File[] = []): Promise<Listing> {
    const fd = buildFormData(
      {
        title: payload.title,
        description: payload.description,
        categoryId: payload.categoryId,
        condition: payload.condition,
        location: payload.location,
        lookingFor: payload.lookingFor,
      },
      images,
    )
    const res = await apiService.patch<{ data: { listing: Listing } }>(`/listings/${id}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data.listing
  },

  /** Delete a single image from a listing */
  async deleteMedia(listingId: string, mediaId: string): Promise<void> {
    await apiService.delete(`/listings/${listingId}/media/${mediaId}`)
  },

  /** Delete an entire listing */
  async remove(id: string): Promise<void> {
    await apiService.delete(`/listings/${id}`)
  },

  /** Publish a listing (DRAFT → ACTIVE) */
  async publish(id: string): Promise<Listing> {
    const res = await apiService.patch<{ data: { listing: Listing } }>(`/listings/${id}/publish`)
    return res.data.data.listing
  },

  /** Unpublish a listing (ACTIVE → DRAFT) */
  async unpublish(id: string): Promise<Listing> {
    const res = await apiService.patch<{ data: { listing: Listing } }>(`/listings/${id}/unpublish`)
    return res.data.data.listing
  },

  /** Resolve a stored filename to a full URL for display */
  mediaUrl(filename: string | null | undefined): string | null {
    if (!filename) return null
    if (filename.startsWith('http')) return filename
    const base = (import.meta.env.VITE_API_BASE_URL as string) || '/api'
    const serverRoot = base.replace(/\/api\/?$/, '')
    return `${serverRoot}/uploads/${filename}`
  },
}

export default listingService
