import { defineStore } from 'pinia'
import { ref } from 'vue'
import offerService, { type TradeOffer, type CreateOfferPayload } from '@/services/offerService'

export const useOfferStore = defineStore('offer', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const received = ref<TradeOffer[]>([])
  const sent = ref<TradeOffer[]>([])
  const loadingReceived = ref(false)
  const loadingSent = ref(false)
  /** True while any list fetch is in-flight (union helper) */
  const loading = ref(false)
  /** Per-offer processing flag — keyed by offer id */
  const processingId = ref<string | null>(null)
  const submitting = ref(false)
  const error = ref<string | null>(null)

  // ── Actions ────────────────────────────────────────────────────────────────

  async function fetchReceived() {
    loadingReceived.value = true
    loading.value = true
    error.value = null
    try {
      received.value = await offerService.getReceived()
    } catch (err: any) {
      error.value = extractMessage(err)
    } finally {
      loadingReceived.value = false
      loading.value = loadingSent.value
    }
  }

  async function fetchSent() {
    loadingSent.value = true
    loading.value = true
    error.value = null
    try {
      sent.value = await offerService.getSent()
    } catch (err: any) {
      error.value = extractMessage(err)
    } finally {
      loadingSent.value = false
      loading.value = loadingReceived.value
    }
  }

  async function createOffer(payload: CreateOfferPayload): Promise<TradeOffer> {
    submitting.value = true
    error.value = null
    try {
      const offer = await offerService.create(payload)
      sent.value.unshift(offer)
      return offer
    } catch (err: any) {
      error.value = extractMessage(err)
      throw err
    } finally {
      submitting.value = false
    }
  }

  async function acceptOffer(id: string) {
    processingId.value = id
    error.value = null
    try {
      const updated = await offerService.accept(id)
      syncOffer(updated)
    } catch (err: any) {
      error.value = extractMessage(err)
      throw err
    } finally {
      processingId.value = null
    }
  }

  async function rejectOffer(id: string) {
    processingId.value = id
    error.value = null
    try {
      const updated = await offerService.reject(id)
      syncOffer(updated)
    } catch (err: any) {
      error.value = extractMessage(err)
      throw err
    } finally {
      processingId.value = null
    }
  }

  async function cancelOffer(id: string) {
    processingId.value = id
    error.value = null
    try {
      const updated = await offerService.cancel(id)
      syncOffer(updated)
    } catch (err: any) {
      error.value = extractMessage(err)
      throw err
    } finally {
      processingId.value = null
    }
  }

  function clearError() {
    error.value = null
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function syncOffer(updated: TradeOffer) {
    const ri = received.value.findIndex((o) => o.id === updated.id)
    if (ri !== -1) received.value[ri] = updated
    const si = sent.value.findIndex((o) => o.id === updated.id)
    if (si !== -1) sent.value[si] = updated
  }

  function extractMessage(err: any): string {
    const nested = err?.response?.data?.data ?? err?.response?.data
    if (Array.isArray(nested?.message)) return nested.message.join(', ')
    if (typeof nested?.message === 'string') return nested.message
    return 'An unexpected error occurred.'
  }

  return {
    received,
    sent,
    loading,
    loadingReceived,
    loadingSent,
    processingId,
    submitting,
    error,
    fetchReceived,
    fetchSent,
    createOffer,
    acceptOffer,
    rejectOffer,
    cancelOffer,
    clearError,
  }
})
