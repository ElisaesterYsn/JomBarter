import { defineStore } from 'pinia'
import { ref } from 'vue'
import offerService, { type TradeOffer, type CreateOfferPayload } from '@/services/offerService'

export const useOfferStore = defineStore('offer', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const received = ref<TradeOffer[]>([])
  const sent = ref<TradeOffer[]>([])
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref<string | null>(null)

  // ── Actions ────────────────────────────────────────────────────────────────

  async function fetchReceived() {
    loading.value = true
    error.value = null
    try {
      received.value = await offerService.getReceived()
    } catch (err: any) {
      error.value = extractMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function fetchSent() {
    loading.value = true
    error.value = null
    try {
      sent.value = await offerService.getSent()
    } catch (err: any) {
      error.value = extractMessage(err)
    } finally {
      loading.value = false
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
    submitting.value = true
    error.value = null
    try {
      const updated = await offerService.accept(id)
      syncOffer(updated)
    } catch (err: any) {
      error.value = extractMessage(err)
      throw err
    } finally {
      submitting.value = false
    }
  }

  async function rejectOffer(id: string) {
    submitting.value = true
    error.value = null
    try {
      const updated = await offerService.reject(id)
      syncOffer(updated)
    } catch (err: any) {
      error.value = extractMessage(err)
      throw err
    } finally {
      submitting.value = false
    }
  }

  async function cancelOffer(id: string) {
    submitting.value = true
    error.value = null
    try {
      const updated = await offerService.cancel(id)
      syncOffer(updated)
    } catch (err: any) {
      error.value = extractMessage(err)
      throw err
    } finally {
      submitting.value = false
    }
  }

  function clearError() { error.value = null }

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
    received, sent, loading, submitting, error,
    fetchReceived, fetchSent, createOffer,
    acceptOffer, rejectOffer, cancelOffer, clearError,
  }
})
