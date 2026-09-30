<template>
  <div>
    <!-- ════════════════════════════════════════════════════════════════════
         SHARED FEED — used by both guest and authenticated views.
         The only difference is the footer action on each card.
    ═════════════════════════════════════════════════════════════════════ -->
    <div class="max-w-2xl mx-auto space-y-6">
      <!-- ── Feed header ── -->
      <template v-if="authStore.isAuthenticated">
        <!-- Authenticated header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-surface-800">
              Hello, {{ authStore.user?.displayName }} 👋
            </h1>
            <p class="text-sm text-surface-500 mt-0.5">See what the community is bartering today</p>
          </div>
          <router-link
            to="/my-listings/create"
            class="btn-primary text-sm px-4 py-2 flex items-center gap-1.5"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Listing
          </router-link>
        </div>
      </template>

      <template v-else>
        <!-- Guest header — hero banner above the feed -->
        <div
          class="text-center py-10 bg-gradient-to-br from-primary-800 via-primary-700 to-amber-600 text-white rounded-2xl shadow-lg px-6"
        >
          <h1 class="text-3xl font-bold mb-3 tracking-tight">Welcome to JomBarter</h1>
          <p class="text-base text-amber-100 mb-6 max-w-sm mx-auto">
            A community marketplace where you exchange items and services — no money needed.
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <router-link
              to="/register"
              class="bg-white text-primary-700 hover:bg-amber-50 font-semibold py-2.5 px-6 rounded-lg transition shadow text-sm"
            >
              Create Free Account
            </router-link>
            <router-link
              to="/login"
              class="border-2 border-white/70 text-white hover:bg-white/10 font-medium py-2.5 px-6 rounded-lg transition text-sm"
            >
              Sign In
            </router-link>
          </div>
        </div>

        <!-- "Sign up to unlock" nudge -->
        <div
          class="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800"
        >
          <svg
            class="w-4 h-4 shrink-0 text-amber-500"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clip-rule="evenodd"
            />
          </svg>
          <span>
            Browsing as guest.
            <router-link to="/register" class="font-semibold underline hover:no-underline"
              >Create a free account</router-link
            >
            to see full details and propose a barter.
          </span>
        </div>
      </template>

      <!-- ── Loading skeletons ── -->
      <div v-if="feedLoading" class="space-y-6">
        <div v-for="n in 3" :key="n" class="card animate-pulse space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-surface-200 rounded-full"></div>
            <div class="h-4 bg-surface-200 rounded w-32"></div>
          </div>
          <div class="h-72 bg-surface-200 rounded-xl"></div>
          <div class="h-4 bg-surface-200 rounded w-2/3"></div>
          <div class="h-3 bg-surface-200 rounded w-full"></div>
          <div class="h-3 bg-surface-200 rounded w-5/6"></div>
        </div>
      </div>

      <!-- ── Error ── -->
      <div v-else-if="feedError" class="card text-center py-10">
        <p class="text-surface-600 mb-4">{{ feedError }}</p>
        <button class="btn-secondary px-5 py-2 text-sm" @click="loadFeed(1)">Try again</button>
      </div>

      <!-- ── Empty state ── -->
      <div v-else-if="!feedLoading && feedItems.length === 0" class="card text-center py-16">
        <div
          class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg
            class="w-8 h-8 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h2 class="text-lg font-semibold text-surface-800 mb-2">Nothing listed yet</h2>
        <p class="text-surface-500 text-sm mb-6">Be the first to add an item to the community!</p>
        <router-link
          v-if="authStore.isAuthenticated"
          to="/my-listings/create"
          class="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add the first listing
        </router-link>
        <router-link
          v-else
          to="/register"
          class="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
        >
          Join to start bartering
        </router-link>
      </div>

      <!-- ── Feed items ── -->
      <div v-else class="space-y-6">
        <article v-for="item in feedItems" :key="item.id" class="card !p-0 overflow-hidden">
          <!-- Post header: poster info -->
          <div class="flex items-center gap-3 px-4 pt-4 pb-3">
            <div
              class="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-semibold uppercase select-none shrink-0"
              aria-hidden="true"
            >
              {{ item.user.displayName.charAt(0) }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-surface-800 truncate">
                {{ item.user.displayName }}
              </p>
              <p class="text-xs text-surface-400">{{ relativeTime(item.createdAt) }}</p>
            </div>
            <span
              class="ml-auto text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
              :class="conditionClass(item.condition)"
            >
              {{ conditionLabel(item.condition) }}
            </span>
          </div>

          <!-- Media -->
          <div class="relative w-full bg-surface-100" style="aspect-ratio: 4/3">
            <template v-if="firstImage(item)">
              <img
                :src="firstImage(item)!"
                :alt="item.title"
                class="w-full h-full object-cover"
                loading="lazy"
              />
            </template>
            <template v-else-if="firstVideo(item)">
              <video
                :src="firstVideo(item)!"
                class="w-full h-full object-cover"
                controls
                preload="metadata"
                :aria-label="`Video for ${item.title}`"
              />
            </template>
            <template v-else>
              <div
                class="w-full h-full flex flex-col items-center justify-center text-surface-300 gap-2"
              >
                <svg
                  class="w-12 h-12"
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
                <span class="text-xs text-surface-400">No photo</span>
              </div>
            </template>

            <!-- Multi-media badge -->
            <div
              v-if="item.images.length > 1"
              class="absolute top-2 right-2 bg-black/50 text-white text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clip-rule="evenodd"
                />
              </svg>
              {{ item.images.length }}
            </div>

            <!-- Guest overlay: blurred lock over the lower portion of the image -->
            <div
              v-if="!authStore.isAuthenticated"
              class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"
              aria-hidden="true"
            ></div>
          </div>

          <!-- Post body: title + description -->
          <div class="px-4 pt-3 pb-1 space-y-1">
            <h2 class="font-semibold text-surface-800 text-base leading-snug">{{ item.title }}</h2>
            <p class="text-sm text-surface-600 leading-relaxed line-clamp-3">
              {{ item.description }}
            </p>
            <p v-if="item.location" class="flex items-center gap-1 text-xs text-surface-400 pt-0.5">
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
              {{ item.location }}
            </p>
          </div>

          <!-- Post footer: action button (differs by auth state) -->
          <div class="px-4 py-3">
            <!-- Authenticated: go to full detail page -->
            <router-link
              v-if="authStore.isAuthenticated"
              :to="`/listings/${item.id}`"
              class="w-full btn-primary py-2 text-sm flex items-center justify-center gap-1.5"
            >
              More details
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </router-link>

            <!-- Guest: redirect to register with a lock hint -->
            <router-link
              v-else
              to="/register"
              class="w-full py-2 text-sm flex items-center justify-center gap-1.5 rounded-lg border-2 border-primary-600 text-primary-700 hover:bg-primary-50 font-medium transition duration-200"
            >
              <svg
                class="w-4 h-4 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                />
              </svg>
              Sign up to see more details
            </router-link>
          </div>
        </article>
      </div>

      <!-- ── Pagination ── -->
      <div
        v-if="pagination && pagination.totalPages > 1"
        class="flex items-center justify-center gap-3 pt-2"
      >
        <button
          class="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
          :disabled="!pagination.hasPrevPage || feedLoading"
          @click="loadFeed(pagination!.page - 1)"
        >
          ← Newer
        </button>
        <span class="text-sm text-surface-500">
          Page {{ pagination.page }} of {{ pagination.totalPages }}
        </span>
        <button
          class="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
          :disabled="!pagination.hasNextPage || feedLoading"
          @click="loadFeed(pagination!.page + 1)"
        >
          Older →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import listingService, { type FeedListing, type FeedResponse } from '@/services/listingService'

const authStore = useAuthStore()

// ── Feed state (shared between guest and authenticated) ───────────────────────
const feedItems = ref<FeedListing[]>([])
const pagination = ref<FeedResponse['pagination'] | null>(null)
const feedLoading = ref(false)
const feedError = ref<string | null>(null)

async function loadFeed(page = 1) {
  feedLoading.value = true
  feedError.value = null
  try {
    const data = await listingService.getPublicFeed(page, 12)
    feedItems.value = data.listings
    pagination.value = data.pagination
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch {
    feedError.value = 'Could not load listings. Please try again.'
  } finally {
    feedLoading.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => loadFeed())

// Re-fetch when auth state changes so auth/guest header switches smoothly
watch(
  () => authStore.isAuthenticated,
  () => loadFeed(),
)

// ── Helpers ───────────────────────────────────────────────────────────────────
function firstImage(item: FeedListing): string | null {
  const m = item.images.find((i) => i.imageUrl)
  return m ? listingService.mediaUrl(m.imageUrl) : null
}

function firstVideo(item: FeedListing): string | null {
  const m = item.images.find((i) => i.videoUrl)
  return m ? listingService.mediaUrl(m.videoUrl) : null
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

function conditionClass(c: string): string {
  const map: Record<string, string> = {
    NEW: 'bg-green-100 text-green-800',
    LIKE_NEW: 'bg-emerald-100 text-emerald-800',
    GOOD: 'bg-primary-100 text-primary-800',
    FAIR: 'bg-amber-100 text-amber-800',
    POOR: 'bg-red-100 text-red-700',
  }
  return map[c] ?? 'bg-surface-100 text-surface-700'
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
