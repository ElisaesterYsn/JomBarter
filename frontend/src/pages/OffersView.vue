<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useOfferStore } from '@/stores/offer'
import listingService from '@/services/listingService'
import type { TradeOffer, OfferListingSnap, OfferUser } from '@/services/offerService'

const offerStore = useOfferStore()
const activeTab = ref<'received' | 'sent'>('received')

// ── Tabs ──────────────────────────────────────────────────────────────────────
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

// ── Confirmation dialog ───────────────────────────────────────────────────────

type ActionKey = 'accept' | 'decline' | 'withdraw' | 'complete'

const confirmTarget = ref<{ action: ActionKey; offerId: string } | null>(null)

const confirmConfig: Record<
  ActionKey,
  { title: string; body: string; confirmLabel: string; btnClass: string }
> = {
  accept: {
    title: 'Accept this offer?',
    body: 'You are agreeing to exchange your listing for the offered item. All other pending offers for this listing will be declined.',
    confirmLabel: 'Yes, accept',
    btnClass: 'bg-primary-600 hover:bg-primary-700',
  },
  decline: {
    title: 'Decline this offer?',
    body: 'The sender will be notified that their offer was declined.',
    confirmLabel: 'Yes, decline',
    btnClass: 'bg-red-600 hover:bg-red-700',
  },
  withdraw: {
    title: 'Withdraw this offer?',
    body: 'Your offer will be withdrawn. The listing owner will no longer be able to accept it.',
    confirmLabel: 'Yes, withdraw',
    btnClass: 'bg-red-600 hover:bg-red-700',
  },
  complete: {
    title: 'Mark trade as completed?',
    body: 'This confirms that the physical exchange has happened. The listing will be marked as Traded and removed from the marketplace.',
    confirmLabel: 'Yes, mark completed',
    btnClass: 'bg-green-600 hover:bg-green-700',
  },
}

function requestAction(action: ActionKey, offer: TradeOffer) {
  offerStore.clearError()
  confirmTarget.value = { action, offerId: offer.id }
}

async function executeAction() {
  if (!confirmTarget.value) return
  const { action, offerId } = confirmTarget.value
  confirmTarget.value = null // close modal immediately
  try {
    if (action === 'accept') await offerStore.acceptOffer(offerId)
    if (action === 'decline') await offerStore.declineOffer(offerId)
    if (action === 'withdraw') await offerStore.withdrawOffer(offerId)
    if (action === 'complete') await offerStore.completeOffer(offerId)
  } catch {
    // error surfaced via offerStore.error banner
  }
}

// ── Trade visual helpers ──────────────────────────────────────────────────────

function counterpart(offer: TradeOffer): OfferUser {
  return activeTab.value === 'received' ? offer.sender : offer.receiver
}

function offeredItem(offer: TradeOffer): OfferListingSnap | null {
  return offer.offeredItems[0]?.listing ?? null
}
function offeredImage(offer: TradeOffer): string | null {
  const item = offeredItem(offer)
  if (!item?.images?.length) return null
  const m = item.images.find((i) => i.imageUrl)
  return m ? listingService.mediaUrl(m.imageUrl) : null
}
function offeredTitle(offer: TradeOffer) {
  return offeredItem(offer)?.title ?? 'Unknown item'
}
function offeredCondition(offer: TradeOffer) {
  return offeredItem(offer)?.condition ?? ''
}
function offeredValue(offer: TradeOffer) {
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

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    DECLINED: 'Declined',
    WITHDRAWN: 'Withdrawn',
    COMPLETED: 'Completed',
    EXPIRED: 'Expired',
  }
  return map[s] ?? s
}

function statusClass(s: string): string {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    DECLINED: 'bg-red-100 text-red-700',
    WITHDRAWN: 'bg-surface-200 text-surface-600',
    COMPLETED: 'bg-blue-100 text-blue-800',
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
          >{{ tab.count }}</span
        >
      </button>
    </div>

    <!-- Loading skeletons -->
    <div v-if="activeLoading" class="space-y-4">
      <div v-for="n in 2" :key="n" class="card animate-pulse space-y-4">
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
        <!-- Card header: who + status -->
        <div
          class="px-4 pt-4 pb-3 flex items-center justify-between gap-2 border-b border-surface-100"
        >
          <div class="flex items-center gap-2 min-w-0">
            <div
              class="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0"
              aria-hidden="true"
            >
              {{ counterpart(offer).displayName.charAt(0) }}
            </div>
            <span class="text-xs text-surface-600 truncate">
              <span class="font-medium text-surface-800">{{ counterpart(offer).displayName }}</span>
              <span class="text-surface-400"> · {{ relativeTime(offer.createdAt) }}</span>
            </span>
          </div>
          <span
            class="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
            :class="statusClass(offer.status)"
          >
            {{ statusLabel(offer.status) }}
          </span>
        </div>

        <!-- Trade visual: YOU OFFER ⇄ FOR -->
        <div class="px-4 py-4">
          <div class="grid grid-cols-[1fr_32px_1fr] gap-2 items-start">
            <!-- Offered item (sender's listing) -->
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
            <div class="flex items-center justify-center">
              <svg
                class="w-8 h-8 text-primary-500"
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

            <!-- Target listing (receiver's listing) -->
            <div class="space-y-2">
              <p
                class="text-[10px] font-bold text-surface-400 uppercase tracking-widest text-center"
              >
                {{ activeTab === 'received' ? 'For Your' : 'For Their' }}
              </p>
              <div
                class="rounded-xl overflow-hidden bg-surface-100 border border-surface-200"
                style="aspect-ratio: 4/3"
              >
                <img
                  v-if="targetImage(offer)"
                  :src="targetImage(offer)!"
                  :alt="offer.targetListing?.title"
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
                  {{ offer.targetListing?.title }}
                </p>
                <p class="text-[11px] text-surface-500">
                  {{ conditionLabel(offer.targetListing?.condition ?? '') }}
                  <template v-if="offer.targetListing?.estimatedValue">
                    ·
                    <span class="text-amber-700 font-medium"
                      >RM {{ offer.targetListing.estimatedValue.toLocaleString() }}</span
                    >
                  </template>
                </p>
              </div>
            </div>
          </div>

          <!-- Message (if any) -->
          <div v-if="offer.message" class="mt-4 pt-4 border-t border-surface-100">
            <p class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1.5">
              Message
            </p>
            <p class="text-sm text-surface-700 leading-relaxed">{{ offer.message }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div
          v-if="offer.status === 'PENDING' || offer.status === 'ACCEPTED'"
          class="px-4 pb-4 flex gap-2"
        >
          <!-- RECEIVED tab actions -->
          <template v-if="activeTab === 'received' && offer.status === 'PENDING'">
            <button
              type="button"
              class="btn-primary flex-1 text-sm py-2"
              @click="requestAction('accept', offer)"
            >
              Accept Offer
            </button>
            <button
              type="button"
              class="btn-secondary flex-1 text-sm py-2"
              @click="requestAction('decline', offer)"
            >
              Decline
            </button>
          </template>

          <!-- SENT tab + PENDING -->
          <template v-if="activeTab === 'sent' && offer.status === 'PENDING'">
            <button
              type="button"
              class="btn-secondary w-full text-sm py-2"
              @click="requestAction('withdraw', offer)"
            >
              Withdraw Offer
            </button>
          </template>

          <!-- Both tabs: ACCEPTED → complete -->
          <template v-if="offer.status === 'ACCEPTED'">
            <button
              type="button"
              class="btn-primary w-full text-sm py-2"
              @click="requestAction('complete', offer)"
            >
              Mark as Completed
            </button>
          </template>
        </div>
      </article>
    </div>

    <!-- Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="confirmTarget"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        @click.self="confirmTarget = null"
      >
        <div
          class="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4"
          role="dialog"
          aria-modal="true"
        >
          <h3 class="text-lg font-bold text-surface-800">
            {{ confirmConfig[confirmTarget.action].title }}
          </h3>
          <p class="text-sm text-surface-600 leading-relaxed">
            {{ confirmConfig[confirmTarget.action].body }}
          </p>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="flex-1 px-4 py-2 text-sm font-medium text-surface-600 hover:text-surface-800 bg-surface-100 hover:bg-surface-200 rounded-lg transition"
              @click="confirmTarget = null"
            >
              Cancel
            </button>
            <button
              type="button"
              class="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition"
              :class="confirmConfig[confirmTarget.action].btnClass"
              @click="executeAction"
            >
              {{ confirmConfig[confirmTarget.action].confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
