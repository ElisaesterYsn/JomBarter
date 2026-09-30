<template>
  <div class="max-w-2xl mx-auto">

    <!-- Back -->
    <button
      class="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-primary-700 transition mb-4"
      @click="$router.back()"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
      Back
    </button>

    <!-- Loading skeleton -->
    <div v-if="loading" class="card animate-pulse space-y-4">
      <div class="h-72 bg-surface-200 rounded-xl"></div>
      <div class="h-6 bg-surface-200 rounded w-2/3"></div>
      <div class="h-4 bg-surface-200 rounded w-full"></div>
      <div class="h-4 bg-surface-200 rounded w-5/6"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="card text-center py-12">
      <p class="text-surface-600 mb-4">{{ error }}</p>
      <button class="btn-secondary px-5 py-2 text-sm" @click="load">Try again</button>
    </div>

    <!-- Detail -->
    <template v-else-if="listing">
      <div class="card !p-0 overflow-hidden">

        <!-- Media carousel (simple: current index) -->
        <div class="relative bg-surface-100" style="aspect-ratio: 4/3;">
          <!-- Image slide -->
          <template v-if="currentMedia && currentMedia.imageUrl">
            <img
              :src="mediaUrl(currentMedia.imageUrl)"
              :alt="listing.title"
              class="w-full h-full object-contain"
            />
          </template>
          <!-- Video slide -->
          <template v-else-if="currentMedia && currentMedia.videoUrl">
            <video
              :src="mediaUrl(currentMedia.videoUrl)"
              class="w-full h-full object-contain"
              controls
              preload="metadata"
            />
          </template>
          <!-- No media -->
          <template v-else>
            <div class="w-full h-full flex flex-col items-center justify-center text-surface-300 gap-2">
              <svg class="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="text-sm">No photos or videos</span>
            </div>
          </template>

          <!-- Carousel nav (only when multiple media) -->
          <template v-if="listing.images.length > 1">
            <button
              class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition"
              :disabled="mediaIndex === 0"
              aria-label="Previous"
              @click="mediaIndex--"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button
              class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition"
              :disabled="mediaIndex === listing.images.length - 1"
              aria-label="Next"
              @click="mediaIndex++"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
            <!-- Dot indicators -->
            <div class="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              <button
                v-for="(_, i) in listing.images"
                :key="i"
                class="w-2 h-2 rounded-full transition"
                :class="i === mediaIndex ? 'bg-white' : 'bg-white/50'"
                :aria-label="`Go to media ${i + 1}`"
                @click="mediaIndex = i"
              />
            </div>
          </template>
        </div>

        <!-- Content -->
        <div class="p-5 space-y-4">

          <!-- Title + condition -->
          <div class="flex items-start justify-between gap-3">
            <h1 class="text-xl font-bold text-surface-800 leading-snug">{{ listing.title }}</h1>
            <span
              class="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 mt-0.5"
              :class="conditionClass(listing.condition)"
            >
              {{ conditionLabel(listing.condition) }}
            </span>
          </div>

          <!-- Meta row -->
          <div class="flex flex-wrap gap-3 text-xs text-surface-500">
            <span v-if="listing.location" class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {{ listing.location }}
            </span>
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Posted {{ relativeTime(listing.createdAt) }}
            </span>
          </div>

          <!-- Description -->
          <div>
            <h2 class="text-sm font-semibold text-surface-700 mb-1">Description</h2>
            <p class="text-sm text-surface-600 leading-relaxed whitespace-pre-line">{{ listing.description }}</p>
          </div>

          <!-- CTA — only shown to authenticated users who don't own it -->
          <div v-if="authStore.isAuthenticated" class="pt-2 border-t border-surface-100">
            <button
              class="w-full btn-primary py-2.5 text-sm"
              disabled
            >
              Propose a Barter (coming soon)
            </button>
          </div>
          <div v-else class="pt-2 border-t border-surface-100">
            <router-link to="/register" class="w-full btn-primary py-2.5 text-sm flex items-center justify-center">
              Sign up to propose a barter
            </router-link>
          </div>

        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import listingService, { type Listing } from '@/services/listingService'

const route = useRoute()
const authStore = useAuthStore()
const id = route.params.id as string

const listing = ref<Listing | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const mediaIndex = ref(0)

const currentMedia = computed(() => listing.value?.images[mediaIndex.value] ?? null)

async function load() {
  loading.value = true
  error.value = null
  mediaIndex.value = 0
  try {
    listing.value = await listingService.getOne(id)
  } catch {
    error.value = 'Could not load this listing.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function mediaUrl(filename: string | null | undefined) {
  return listingService.mediaUrl(filename) ?? ''
}

const conditionLabels: Record<string, string> = {
  NEW: 'New', LIKE_NEW: 'Like New', GOOD: 'Good', FAIR: 'Fair', POOR: 'Poor',
}
function conditionLabel(c: string) { return conditionLabels[c] ?? c }
function conditionClass(c: string): string {
  const map: Record<string, string> = {
    NEW: 'bg-green-100 text-green-800', LIKE_NEW: 'bg-emerald-100 text-emerald-800',
    GOOD: 'bg-primary-100 text-primary-800', FAIR: 'bg-amber-100 text-amber-800',
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
