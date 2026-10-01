<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Page header -->
    <div>
      <h1 class="text-2xl font-bold text-surface-800">My Offers</h1>
      <p class="mt-1 text-sm text-surface-500">Track trade offers you've sent and received</p>
    </div>

    <!-- Error banner -->
    <div
      v-if="offerStore.error"
      class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-2"
      role="alert"
    >
      <svg
        class="w-5 h-5 shrink-0 mt-0.5 text-red-500"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      {{ offerStore.error }}
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-surface-200">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="px-5 py-3 text-sm font-medium transition border-b-2 -mb-px"
        :class="
          activeTab === tab.key
            ? 'border-primary-600 text-primary-700'
            : 'border-transparent text-surface-500 hover:text-surface-800'
        "
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span
          v-if="tab.count > 0"
          class="ml-1.5 text-[11px] bg-primary-600 text-white px-1.5 py-0.5 rounded-full font-bold"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>

    <!-- Loading skeletons -->
    <div v-if="activeLoading" class="space-y-4">
      <div v-for="n in 2" :key="n" class="card animate-pulse space-y-4">
        <!-- Trade visual skeleton -->
        <div class="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <div class="space-y-2">
            <div class="aspect-[4/3] bg-surface-200 rounded-xl"></div>
            <div class="h-3 bg-surface-200 rounded w-3/4"></div>
          </div>
          <div class="w-8 h-8 bg-surface-200 rounded-full"></div>
          <div class="space-y-2">
            <div class="aspect-[4/3] bg-surface-200 rounded-xl"></div>
            <div class="h-3 bg-surface-200 rounded w-3/4"></div>
          </div>
        </div>
        <div class="h-8 bg-surface-200 rounded-full w-24 mx-auto"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="currentOffers.length === 0" class="card text-center py-14">
      <div
        class="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <svg
          class="w-7 h-7 text-primary-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      </div>
      <h2 class="text-base font-semibold text-surface-800 mb-1">
        {{ activeTab === 'received' ? 'No offers received yet' : 'No offers sent yet' }}
      </h2>
      <p class="text-sm text-surface-500 mb-5">
        {{
          activeTab === 'received'
            ? 'When someone makes an offer on your listing, it will appear here.'
            : 'Offers you send will appear here.'
        }}
      </p>
      <router-link
        v-if="activeTab === 'sent'"
        to="/"
        class="btn-primary inline-block px-5 py-2 text-sm"
      >
        Browse Listings
      </router-link>
    </div>

    <!-- Offer cards -->
    <div v-else class="space-y-5">
      <article v-for="offer in currentOffers" :key="offer.id" class="card !p-0 overflow-hidden">
        <!-- ── Card header: status + meta ── -->
        <div
          class="px-4 pt-4 pb-3 flex items-center justify-between gap-2 border-b border-surface-100"
        >
          <div class="flex items-center gap-2 min-w-0">
            <!-- Avatar -->
            <div
              class="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0"
              aria-hidden="true"
            >
              {{ (activeTab === 'received' ? offer.sender : offer.receiver).displayName.charAt(0) }}
            </div>
            <span class="text-xs text-surface-600 truncate">
              <span class="font-medium text-surface-800">
                {{ (activeTab === 'received' ? offer.sender : offer.receiver).displayName }}
              </span>
              <span class="text-surface-400"> · {{ relativeTime(offer.createdAt) }} </span>
            </span>
          </div>
          <!-- Status badge -->
          <span
            class="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
            :class="statusClass(offer.status)"
          >
            {{ statusLabel(offer.status) }}
          </span>
        </div>

        <!-- ── Trade visual: YOU OFFER ⇄ FOR ── -->
        <div class="px-4 py-4">
          <div class="grid grid-cols-[1fr_32px_1fr] gap-2 items-start">
            <!-- Left side: what is offered (the sender's item) -->
            <div class="space-y-2">
              <p
                class="text-[10px] font-bold text-surface-400 uppercase tracking-widest text-center"
              >
                {{ activeTab === 'received' ? 'They Offer' : 'You Offer' }}
              </p>
              <div
                class="rounded-xl overflow-hidden bg-surface-100 border border-surface-200"
                style="aspect-ratio: 4/3"
              >
                <img
                  v-if="offeredImage(offer)"
                  :src="offeredImage(offer)!"
                  :alt="offeredTitle(offer)"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-surface-300">
                  <svg
                    class="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div class="text-center space-y-0.5">
                <p class="text-xs font-semibold text-surface-800 line-clamp-2 leading-snug">
                  {{ offeredTitle(offer) }}
                </p>
                <p class="text-[11px] text-surface-500">
                  {{ conditionLabel(offeredCondition(offer)) }}
                  <template v-if="offeredValue(offer)">
                    ·
                    <span class="text-amber-700 font-medium"
                      >RM {{ offeredValue(offer)!.toLocaleString() }}</span
                    >
                  </template>
                </p>
              </div>
            </div>

            <!-- Exchange icon -->
            <div class="flex items-center justify-center pt-8">
              <div
                class="w-8 h-8 rounded-full bg-surface-100 border border-surface-200 flex items-center justify-center text-surface-500"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
            </div>

            <!-- Right side: target listing (what the sender wants) -->
            <div class="space-y-2">
              <p
                class="text-[10px] font-bold text-surface-400 uppercase tracking-widest text-center"
              >
                {{ activeTab === 'received' ? 'They Want' : 'In Exchange For' }}
              </p>
              <div
                class="rounded-xl overflow-hidden bg-surface-100 border border-surface-200"
                style="aspect-ratio: 4/3"
              >
                <img
                  v-if="targetImage(offer)"
                  :src="targetImage(offer)!"
                  :alt="offer.targetListing.title"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-surface-300">
                  <svg
                    class="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div class="text-center space-y-0.5">
                <p class="text-xs font-semibold text-surface-800 line-clamp-2 leading-snug">
                  {{ offer.targetListing.title }}
                </p>
                <p class="text-[11px] text-surface-500">
                  {{ conditionLabel(offer.targetListing.condition) }}
                  <template v-if="offer.targetListing.estimatedValue">
                    ·
                    <span class="text-amber-700 font-medium"
                      >RM {{ offer.targetListing.estimatedValue.toLocaleString() }}</span
                    >
                  </template>
                </p>
              </div>
            </div>
          </div>

          <!-- Message -->
          <div
            v-if="offer.message"
            class="mt-4 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5"
          >
            <p class="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Message</p>
            <p class="text-sm text-surface-700 italic leading-relaxed">"{{ offer.message }}"</p>
          </div>
        </div>

        <!-- ── Actions ── -->
        <div class="px-4 pb-4 flex flex-wrap items-center gap-2 border-t border-surface-100 pt-3">
          <!-- View listing link always available -->
          <router-link
            :to="`/listings/${offer.targetListing.id}`"
            class="text-xs font-medium text-primary-600 hover:text-primary-800 transition border border-primary-200 rounded-lg px-3 py-1.5 hover:bg-primary-50"
          >
            View Listing
          </router-link>

          <!-- RECEIVED + PENDING: Accept & Decline -->
          <template v-if="activeTab === 'received' && offer.status === 'PENDING'">
            <button
              type="button"
              class="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-60"
              :disabled="offerStore.processingId === offer.id"
              @click="handleAccept(offer.id)"
            >
              <svg
                v-if="offerStore.processingId === offer.id"
                class="w-3.5 h-3.5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <svg
                v-else
                class="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              {{ offerStore.processingId === offer.id ? 'Accepting…' : 'Accept' }}
            </button>
            <button
              type="button"
              class="text-xs font-medium px-4 py-1.5 rounded-lg border border-surface-300 text-surface-700 hover:bg-surface-100 transition disabled:opacity-60"
              :disabled="offerStore.processingId === offer.id"
              @click="handleReject(offer.id)"
            >
              Decline
            </button>
          </template>

          <!-- SENT + PENDING: Cancel -->
          <template v-if="activeTab === 'sent' && offer.status === 'PENDING'">
            <button
              type="button"
              class="text-xs font-medium px-4 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-60"
              :disabled="offerStore.processingId === offer.id"
              @click="handleCancel(offer.id)"
            >
              <svg
                v-if="offerStore.processingId === offer.id"
                class="w-3.5 h-3.5 animate-spin inline mr-1"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {{ offerStore.processingId === offer.id ? 'Cancelling…' : 'Cancel Offer' }}
            </button>
          </template>

          <!-- ACCEPTED: note (trade completion phase) -->
          <template v-if="offer.status === 'ACCEPTED'">
            <span
              class="text-xs text-green-700 font-medium bg-green-50 border border-green-200 rounded-lg px-3 py-1.5"
            >
              ✓ Accepted — arrange your exchange!
            </span>
          </template>
        </div>
      </article>
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

// Pending count only on received tab
const pendingReceivedCount = computed(
  () => offerStore.received.filter((o) => o.status === 'PENDING').length,
)

const tabs = computed(() => [
  { key: 'received' as const, label: 'Received', count: pendingReceivedCount.value },
  { key: 'sent' as const, label: 'Sent', count: 0 },
])

const currentOffers = computed(() =>
  activeTab.value === 'received' ? offerStore.received : offerStore.sent,
)

const activeLoading = computed(() =>
  activeTab.value === 'received' ? offerStore.loadingReceived : offerStore.loadingSent,
)

onMounted(async () => {
  await Promise.all([offerStore.fetchReceived(), offerStore.fetchSent()])
})

// ── Actions (per-offer processing via processingId) ───────────────────────────
async function handleAccept(id: string) {
  offerStore.clearError()
  await offerStore.acceptOffer(id)
}

async function handleReject(id: string) {
  offerStore.clearError()
  await offerStore.rejectOffer(id)
}

async function handleCancel(id: string) {
  offerStore.clearError()
  await offerStore.cancelOffer(id)
}

// ── Trade visual helpers ──────────────────────────────────────────────────────

function offeredItem(offer: TradeOffer): OfferListingSnap | null {
  return offer.offeredItems[0]?.listing ?? null
}

function offeredImage(offer: TradeOffer): string | null {
  const item = offeredItem(offer)
  if (!item?.images?.length) return null
  const m = item.images.find((i) => i.imageUrl)
  return m ? listingService.mediaUrl(m.imageUrl) : null
}

function offeredTitle(offer: TradeOffer): string {
  return offeredItem(offer)?.title ?? 'Unknown item'
}

function offeredCondition(offer: TradeOffer): string {
  return offeredItem(offer)?.condition ?? ''
}

function offeredValue(offer: TradeOffer): number | null {
  return offeredItem(offer)?.estimatedValue ?? null
}

function targetImage(offer: TradeOffer): string | null {
  if (!offer.targetListing?.images?.length) return null
  const m = offer.targetListing.images.find((i) => i.imageUrl)
  return m ? listingService.mediaUrl(m.imageUrl) : null
}

// ── Labels ────────────────────────────────────────────────────────────────────
const conditionLabels: Record<string, string> = {
  NEW: 'New',
  LIKE_NEW: 'Like New',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
}
function conditionLabel(c: string) {
  return conditionLabels[c] ?? c
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    REJECTED: 'Declined',
    CANCELLED: 'Cancelled',
    EXPIRED: 'Expired',
  }
  return map[s] ?? s
}

function statusClass(s: string) {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-surface-200 text-surface-600',
    EXPIRED: 'bg-surface-200 text-surface-500',
  }
  return map[s] ?? 'bg-surface-100 text-surface-700'
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
</script>
