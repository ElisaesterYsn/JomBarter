import { defineStore } from 'pinia'
import { ref } from 'vue'
import listingService, {
  type Listing,
  type CreateListingPayload,
  type UpdateListingPayload,
} from '@/services/listingService'

export const useListingStore = defineStore('listing', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const myListings = ref<Listing[]>([])
  const current = ref<Listing | null>(null)
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref<string | null>(null)

  // ── Actions ────────────────────────────────────────────────────────────────

  async function fetchMyListings() {
    loading.value = true
    error.value = null
    try {
      myListings.value = await listingService.getMyListings()
    } catch (err: any) {
      error.value = extractMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string) {
    loading.value = true
    error.value = null
    try {
      current.value = await listingService.getOne(id)
    } catch (err: any) {
      error.value = extractMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function create(payload: CreateListingPayload, images: File[] = []): Promise<Listing> {
    submitting.value = true
    error.value = null
    try {
      const listing = await listingService.create(payload, images)
      myListings.value.unshift(listing)
      return listing
    } catch (err: any) {
      error.value = extractMessage(err)
      throw err
    } finally {
      submitting.value = false
    }
  }

  async function update(
    id: string,
    payload: UpdateListingPayload,
    images: File[] = [],
  ): Promise<Listing> {
    submitting.value = true
    error.value = null
    try {
      const updated = await listingService.update(id, payload, images)
      syncListing(updated)
      return updated
    } catch (err: any) {
      error.value = extractMessage(err)
      throw err
    } finally {
      submitting.value = false
    }
  }

  async function remove(id: string) {
    submitting.value = true
    error.value = null
    try {
      await listingService.remove(id)
      myListings.value = myListings.value.filter((l) => l.id !== id)
      if (current.value?.id === id) current.value = null
    } catch (err: any) {
      error.value = extractMessage(err)
      throw err
    } finally {
      submitting.value = false
    }
  }

  async function deleteMedia(listingId: string, mediaId: string) {
    error.value = null
    try {
      await listingService.deleteMedia(listingId, mediaId)
      if (current.value?.id === listingId) {
        current.value.images = current.value.images.filter((m) => m.id !== mediaId)
      }
      const inList = myListings.value.find((l) => l.id === listingId)
      if (inList) inList.images = inList.images.filter((m) => m.id !== mediaId)
    } catch (err: any) {
      error.value = extractMessage(err)
      throw err
    }
  }

  async function publish(id: string) {
    error.value = null
    try {
      syncListing(await listingService.publish(id))
    } catch (err: any) {
      error.value = extractMessage(err)
      throw err
    }
  }

  async function unpublish(id: string) {
    error.value = null
    try {
      syncListing(await listingService.unpublish(id))
    } catch (err: any) {
      error.value = extractMessage(err)
      throw err
    }
  }

  function clearError() {
    error.value = null
  }
  function clearCurrent() {
    current.value = null
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function syncListing(updated: Listing) {
    const idx = myListings.value.findIndex((l) => l.id === updated.id)
    if (idx !== -1) myListings.value[idx] = updated
    if (current.value?.id === updated.id) current.value = updated
  }

  function extractMessage(err: any): string {
    const nested = err?.response?.data?.data ?? err?.response?.data
    if (Array.isArray(nested?.message)) return nested.message.join(', ')
    if (typeof nested?.message === 'string') return nested.message
    return 'An unexpected error occurred.'
  }

  return {
    myListings,
    current,
    loading,
    submitting,
    error,
    fetchMyListings,
    fetchOne,
    create,
    update,
    remove,
    deleteMedia,
    publish,
    unpublish,
    clearError,
    clearCurrent,
  }
})
