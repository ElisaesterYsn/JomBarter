<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import listingService, { type FeedListing, type Listing } from '@/services/listingService'
import { avatarUrl, avatarInitial } from '@/services/userService'

const route = useRoute()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const username = route.params.username as string

// ── State ────────────────────────────────────────────────────────────────────
const userListings = ref<FeedListing[]>([])
const listingsLoading = ref(false)
const avatarError = ref(false)

onMounted(async () => {
  profileStore.clearPublicProfile()
  await profileStore.fetchPublicProfile(username)
  if (profileStore.publicProfile) loadUserListings()
})

// ── Derived ───────────────────────────────────────────────────────────────────
const isOwnProfile = computed(
  () => authStore.isAuthenticated && authStore.user?.username === username,
)

const profileAvatarUrl = computed(() => {
  if (avatarError.value) return null
  return avatarUrl(profileStore.publicProfile?.profileImage)
})

const initial = computed(() => avatarInitial(profileStore.publicProfile?.displayName))

// ── Load user's active listings via public feed endpoint ──────────────────────
async function loadUserListings() {
  if (!profileStore.publicProfile) return
  listingsLoading.value = true
  try {
    const data = await listingService.getPublicFeed(
      1,
      9,
      undefined,
      undefined,
      profileStore.publicProfile.id,
    )
    userListings.value = data.listings
  } catch {
    /* non-fatal */
  } finally {
    listingsLoading.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function firstImage(item: FeedListing | Listing): string | null {
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
function memberSince(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <!-- Back -->
    <button
      class="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-primary-700 transition"
      @click="$router.back()"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>

    <!-- Loading skeleton -->
    <div v-if="profileStore.loading" class="card animate-pulse space-y-4">
      <div class="flex items-center gap-5">
        <div class="w-20 h-20 bg-surface-200 rounded-full shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="h-6 bg-surface-200 rounded w-1/4"></div>
          <div class="h-4 bg-surface-200 rounded w-1/5"></div>
          <div class="h-3 bg-surface-200 rounded w-1/3"></div>
        </div>
      </div>
    </div>

    <!-- Not found -->
    <div
      v-else-if="profileStore.error && !profileStore.publicProfile"
      class="card text-center py-14"
    >
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
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
      <h2 class="text-base font-semibold text-surface-800 mb-1">User not found</h2>
      <p class="text-sm text-surface-500 mb-5">
        This trader's profile doesn't exist or has been removed.
      </p>
      <router-link to="/" class="btn-primary inline-block px-5 py-2 text-sm"
        >Browse Listings</router-link
      >
    </div>

    <template v-else-if="profileStore.publicProfile">
      <!-- ── Profile header ── -->
      <div class="card">
        <div class="flex flex-col sm:flex-row gap-5 items-start">
          <!-- Avatar -->
          <div
            class="w-20 h-20 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center shrink-0"
          >
            <img
              v-if="profileAvatarUrl"
              :src="profileAvatarUrl"
              :alt="profileStore.publicProfile.displayName"
              class="w-full h-full object-cover"
              @error="avatarError = true"
            />
            <span v-else class="text-2xl font-bold text-white uppercase select-none">
              {{ initial }}
            </span>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 class="text-xl font-bold text-surface-900">
                  {{ profileStore.publicProfile.displayName }}
                </h1>
                <p class="text-sm text-surface-500">@{{ profileStore.publicProfile.username }}</p>
              </div>
              <!-- Edit button only for own profile -->
              <router-link
                v-if="isOwnProfile"
                to="/profile"
                class="btn-secondary text-sm px-4 py-2 shrink-0"
              >
                Edit Profile
              </router-link>
            </div>

            <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-surface-500">
              <span v-if="profileStore.publicProfile.location" class="flex items-center gap-1">
                <svg
                  class="w-4 h-4 shrink-0 text-surface-400"
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
                {{ profileStore.publicProfile.location }}
              </span>
              <span class="flex items-center gap-1 text-surface-400">
                <svg
                  class="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Member since {{ memberSince(profileStore.publicProfile.createdAt) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Bio -->
        <div v-if="profileStore.publicProfile.bio" class="mt-4 pt-4 border-t border-surface-100">
          <p class="text-sm text-surface-700 leading-relaxed">
            {{ profileStore.publicProfile.bio }}
          </p>
        </div>
        <div v-else class="mt-4 pt-4 border-t border-surface-100">
          <p class="text-sm text-surface-400 italic">This trader hasn't added a bio yet.</p>
        </div>
      </div>

      <!-- ── Stats ── -->
      <div class="grid grid-cols-3 gap-4">
        <div class="card text-center py-5">
          <p class="text-2xl font-bold text-surface-900">
            {{ profileStore.publicProfile.activeListingCount }}
          </p>
          <p class="text-xs text-surface-500 mt-1 font-medium">Active Listings</p>
        </div>
        <div class="card text-center py-5">
          <p class="text-2xl font-bold text-surface-900">
            {{ profileStore.publicProfile.completedTradeCount }}
          </p>
          <p class="text-xs text-surface-500 mt-1 font-medium">Completed Trades</p>
        </div>
        <div class="card text-center py-5">
          <p class="text-2xl font-bold text-surface-300">—</p>
          <p class="text-xs text-surface-400 mt-1 font-medium">Rating</p>
          <p class="text-[10px] text-surface-300 mt-0.5">Coming soon</p>
        </div>
      </div>

      <!-- ── Active Listings ── -->
      <div>
        <h2 class="text-lg font-bold text-surface-800 mb-4">Active Listings</h2>

        <!-- Loading listings -->
        <div v-if="listingsLoading" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="n in 3"
            :key="n"
            class="rounded-2xl border border-surface-200 bg-white overflow-hidden animate-pulse"
          >
            <div class="aspect-[4/3] bg-surface-200"></div>
            <div class="p-3 space-y-2">
              <div class="h-3 bg-surface-200 rounded w-3/4"></div>
              <div class="h-3 bg-surface-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>

        <!-- No listings -->
        <div v-else-if="userListings.length === 0" class="card text-center py-10">
          <p class="text-sm text-surface-500">No active listings yet.</p>
        </div>

        <!-- Listing grid -->
        <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <router-link
            v-for="item in userListings"
            :key="item.id"
            :to="`/listings/${item.id}`"
            class="group rounded-2xl border border-surface-200 bg-white overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
            :aria-label="`View ${item.title}`"
          >
            <div class="aspect-[4/3] bg-surface-100 overflow-hidden">
              <img
                v-if="firstImage(item)"
                :src="firstImage(item)!"
                :alt="item.title"
                class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-surface-300">
                <svg
                  class="w-10 h-10"
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
            <div class="p-3 flex-1">
              <p class="text-xs font-semibold text-surface-800 line-clamp-2 leading-snug mb-1.5">
                {{ item.title }}
              </p>
              <div class="flex items-center justify-between gap-1">
                <span
                  class="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  :class="conditionClass(item.condition)"
                >
                  {{ conditionLabel(item.condition) }}
                </span>
                <span v-if="item.location" class="text-[11px] text-surface-400 truncate ml-1">{{
                  item.location
                }}</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <!-- ── Trade History (placeholder) ── -->
      <div>
        <h2 class="text-lg font-bold text-surface-800 mb-4">Trade History</h2>
        <div class="card text-center py-10">
          <p class="text-sm text-surface-400">Trade history will be available soon.</p>
        </div>
      </div>
    </template>
  </div>
</template>
