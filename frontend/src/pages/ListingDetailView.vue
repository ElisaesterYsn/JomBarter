<template>
  <div class="max-w-2xl mx-auto">
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

    <!-- Loading -->
    <div v-if="loading" class="card animate-pulse space-y-4">
      <div class="aspect-[4/3] bg-surface-200 rounded-xl"></div>
      <div class="h-6 bg-surface-200 rounded w-2/3"></div>
      <div class="h-4 bg-surface-200 rounded w-full"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="card text-center py-12">
      <p class="text-surface-600 mb-4">{{ error }}</p>
      <button class="btn-secondary px-5 py-2 text-sm" @click="load">Try again</button>
    </div>

    <template v-else-if="listing">
      <!-- ── Media carousel ── -->
      <div class="card !p-0 overflow-hidden mb-5">
        <div class="relative bg-surface-100" style="aspect-ratio: 4/3">
          <template v-if="currentMedia?.imageUrl">
            <img
              :src="mediaUrl(currentMedia.imageUrl)"
              :alt="listing.title"
              class="w-full h-full object-contain"
            />
          </template>
          <template v-else-if="currentMedia?.videoUrl">
            <video
              :src="mediaUrl(currentMedia.videoUrl)"
              class="w-full h-full object-contain"
              controls
              preload="metadata"
            />
          </template>
          <template v-else>
            <div class="w-full h-full flex flex-col items-center justify-center text-surface-300">
              <svg
                class="w-14 h-14 mb-2"
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
              <span class="text-sm">No photos</span>
            </div>
          </template>

          <!-- Carousel arrows -->
          <template v-if="listing.images.length > 1">
            <button
              class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition"
              :disabled="mediaIndex === 0"
              aria-label="Previous photo"
              @click="mediaIndex--"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition"
              :disabled="mediaIndex === listing.images.length - 1"
              aria-label="Next photo"
              @click="mediaIndex++"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <div class="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              <button
                v-for="(_, i) in listing.images"
                :key="i"
                class="w-2 h-2 rounded-full transition"
                :class="i === mediaIndex ? 'bg-white' : 'bg-white/50'"
                :aria-label="`Photo ${i + 1}`"
                @click="mediaIndex = i"
              />
            </div>
          </template>
        </div>

        <!-- Thumbnail strip -->
        <div
          v-if="listing.images.length > 1"
          class="flex gap-2 p-3 overflow-x-auto bg-surface-50 border-t border-surface-100"
        >
          <button
            v-for="(img, i) in listing.images"
            :key="img.id"
            class="shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition"
            :class="
              i === mediaIndex
                ? 'border-primary-500'
                : 'border-transparent opacity-60 hover:opacity-100'
            "
            :aria-label="`View photo ${i + 1}`"
            @click="mediaIndex = i"
          >
            <img
              v-if="img.imageUrl"
              :src="mediaUrl(img.imageUrl)"
              :alt="`Photo ${i + 1}`"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full bg-surface-200 flex items-center justify-center text-surface-400"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </button>
        </div>
      </div>

      <!-- ── Main info ── -->
      <div class="card mb-4">
        <!-- Title row -->
        <div class="flex items-start justify-between gap-3 mb-3">
          <h1 class="text-xl font-bold text-surface-800 leading-snug flex-1">
            {{ listing.title }}
          </h1>
          <span
            class="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
            :class="conditionClass(listing.condition)"
          >
            {{ conditionLabel(listing.condition) }}
          </span>
        </div>

        <!-- Meta chips row -->
        <div class="flex flex-wrap items-center gap-2 mb-4 text-xs">
          <span
            class="inline-flex items-center gap-1 bg-surface-100 text-surface-700 px-2.5 py-1 rounded-full font-medium"
          >
            <span aria-hidden="true">{{ listingTypeEmoji(listing.listingType) }}</span>
            {{ listingTypeLabel(listing.listingType) }}
          </span>
          <span
            v-if="listing.category"
            class="inline-flex items-center gap-1 bg-surface-100 text-surface-700 px-2.5 py-1 rounded-full font-medium"
          >
            📂 {{ listing.category.name }}
          </span>
          <span v-if="listing.location" class="inline-flex items-center gap-1 text-surface-500">
            <svg
              class="w-3.5 h-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {{ listing.location }}
          </span>
          <span
            v-if="listing.estimatedValue"
            class="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full font-medium border border-amber-200"
          >
            Estimated: RM {{ listing.estimatedValue.toLocaleString() }}
          </span>
          <span class="text-surface-400 ml-auto">{{ relativeTime(listing.createdAt) }}</span>
        </div>

        <!-- Description -->
        <div class="mb-4">
          <h2 class="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">
            Description
          </h2>
          <p class="text-sm text-surface-700 leading-relaxed whitespace-pre-line">
            {{ listing.description }}
          </p>
        </div>

        <!-- What they want -->
        <div
          v-if="listing.lookingFor"
          class="mb-4 bg-primary-50 border border-primary-100 rounded-xl p-4"
        >
          <h2 class="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-2">
            Looking to trade for
          </h2>
          <p class="text-sm text-primary-900 leading-relaxed">{{ listing.lookingFor }}</p>
        </div>

        <!-- Trade preferences -->
        <div v-if="tradePreferences.length" class="mb-4">
          <h2 class="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">
            Trade preferences
          </h2>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="p in tradePreferences"
              :key="p"
              class="inline-flex items-center gap-1 bg-surface-100 text-surface-700 text-xs px-2.5 py-1 rounded-full"
            >
              ✓ {{ tradePrefLabel(p) }}
            </span>
          </div>
        </div>

        <!-- Exchange methods -->
        <div v-if="exchangeMethods.length" class="mb-4">
          <h2 class="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">
            Exchange method
          </h2>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="m in exchangeMethods"
              :key="m"
              class="inline-flex items-center gap-1 bg-surface-100 text-surface-700 text-xs px-2.5 py-1 rounded-full"
            >
              {{ exchangeMethodEmoji(m) }} {{ exchangeMethodLabel(m) }}
            </span>
          </div>
        </div>

        <!-- Interested-in categories -->
        <div v-if="interestedInCats.length" class="mb-4">
          <h2 class="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">
            Interested in
          </h2>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="cat in interestedInCats"
              :key="cat"
              class="inline-flex items-center bg-surface-100 text-surface-700 text-xs px-2.5 py-1 rounded-full"
            >
              {{ cat }}
            </span>
          </div>
        </div>
      </div>

      <!-- ── Owner + CTA ── -->
      <div class="card flex items-center gap-4">
        <div
          class="w-11 h-11 rounded-full bg-primary-600 text-white flex items-center justify-center text-base font-bold uppercase shrink-0"
          aria-hidden="true"
        >
          {{ listing.user?.displayName?.charAt(0) ?? '?' }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-surface-800 truncate">
            {{ listing.user?.displayName }}
          </p>
          <p class="text-xs text-surface-400">Member · {{ relativeTime(listing.createdAt) }}</p>
        </div>

        <!-- Guest CTA -->
        <router-link
          v-if="!authStore.isAuthenticated"
          to="/register"
          class="btn-primary text-sm px-5 py-2.5 shrink-0"
        >
          Sign up to offer
        </router-link>
        <!-- Own listing -->
        <router-link
          v-else-if="authStore.user?.id === listing.userId"
          :to="`/my-listings/${listing.id}/edit`"
          class="btn-secondary text-sm px-5 py-2.5 shrink-0"
        >
          Edit listing
        </router-link>
        <!-- Make an Offer CTA -->
        <button
          v-else
          class="btn-primary text-sm px-5 py-2.5 shrink-0"
          @click="showOfferModal = true"
        >
          Make an Offer
        </button>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════════════
         MAKE AN OFFER MODAL
    ══════════════════════════════════════════════════════════════════ -->
    <div
      v-if="showOfferModal"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-modal-title"
      @click.self="showOfferModal = false"
    >
      <div class="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <!-- Modal header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h2 id="offer-modal-title" class="text-base font-bold text-surface-800">Make an Offer</h2>
          <button
            type="button"
            class="text-surface-400 hover:text-surface-700 transition"
            aria-label="Close"
            @click="showOfferModal = false"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div class="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <!-- They want -->
          <div class="bg-surface-50 rounded-xl p-3 flex items-center gap-3">
            <div class="w-12 h-12 bg-surface-200 rounded-lg overflow-hidden shrink-0">
              <img
                v-if="firstImage(listing)"
                :src="firstImage(listing)!"
                :alt="listing?.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-surface-400">
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                  />
                </svg>
              </div>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-surface-500 font-medium uppercase tracking-wide">You want</p>
              <p class="text-sm font-semibold text-surface-800 truncate">{{ listing?.title }}</p>
            </div>
          </div>

          <!-- My listings to offer -->
          <div>
            <p class="text-sm font-semibold text-surface-700 mb-2">
              Choose something to offer: <span class="text-red-500" aria-hidden="true">*</span>
            </p>
            <div v-if="myListingsLoading" class="text-sm text-surface-400 text-center py-4">
              Loading your listings…
            </div>
            <div v-else-if="offerableListing.length === 0" class="text-center py-6">
              <p class="text-sm text-surface-500 mb-3">
                You don't have any active listings to offer.
              </p>
              <router-link
                to="/my-listings/create"
                class="btn-primary text-sm px-4 py-2 inline-block"
                @click="showOfferModal = false"
                >Create a listing first</router-link
              >
            </div>
            <div v-else class="space-y-2 max-h-56 overflow-y-auto pr-1">
              <label
                v-for="item in offerableListing"
                :key="item.id"
                class="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition"
                :class="
                  selectedOfferedId === item.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-surface-200 hover:border-primary-300'
                "
              >
                <input type="radio" :value="item.id" v-model="selectedOfferedId" class="sr-only" />
                <div class="w-12 h-12 bg-surface-200 rounded-lg overflow-hidden shrink-0">
                  <img
                    v-if="firstImage(item)"
                    :src="firstImage(item)!"
                    :alt="item.title"
                    class="w-full h-full object-cover"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center text-surface-400"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                      />
                    </svg>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-surface-800 truncate">{{ item.title }}</p>
                  <p class="text-xs text-surface-500">
                    {{ conditionLabel(item.condition)
                    }}{{ item.location ? ' · ' + item.location : '' }}
                  </p>
                </div>
                <div
                  v-if="selectedOfferedId === item.id"
                  class="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              </label>
            </div>
            <p v-if="offerError.listing" class="mt-1 text-xs text-red-600">
              {{ offerError.listing }}
            </p>
          </div>

          <!-- Message -->
          <div>
            <label for="offer-message" class="form-label"
              >Message <span class="text-surface-400 font-normal text-xs">(optional)</span></label
            >
            <textarea
              id="offer-message"
              v-model="offerMessage"
              rows="3"
              placeholder="Hi! Would you be interested in exchanging for my item?"
              class="form-input resize-none"
              maxlength="1000"
            ></textarea>
          </div>

          <!-- API error -->
          <div
            v-if="offerStore.error"
            class="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"
          >
            {{ offerStore.error }}
          </div>

          <!-- Success -->
          <div
            v-if="offerSuccess"
            class="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800 flex items-center gap-2"
          >
            <svg
              class="w-4 h-4 text-green-600 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            Offer sent! The owner will be notified.
          </div>
        </div>

        <!-- Modal footer -->
        <div class="flex gap-3 px-5 py-4 border-t border-surface-100">
          <button type="button" class="btn-secondary flex-1 py-2.5" @click="showOfferModal = false">
            Cancel
          </button>
          <button
            type="button"
            class="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
            :disabled="offerStore.submitting || offerSuccess"
            @click="sendOffer"
          >
            <svg
              v-if="offerStore.submitting"
              class="w-4 h-4 animate-spin"
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
            {{ offerSuccess ? 'Offer Sent ✓' : offerStore.submitting ? 'Sending…' : 'Send Offer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useOfferStore } from '@/stores/offer'
import { useListingStore } from '@/stores/listing'
import listingService, {
  type Listing,
  parseCommaList,
} from '@/services/listingService'

const route = useRoute()
const authStore = useAuthStore()
const offerStore = useOfferStore()
const listingStore = useListingStore()
const id = route.params.id as string

// ── Listing data ──────────────────────────────────────────────────────────────
const listing = ref<
  (Listing & { user?: { id: string; displayName: string; username: string } }) | null
>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const mediaIndex = ref(0)
const currentMedia = computed(() => listing.value?.images[mediaIndex.value] ?? null)

async function load() {
  loading.value = true
  error.value = null
  mediaIndex.value = 0
  try {
    listing.value = (await listingService.getOne(id)) as any
  } catch {
    error.value = 'Could not load this listing.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  if (authStore.isAuthenticated) loadMyListings()
})

// ── Parsed fields ─────────────────────────────────────────────────────────────
const tradePreferences = computed(() =>
  parseCommaList(listing.value?.tradePreference),
)
const exchangeMethods = computed(() =>
  parseCommaList(listing.value?.exchangeMethod),
)
// interestedInCategories: we just show raw ids for now (will map to names when categories store is available)
const interestedInCats = computed(() => parseCommaList(listing.value?.interestedInCategories))

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

async function loadMyListings() {
  if (listingStore.myListings.length) return // already loaded
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
  return (
    (
      {
        NEW: 'bg-green-100 text-green-800',
        LIKE_NEW: 'bg-emerald-100 text-emerald-800',
        GOOD: 'bg-primary-100 text-primary-800',
        FAIR: 'bg-amber-100 text-amber-800',
        POOR: 'bg-red-100 text-red-700',
      } as Record<string, string>
    )[c] ?? 'bg-surface-100 text-surface-700'
  )
}

const listingTypeLabels: Record<string, string> = {
  PHYSICAL_ITEM: 'Physical Item',
  SERVICE: 'Service',
  ITEM_AND_SERVICE: 'Item + Service',
}
const listingTypeEmojis: Record<string, string> = {
  PHYSICAL_ITEM: '📦',
  SERVICE: '🛠️',
  ITEM_AND_SERVICE: '🤝',
}
function listingTypeLabel(t: string) {
  return listingTypeLabels[t] ?? t
}
function listingTypeEmoji(t: string) {
  return listingTypeEmojis[t] ?? '📦'
}

const tradePrefLabels: Record<string, string> = {
  SPECIFIC_ITEM: 'Specific item only',
  SIMILAR_VALUE: 'Similar value items',
  OPEN_OFFERS: 'Open to offers',
  MULTIPLE_ITEMS: 'Multiple items for one',
  ITEM_SERVICE: 'Item + service',
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
</script>
