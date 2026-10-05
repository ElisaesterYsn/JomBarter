<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useListingStore } from '@/stores/listing'
import listingService, { type Listing } from '@/services/listingService'

const listingStore = useListingStore()

onMounted(() => listingStore.fetchMyListings())

// ── Media helpers ─────────────────────────────────────────────────────────────
function firstImage(listing: Listing): string | null {
  const item = listing.images.find((m) => m.imageUrl)
  return item ? listingService.mediaUrl(item.imageUrl) : null
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

function statusClass(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'bg-surface-200 text-surface-700',
    ACTIVE: 'bg-green-100 text-green-800',
    TRADED: 'bg-primary-100 text-primary-800',
    ARCHIVED: 'bg-amber-100 text-amber-800',
    REMOVED: 'bg-red-100 text-red-700',
  }
  return map[status] ?? 'bg-surface-200 text-surface-700'
}

// ── Publish / unpublish ───────────────────────────────────────────────────────
async function handlePublish(id: string) {
  await listingStore.publish(id)
}
async function handleUnpublish(id: string) {
  await listingStore.unpublish(id)
}

// ── Delete ────────────────────────────────────────────────────────────────────
const deleteTarget = ref<{ id: string; title: string } | null>(null)
function confirmDelete(id: string, title: string) {
  deleteTarget.value = { id, title }
}
async function handleDelete() {
  if (!deleteTarget.value) return
  await listingStore.remove(deleteTarget.value.id)
  deleteTarget.value = null
}

// ── Mark as Traded ────────────────────────────────────────────────────────────
const tradedTarget = ref<{ id: string; title: string } | null>(null)
function confirmMarkTraded(id: string, title: string) {
  tradedTarget.value = { id, title }
}
async function handleMarkTraded() {
  if (!tradedTarget.value) return
  await listingStore.markAsTraded(tradedTarget.value.id)
  tradedTarget.value = null
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-800">My Listings</h1>
        <p class="mt-1 text-sm text-surface-500">Manage the items you want to barter</p>
      </div>
      <router-link
        to="/my-listings/create"
        class="btn-primary px-5 py-2.5 flex items-center gap-2 self-start sm:self-auto"
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
        Offer Something
      </router-link>
    </div>

    <!-- Error banner -->
    <div
      v-if="listingStore.error"
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
      {{ listingStore.error }}
    </div>

    <!-- Loading skeleton -->
    <div v-if="listingStore.loading" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div v-for="n in 3" :key="n" class="card animate-pulse space-y-3">
        <div class="h-40 bg-surface-200 rounded-lg"></div>
        <div class="h-4 bg-surface-200 rounded w-3/4"></div>
        <div class="h-3 bg-surface-200 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!listingStore.loading && listingStore.myListings.length === 0"
      class="card text-center py-16"
    >
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
      <h2 class="text-lg font-semibold text-surface-800 mb-2">No listings yet</h2>
      <p class="text-surface-500 text-sm mb-6">
        Add your first item to start bartering with the community.
      </p>
      <router-link
        to="/my-listings/create"
        class="btn-primary px-6 py-2.5 inline-flex items-center gap-2"
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
        Add your first listing
      </router-link>
    </div>

    <!-- Listings grid -->
    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="listing in listingStore.myListings"
        :key="listing.id"
        class="card flex flex-col gap-3 hover:shadow-lg transition-shadow duration-200"
      >
        <!-- Media preview -->
        <div class="relative h-44 bg-surface-100 rounded-lg overflow-hidden">
          <template v-if="firstImage(listing)">
            <img
              :src="firstImage(listing)!"
              :alt="listing.title"
              class="w-full h-full object-cover"
            />
          </template>
          <div v-else class="w-full h-full flex items-center justify-center">
            <svg
              class="w-12 h-12 text-surface-300"
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

          <!-- Status badge -->
          <span
            :class="statusClass(listing.status)"
            class="absolute top-2 right-2 px-2.5 py-1 text-xs font-semibold rounded-full"
          >
            {{ listing.status }}
          </span>
        </div>

        <!-- Content -->
        <div class="flex-1 space-y-2">
          <h3 class="font-semibold text-surface-800 line-clamp-1">{{ listing.title }}</h3>
          <p class="text-sm text-surface-500 line-clamp-2">
            {{ listing.description || 'No description' }}
          </p>
          <div class="flex items-center gap-2 text-xs text-surface-500">
            <span class="px-2 py-0.5 bg-surface-100 rounded">{{ listing.category?.name }}</span>
            <span>•</span>
            <span>{{ conditionLabel(listing.condition) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 pt-2 border-t border-surface-100">
          <router-link
            :to="`/listings/${listing.id}`"
            class="text-sm text-primary-700 hover:text-primary-800 font-medium"
          >
            View
          </router-link>
          <span class="text-surface-300">•</span>
          <router-link
            :to="`/my-listings/${listing.id}/edit`"
            class="text-sm text-primary-700 hover:text-primary-800 font-medium"
          >
            Edit
          </router-link>

          <!-- Publish/Unpublish -->
          <template v-if="listing.status === 'DRAFT'">
            <span class="text-surface-300">•</span>
            <button
              class="text-sm text-green-700 hover:text-green-800 font-medium"
              @click="handlePublish(listing.id)"
            >
              Publish
            </button>
          </template>
          <template v-else-if="listing.status === 'ACTIVE'">
            <span class="text-surface-300">•</span>
            <button
              class="text-sm text-amber-700 hover:text-amber-800 font-medium"
              @click="handleUnpublish(listing.id)"
            >
              Unpublish
            </button>
          </template>

          <!-- Mark as Traded -->
          <template v-if="listing.status === 'ACTIVE'">
            <span class="text-surface-300">•</span>
            <button
              class="text-sm text-primary-700 hover:text-primary-800 font-medium"
              @click="confirmMarkTraded(listing.id, listing.title)"
            >
              Mark Traded
            </button>
          </template>

          <span class="text-surface-300 ml-auto">•</span>
          <button
            class="text-sm text-red-600 hover:text-red-700 font-medium"
            @click="confirmDelete(listing.id, listing.title)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <Teleport to="body">
      <div
        v-if="deleteTarget"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        @click.self="deleteTarget = null"
      >
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
          <h3 class="text-lg font-semibold text-surface-800">Delete listing?</h3>
          <p class="text-sm text-surface-600">
            Are you sure you want to delete <strong>{{ deleteTarget.title }}</strong
            >? This action cannot be undone.
          </p>
          <div class="flex gap-3 justify-end">
            <button class="btn-secondary px-4 py-2" @click="deleteTarget = null">Cancel</button>
            <button class="btn-primary bg-red-600 hover:bg-red-700 px-4 py-2" @click="handleDelete">
              Delete
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Mark as Traded confirmation modal -->
    <Teleport to="body">
      <div
        v-if="tradedTarget"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        @click.self="tradedTarget = null"
      >
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
          <h3 class="text-lg font-semibold text-surface-800">Mark as traded?</h3>
          <p class="text-sm text-surface-600">
            Are you sure <strong>{{ tradedTarget.title }}</strong> has been traded? This will mark
            it as unavailable.
          </p>
          <div class="flex gap-3 justify-end">
            <button class="btn-secondary px-4 py-2" @click="tradedTarget = null">Cancel</button>
            <button class="btn-primary px-4 py-2" @click="handleMarkTraded">Confirm</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
