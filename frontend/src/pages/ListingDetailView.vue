<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useOfferStore } from '@/stores/offer'
import { useListingStore } from '@/stores/listing'
import listingService, {
  type Listing,
  type FeedListing,
  type Category,
  parseCommaList,
} from '@/services/listingService'
import { avatarUrl } from '@/services/userService'

const route = useRoute()
const authStore = useAuthStore()
const offerStore = useOfferStore()
const listingStore = useListingStore()
const id = route.params.id as string

// ── Listing data ──────────────────────────────────────────────────────────────
const listing = ref<Listing | null>(null)
const ownerAvatarError = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const mediaIndex = ref(0)
const lightboxOpen = ref(false)
const currentMedia = computed(() => listing.value?.images[mediaIndex.value] ?? null)

const ownerAvatarUrl = computed(() => {
  if (ownerAvatarError.value) return null
  return avatarUrl(listing.value?.user?.profileImage)
})

async function load() {
  loading.value = true
  error.value = null
  mediaIndex.value = 0
  relatedListings.value = []
  try {
    listing.value = await listingService.getOne(id)
    // Load related listings after main listing loads (non-blocking)
    if (listing.value?.categoryId) {
      loadRelated(listing.value.categoryId)
    }
  } catch {
    error.value = 'Could not load this listing.'
  } finally {
    loading.value = false
  }
}

// ── Categories (to resolve interestedInCategories ids → names) ───────────────
const allCategories = ref<Category[]>([])

async function loadCategories() {
  try {
    allCategories.value = await listingService.getCategories()
  } catch {
    /* non-fatal */
  }
}

// ── Related listings ──────────────────────────────────────────────────────────
const relatedListings = ref<FeedListing[]>([])
const relatedLoading = ref(false)

async function loadRelated(categoryId: string) {
  relatedLoading.value = true
  try {
    relatedListings.value = await listingService.getRelatedListings(categoryId, id, 4)
  } catch {
    /* non-fatal — section simply won't render */
  } finally {
    relatedLoading.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  load()
  loadCategories()
  if (authStore.isAuthenticated) {
    loadMyListings()
    offerStore.fetchSent()
  }
})

// ── Parsed fields ─────────────────────────────────────────────────────────────
const tradePreferences = computed(() => parseCommaList(listing.value?.tradePreference))
const exchangeMethods = computed(() => parseCommaList(listing.value?.exchangeMethod))

/** Resolve comma-sep category IDs to human-readable names */
const resolvedInterestedCats = computed((): string[] => {
  const ids = parseCommaList(listing.value?.interestedInCategories)
  if (!ids.length) return []
  const map = new Map(allCategories.value.map((c) => [c.id, c.name]))
  return ids.map((id) => map.get(id) ?? id) // fallback to id if not resolved yet
})

// ── Offer modal ───────────────────────────────────────────────────────────────
const showOfferModal = ref(false)
const selectedOfferedId = ref<string | null>(null)
const offerMessage = ref('')
const offerSuccess = ref(false)
const offerError = ref({ listing: '' })
const myListingsLoading = ref(false)

const offerableListing = computed(() =>
  listingStore.myListings.filter((l) => l.status === 'ACTIVE' && l.id !== id),
)

const existingPendingOffer = computed(
  () => offerStore.sent.find((o) => o.targetListingId === id && o.status === 'PENDING') ?? null,
)

function openOfferModal() {
  offerStore.clearError()
  offerError.value.listing = ''
  selectedOfferedId.value = null
  offerMessage.value = ''
  offerSuccess.value = false
  showOfferModal.value = true
}

function closeOfferModal() {
  if (offerStore.submitting) return
  showOfferModal.value = false
}

async function cancelPendingOffer() {
  if (!existingPendingOffer.value) return
  offerStore.clearError()
  await offerStore.withdrawOffer(existingPendingOffer.value.id)
}

async function loadMyListings() {
  if (listingStore.myListings.length) return
  myListingsLoading.value = true
  await listingStore.fetchMyListings()
  myListingsLoading.value = false
}

async function sendOffer() {
  offerError.value.listing = ''
  offerStore.clearError()
  if (!selectedOfferedId.value) {
    offerError.value.listing = 'Please select a listing to offer.'
    return
  }
  try {
    await offerStore.createOffer({
      targetListingId: id,
      offeredListingId: selectedOfferedId.value,
      message: offerMessage.value || undefined,
    })
    offerSuccess.value = true
    setTimeout(() => {
      showOfferModal.value = false
      offerSuccess.value = false
      selectedOfferedId.value = null
      offerMessage.value = ''
    }, 2000)
  } catch {
    /* error displayed via offerStore.error */
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mediaUrl(filename: string | null | undefined) {
  return listingService.mediaUrl(filename) ?? ''
}

function firstImage(item: Listing | null | undefined): string | null {
  if (!item) return null
  const m = item.images?.find((i) => i.imageUrl)
  return m ? listingService.mediaUrl(m.imageUrl) : null
}

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

function conditionClass(c: string) {
  const map: Record<string, string> = {
    NEW: 'bg-green-100 text-green-800',
    LIKE_NEW: 'bg-emerald-100 text-emerald-800',
    GOOD: 'bg-primary-100 text-primary-800',
    FAIR: 'bg-amber-100 text-amber-800',
    POOR: 'bg-red-100 text-red-700',
  }
  return map[c] ?? 'bg-surface-100 text-surface-700'
}

const tradePrefLabels: Record<string, string> = {
  SPECIFIC_ITEM: 'Specific item only',
  SIMILAR_VALUE: 'Similar value items',
  OPEN_OFFERS: 'Open to offers',
  MULTIPLE_ITEMS: 'Multiple items for one',
}
function tradePrefLabel(p: string) {
  return tradePrefLabels[p] ?? p
}

const exchangeLabels: Record<string, string> = {
  MEETUP: 'Meet-up',
  SELF_PICKUP: 'Self pickup',
  DELIVERY: 'Delivery',
  SHIPPING: 'Shipping',
  ONLINE: 'Online/Digital',
}
const exchangeEmojis: Record<string, string> = {
  MEETUP: '🤝',
  SELF_PICKUP: '🚶',
  DELIVERY: '🚗',
  SHIPPING: '📬',
  ONLINE: '💻',
}
function exchangeMethodLabel(m: string) {
  return exchangeLabels[m] ?? m
}
function exchangeMethodEmoji(m: string) {
  return exchangeEmojis[m] ?? ''
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

function fullDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Listing type is now always PHYSICAL_ITEM, but keep helpers in case
// future types are re-introduced without requiring a template change.
const listingTypeLabels: Record<string, string> = {
  PHYSICAL_ITEM: 'Physical Item',
}
const listingTypeEmojis: Record<string, string> = {
  PHYSICAL_ITEM: '📦',
}
function listingTypeLabel(t: string) {
  return listingTypeLabels[t] ?? 'Physical Item'
}
function listingTypeEmoji(t: string) {
  return listingTypeEmojis[t] ?? '📦'
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Back -->
    <button
      class="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-primary-700 transition mb-5"
      @click="$router.back()"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to listings
    </button>

    <!-- ── Loading skeleton ── -->
    <div v-if="loading" class="grid lg:grid-cols-[1fr_380px] gap-6">
      <div class="card animate-pulse space-y-3">
        <div class="aspect-[4/3] bg-surface-200 rounded-xl"></div>
        <div class="flex gap-2">
          <div v-for="n in 4" :key="n" class="w-16 h-16 bg-surface-200 rounded-lg shrink-0"></div>
        </div>
      </div>
      <div class="space-y-4">
        <div class="card animate-pulse space-y-4">
          <div class="h-5 bg-surface-200 rounded w-1/3"></div>
          <div class="h-7 bg-surface-200 rounded w-5/6"></div>
          <div class="h-4 bg-surface-200 rounded w-2/3"></div>
        </div>
        <div class="card animate-pulse space-y-3">
          <div class="h-3 bg-surface-200 rounded w-full"></div>
          <div class="h-3 bg-surface-200 rounded w-full"></div>
          <div class="h-3 bg-surface-200 rounded w-4/6"></div>
        </div>
      </div>
    </div>

    <!-- ── Error ── -->
    <div v-else-if="error" class="card text-center py-14">
      <div
        class="w-14 h-14 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <svg
          class="w-7 h-7 text-surface-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 class="text-base font-semibold text-surface-800 mb-1">Listing not found</h2>
      <p class="text-sm text-surface-500 mb-5">
        This listing may have been removed or the link is invalid.
      </p>
      <div class="flex gap-3 justify-center">
        <button class="btn-secondary px-4 py-2 text-sm" @click="$router.back()">← Go back</button>
        <router-link to="/" class="btn-primary px-4 py-2 text-sm">Browse listings</router-link>
      </div>
    </div>

    <!-- ── Main content ── -->
    <template v-else-if="listing">
      <!-- ── TRADED / UNAVAILABLE banner (full width, above grid) ── -->
      <div
        v-if="listing.status === 'TRADED'"
        class="mb-5 rounded-2xl bg-primary-50 border border-primary-200 px-5 py-4 flex items-center gap-3"
        role="status"
      >
        <span
          class="text-xs font-bold uppercase tracking-widest bg-primary-600 text-white px-2.5 py-1 rounded-full shrink-0"
          >Traded</span
        >
        <p class="text-sm text-primary-800">This item is no longer available for barter.</p>
      </div>
      <div
        v-else-if="['ARCHIVED', 'REMOVED'].includes(listing.status)"
        class="mb-5 rounded-2xl bg-surface-100 border border-surface-200 px-5 py-4 flex items-center gap-3"
        role="status"
      >
        <span
          class="text-xs font-bold uppercase tracking-widest bg-surface-500 text-white px-2.5 py-1 rounded-full shrink-0"
          >{{ listing.status === 'ARCHIVED' ? 'Archived' : 'Removed' }}</span
        >
        <p class="text-sm text-surface-600">This listing is no longer active.</p>
      </div>

      <!-- Two-column on desktop, single column on mobile -->
      <div class="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <!-- ══ LEFT COLUMN: Gallery ════════════════════════════════════════ -->
        <div class="space-y-3">
          <!-- Main image / placeholder -->
          <div
            class="rounded-2xl overflow-hidden bg-surface-100 border border-surface-200"
            style="aspect-ratio: 4/3"
          >
            <template v-if="currentMedia?.imageUrl">
              <img
                :src="mediaUrl(currentMedia.imageUrl)"
                :alt="listing.title"
                class="w-full h-full object-cover cursor-zoom-in"
                @click="lightboxOpen = true"
              />
            </template>

            <div v-else class="w-full h-full flex items-center justify-center text-surface-400">
              <svg class="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- ══ RIGHT COLUMN: Details ═══════════════════════════════════════ -->
        <div class="space-y-4">
          <div class="card space-y-4">
            <h1 class="text-2xl font-bold text-surface-900">{{ listing.title }}</h1>
            <p class="text-surface-600">{{ listing.description }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
