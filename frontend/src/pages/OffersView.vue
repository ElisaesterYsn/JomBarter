<template>
  <div class="max-w-2xl mx-auto space-y-6">

    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-surface-800">My Offers</h1>
      <p class="mt-1 text-sm text-surface-500">Manage trade offers you've received and sent</p>
    </div>

    <!-- Error banner -->
    <div v-if="offerStore.error" class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-2" role="alert">
      <svg class="w-5 h-5 shrink-0 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
      {{ offerStore.error }}
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-surface-200">
      <button
        v-for="tab in tabs" :key="tab.key" type="button"
        class="px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px"
        :class="activeTab === tab.key
          ? 'border-primary-600 text-primary-700'
          : 'border-transparent text-surface-500 hover:text-surface-800'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="tab.count" class="ml-1.5 text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full font-semibold">
          {{ tab.count }}
        </span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="offerStore.loading" class="space-y-4">
      <div v-for="n in 2" :key="n" class="card animate-pulse space-y-3">
        <div class="flex gap-3">
          <div class="w-14 h-14 bg-surface-200 rounded-lg shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-surface-200 rounded w-2/3"></div>
            <div class="h-3 bg-surface-200 rounded w-1/3"></div>
          </div>
        </div>
        <div class="h-3 bg-surface-200 rounded w-full"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="currentOffers.length === 0" class="card text-center py-12">
      <div class="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
      </div>
      <h2 class="text-base font-semibold text-surface-800 mb-1">
        {{ activeTab === 'received' ? 'No offers received yet' : 'No offers sent yet' }}
      </h2>
      <p class="text-sm text-surface-500 mb-4">
        {{ activeTab === 'received' ? 'When someone makes an offer on your listing, it will appear here.' : 'Browse listings and make an offer to get started.' }}
      </p>
      <router-link v-if="activeTab === 'sent'" to="/" class="btn-primary inline-block px-5 py-2 text-sm">Browse Listings</router-link>
    </div>

    <!-- Offer cards -->
    <div v-else class="space-y-4">
      <div v-for="offer in currentOffers" :key="offer.id" class="card space-y-4">

        <!-- Offer header: target listing -->
        <div class="flex items-start gap-3">
          <div class="w-16 h-16 bg-surface-100 rounded-xl overflow-hidden shrink-0 border border-surface-200">
            <img v-if="firstImage(offer.targetListing)" :src="firstImage(offer.targetListing)!" :alt="offer.targetListing.title" class="w-full h-full object-cover"/>
            <div v-else class="w-full h-full flex items-center justify-center text-surface-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"/></svg>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <p class="text-sm font-semibold text-surface-800 leading-snug line-clamp-2">{{ offer.targetListing.title }}</p>
              <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0" :class="statusClass(offer.status)">
                {{ statusLabel(offer.status) }}
              </span>
            </div>
            <p class="text-xs text-surface-500 mt-0.5">
              <template v-if="activeTab === 'received'">From: <span class="font-medium text-surface-700">{{ offer.sender.displayName }}</span></template>
              <template v-else>To: <span class="font-medium text-surface-700">{{ offer.receiver.displayName }}</span></template>
              · {{ relativeTime(offer.createdAt) }}
            </p>
          </div>
        </div>

        <!-- Offered item(s) -->
        <div v-if="offer.offeredItems.length" class="bg-surface-50 rounded-xl p-3">
          <p class="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">
            {{ activeTab === 'received' ? 'They are offering' : 'You offered' }}
          </p>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-surface-200 rounded-lg overflow-hidden shrink-0">
              <img v-if="firstImage(offer.offeredItems[0].listing)" :src="firstImage(offer.offeredItems[0].listing)!" :alt="offer.offeredItems[0].listing.title" class="w-full h-full object-cover"/>
              <div v-else class="w-full h-full flex items-center justify-center text-surface-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16"/></svg>
              </div>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-surface-800 truncate">{{ offer.offeredItems[0].listing.title }}</p>
              <p class="text-xs text-surface-500">{{ conditionLabel(offer.offeredItems[0].listing.condition) }}</p>
            </div>
          </div>
        </div>

        <!-- Message -->
        <div v-if="offer.message" class="text-sm text-surface-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 italic">
          "{{ offer.message }}"
        </div>

        <!-- Actions -->
        <div v-if="offer.status === 'PENDING'" class="flex gap-2 pt-1">
          <!-- Received: accept / reject -->
          <template v-if="activeTab === 'received'">
            <button type="button" class="btn-primary flex-1 text-sm py-2 disabled:opacity-60" :disabled="offerStore.submitting" @click="handleAccept(offer.id)">
              <svg v-if="offerStore.submitting" class="w-3.5 h-3.5 animate-spin inline mr-1" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              Accept
            </button>
            <button type="button" class="btn-secondary flex-1 text-sm py-2 disabled:opacity-60" :disabled="offerStore.submitting" @click="handleReject(offer.id)">Decline</button>
          </template>
          <!-- Sent: cancel -->
          <template v-else>
            <button type="button" class="btn-secondary text-sm py-2 px-4 text-red-600 hover:bg-red-50 border-red-200 disabled:opacity-60" :disabled="offerStore.submitting" @click="handleCancel(offer.id)">Cancel Offer</button>
          </template>
        </div>

        <!-- View listing link -->
        <router-link :to="`/listings/${offer.targetListing.id}`" class="text-xs text-primary-600 hover:text-primary-800 font-medium transition">
          View listing →
        </router-link>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useOfferStore } from '@/stores/offer'
import listingService from '@/services/listingService'
import type { TradeOffer, OfferListingSnap } from '@/services/offerService'

const offerStore = useOfferStore()
const activeTab = ref<'received' | 'sent'>('received')

const pendingReceivedCount = computed(() => offerStore.received.filter((o) => o.status === 'PENDING').length)
const tabs = computed(() => [
  { key: 'received' as const, label: 'Received', count: pendingReceivedCount.value },
  { key: 'sent' as const, label: 'Sent', count: 0 },
])
const currentOffers = computed(() =>
  activeTab.value === 'received' ? offerStore.received : offerStore.sent,
)

onMounted(async () => {
  await Promise.all([offerStore.fetchReceived(), offerStore.fetchSent()])
})

// ── Actions ───────────────────────────────────────────────────────────────────
async function handleAccept(id: string) { offerStore.clearError(); await offerStore.acceptOffer(id) }
async function handleReject(id: string) { offerStore.clearError(); await offerStore.rejectOffer(id) }
async function handleCancel(id: string) { offerStore.clearError(); await offerStore.cancelOffer(id) }

// ── Helpers ───────────────────────────────────────────────────────────────────
function firstImage(listing: OfferListingSnap | null | undefined): string | null {
  if (!listing?.images?.length) return null
  const m = listing.images.find((i) => i.imageUrl)
  return m ? listingService.mediaUrl(m.imageUrl) : null
}

const conditionLabels: Record<string, string> = { NEW: 'New', LIKE_NEW: 'Like New', GOOD: 'Good', FAIR: 'Fair', POOR: 'Poor' }
function conditionLabel(c: string) { return conditionLabels[c] ?? c }

function statusLabel(s: string) {
  return ({ PENDING: 'Pending', ACCEPTED: 'Accepted', REJECTED: 'Declined', CANCELLED: 'Cancelled', EXPIRED: 'Expired' } as Record<string,string>)[s] ?? s
}
function statusClass(s: string) {
  return ({
    PENDING: 'bg-amber-100 text-amber-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-surface-200 text-surface-600',
    EXPIRED: 'bg-surface-200 text-surface-500',
  } as Record<string,string>)[s] ?? 'bg-surface-100 text-surface-700'
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
</script>
