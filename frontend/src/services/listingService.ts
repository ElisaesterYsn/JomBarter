import apiService from './apiService'

// ── Enum types ────────────────────────────────────────────────────────────────

export type ListingCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR'
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'TRADED' | 'ARCHIVED' | 'REMOVED'
export type ListingType = 'PHYSICAL_ITEM'

export type TradePreference = 'SPECIFIC_ITEM' | 'SIMILAR_VALUE' | 'OPEN_OFFERS' | 'MULTIPLE_ITEMS'

export type ExchangeMethod = 'MEETUP' | 'SELF_PICKUP' | 'DELIVERY' | 'SHIPPING' | 'ONLINE'

// ── Entity types ──────────────────────────────────────────────────────────────

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

export interface ListingOwner {
  id: string
  displayName: string
  username: string
  profileImage?: string | null
}

export interface Listing {
  id: string
  userId: string
  categoryId: string
  category: Category | null
  title: string
  description: string
  listingType: ListingType
  condition: ListingCondition
  estimatedValue: number | null
  location: string | null
  lookingFor: string | null
  /** Comma-separated TradePreference values stored in DB */
  tradePreference: string | null
  /** Comma-separated ExchangeMethod values stored in DB */
  exchangeMethod: string | null
  /** Comma-separated category ids the owner is interested in */
  interestedInCategories: string | null
  status: ListingStatus
  images: ListingMedia[]
  /** Populated on getOne() and public feed responses */
  user?: ListingOwner
  createdAt: string
  updatedAt: string
}

export interface FeedListing extends Listing {
  user: ListingOwner
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
  listingType?: ListingType
  estimatedValue?: number
  location?: string
  lookingFor?: string
  tradePreference?: string // comma-separated
  exchangeMethod?: string // comma-separated
  interestedInCategories?: string // comma-separated
}

export interface UpdateListingPayload extends Partial<CreateListingPayload> {}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse a nullable comma-separated DB string into a typed array */
export function parseCommaList<T extends string>(value: string | null | undefined): T[] {
  if (!value) return []
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean) as T[]
}

/** Serialize a typed array back to a comma-separated string for the API */
export function serializeCommaList(values: string[]): string | undefined {
  const trimmed = values.filter(Boolean)
  return trimmed.length ? trimmed.join(',') : undefined
}

function buildFormData(
  fields: Record<string, string | number | undefined>,
  images: File[],
): FormData {
  const fd = new FormData()
  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined && val !== '') fd.append(key, String(val))
  }
  for (const img of images) fd.append('images', img)
  return fd
}

// ── Service ───────────────────────────────────────────────────────────────────

const listingService = {
  // ── Categories ───────────────────────────────────────────────────────────────
  async getCategories(): Promise<Category[]> {
    const res = await apiService.get<{ data: { categories: Category[] } }>('/categories')
    return res.data.data.categories
  },

  // ── Feed ─────────────────────────────────────────────────────────────────────
  async getPublicFeed(
    page = 1,
    limit = 12,
    categoryId?: string,
    excludeId?: string,
    userId?: string,
  ): Promise<FeedResponse> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (categoryId) params.set('categoryId', categoryId)
    if (excludeId) params.set('excludeId', excludeId)
    if (userId) params.set('userId', userId)
    const res = await apiService.get<{ data: FeedResponse }>(`/listings?${params.toString()}`)
    return res.data.data
  },

  // ── CRUD ──────────────────────────────────────────────────────────────────────
  async create(payload: CreateListingPayload, images: File[] = []): Promise<Listing> {
    const fd = buildFormData(
      {
        title: payload.title,
        description: payload.description,
        categoryId: payload.categoryId,
        condition: payload.condition,
        listingType: payload.listingType,
        estimatedValue: payload.estimatedValue,
        location: payload.location,
        lookingFor: payload.lookingFor,
        tradePreference: payload.tradePreference,
        exchangeMethod: payload.exchangeMethod,
        interestedInCategories: payload.interestedInCategories,
      },
      images,
    )
    const res = await apiService.post<{ data: { listing: Listing } }>('/listings', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data.listing
  },

  async getMyListings(): Promise<Listing[]> {
    const res = await apiService.get<{ data: { listings: Listing[] } }>('/listings/my')
    return res.data.data.listings
  },

  async getOne(id: string): Promise<Listing> {
    const res = await apiService.get<{ data: { listing: Listing } }>(`/listings/${id}`)
    return res.data.data.listing
  },

  /** Fetch related listings from the same category, excluding the current one */
  async getRelatedListings(
    categoryId: string,
    excludeId: string,
    limit = 4,
  ): Promise<FeedListing[]> {
    const res = await apiService.get<{ data: FeedResponse }>(
      `/listings?categoryId=${categoryId}&excludeId=${excludeId}&limit=${limit}`,
    )
    return res.data.data.listings
  },

  async update(id: string, payload: UpdateListingPayload, images: File[] = []): Promise<Listing> {
    const fd = buildFormData(
      {
        title: payload.title,
        description: payload.description,
        categoryId: payload.categoryId,
        condition: payload.condition,
        listingType: payload.listingType,
        estimatedValue: payload.estimatedValue,
        location: payload.location,
        lookingFor: payload.lookingFor,
        tradePreference: payload.tradePreference,
        exchangeMethod: payload.exchangeMethod,
        interestedInCategories: payload.interestedInCategories,
      },
      images,
    )
    const res = await apiService.patch<{ data: { listing: Listing } }>(`/listings/${id}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data.listing
  },

  async deleteMedia(listingId: string, mediaId: string): Promise<void> {
    await apiService.delete(`/listings/${listingId}/media/${mediaId}`)
  },

  async remove(id: string): Promise<void> {
    await apiService.delete(`/listings/${id}`)
  },

  async publish(id: string): Promise<Listing> {
    const res = await apiService.patch<{ data: { listing: Listing } }>(`/listings/${id}/publish`)
    return res.data.data.listing
  },

  async unpublish(id: string): Promise<Listing> {
    const res = await apiService.patch<{ data: { listing: Listing } }>(`/listings/${id}/unpublish`)
    return res.data.data.listing
  },

  async markAsTraded(id: string): Promise<Listing> {
    const res = await apiService.patch<{ data: { listing: Listing } }>(`/listings/${id}/traded`)
    return res.data.data.listing
  },

  /** Resolve a stored filename to a full URL for display */
  mediaUrl(filename: string | null | undefined): string | null {
    if (!filename) return null
    if (filename.startsWith('http')) return filename
    const base = (import.meta.env.VITE_API_BASE_URL as string) || '/api'
    if (base.startsWith('/')) return `/uploads/${filename}`
    const serverRoot = base.replace(/\/api\/?$/, '')
    return `${serverRoot}/uploads/${filename}`
  },
}

export default listingService
