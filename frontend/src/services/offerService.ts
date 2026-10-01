import apiService from './apiService'
import type { Listing, ListingMedia } from './listingService'

// ── Types ─────────────────────────────────────────────────────────────────────

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'

export interface OfferUser {
  id: string
  displayName: string
  username: string
  profileImage: string | null
}

export interface OfferListingSnap {
  id: string
  title: string
  condition: string
  listingType: string
  estimatedValue: number | null
  location: string | null
  status: string
  images: ListingMedia[]
}

export interface OfferItem {
  id: string
  tradeOfferId: string
  listingId: string
  listing: OfferListingSnap
}

export interface TradeOffer {
  id: string
  senderId: string
  receiverId: string
  targetListingId: string
  message: string | null
  status: OfferStatus
  expiresAt: string | null
  respondedAt: string | null
  createdAt: string
  sender: OfferUser
  receiver: OfferUser
  targetListing: OfferListingSnap
  offeredItems: OfferItem[]
}

export interface CreateOfferPayload {
  targetListingId: string
  offeredListingId: string
  message?: string
}

// ── Service ───────────────────────────────────────────────────────────────────

const offerService = {
  /** Send a trade offer */
  async create(payload: CreateOfferPayload): Promise<TradeOffer> {
    const res = await apiService.post<{ data: { offer: TradeOffer } }>('/trade-offers', payload)
    return res.data.data.offer
  },

  /** Offers received by the authenticated user */
  async getReceived(): Promise<TradeOffer[]> {
    const res = await apiService.get<{ data: { offers: TradeOffer[] } }>('/trade-offers/received')
    return res.data.data.offers
  },

  /** Offers sent by the authenticated user */
  async getSent(): Promise<TradeOffer[]> {
    const res = await apiService.get<{ data: { offers: TradeOffer[] } }>('/trade-offers/sent')
    return res.data.data.offers
  },

  /** Accept an offer (receiver only) */
  async accept(id: string): Promise<TradeOffer> {
    const res = await apiService.patch<{ data: { offer: TradeOffer } }>(
      `/trade-offers/${id}/accept`,
    )
    return res.data.data.offer
  },

  /** Reject an offer (receiver only) */
  async reject(id: string): Promise<TradeOffer> {
    const res = await apiService.patch<{ data: { offer: TradeOffer } }>(
      `/trade-offers/${id}/reject`,
    )
    return res.data.data.offer
  },

  /** Cancel an offer (sender only) */
  async cancel(id: string): Promise<TradeOffer> {
    const res = await apiService.patch<{ data: { offer: TradeOffer } }>(
      `/trade-offers/${id}/cancel`,
    )
    return res.data.data.offer
  },
}

export default offerService
