<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import listingService from '@/services/listingService'

const router = useRouter()
const adminStore = useAdminStore()

// ── Filters & Search ───────────────────────────────────────────────────────────
const searchQuery = ref('')
const searchDebounced = ref('')
const statusFilter = ref('')
const conditionFilter = ref('')
const currentPage = ref(1)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

watch(searchQuery, (newVal) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchDebounced.value = newVal
    currentPage.value = 1
    loadListings()
  }, 350)
})

watch([statusFilter, conditionFilter], () => {
  currentPage.value = 1
  loadListings()
})

// ── Data Loading ───────────────────────────────────────────────────────────────
async function loadListings() {
  await adminStore.fetchListings({
    page: currentPage.value,
    limit: 20,
    search: searchDebounced.value || undefined,
    status: statusFilter.value || undefined,
    condition: conditionFilter.value || undefined,
  })
}

function handlePrevPage() {
  if (adminStore.pagination?.hasPrevPage) {
    currentPage.value--
    loadListings()
  }
}

function handleNextPage() {
  if (adminStore.pagination?.hasNextPage) {
    currentPage.value++
    loadListings()
  }
}

function viewListing(id: string) {
  router.push(`/admin/listings/${id}`)
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800'
    case 'DRAFT':
      return 'bg-surface-100 text-surface-700'
    case 'TRADED':
      return 'bg-blue-100 text-blue-800'
    case 'ARCHIVED':
      return 'bg-amber-100 text-amber-800'
    case 'REMOVED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-surface-100 text-surface-700'
  }
}

const conditionLabel = (condition: string) => {
  switch (condition) {
    case 'NEW':
      return 'New'
    case 'LIKE_NEW':
      return 'Like New'
    case 'GOOD':
      return 'Good'
    case 'FAIR':
      return 'Fair'
    case 'POOR':
      return 'Poor'
    default:
      return condition
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const firstImage = computed(() => (listing: (typeof adminStore.listings)[0]) => {
  const img = listing.images[0]
  if (!img) return null
  return img.imageUrl ? listingService.mediaUrl(img.imageUrl) : null
})

onMounted(() => {
  loadListings()
})
</script>

<template>
  <AdminLayout>
    <template #breadcrumb>
      <span class="text-surface-800 font-medium">Listings</span>
    </template>

    <div class="max-w-7xl">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-surface-800">Listings</h1>
        <p class="text-sm text-surface-500 mt-1">Manage marketplace listings</p>
      </div>

      <!-- Search & Filters -->
      <div class="card mb-6">
        <div class="flex flex-col gap-4">
          <!-- Search -->
          <div class="flex-1">
            <label for="search" class="sr-only">Search listings</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  class="w-4 h-4 text-surface-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                id="search"
                v-model="searchQuery"
                type="text"
                placeholder="Search by title, description, or owner..."
                class="block w-full pl-10 pr-3 py-2.5 border border-surface-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
              />
            </div>
          </div>

          <!-- Filters Row -->
          <div class="flex flex-wrap gap-3">
            <!-- Status Filter -->
            <div class="flex-1 min-w-[180px]">
              <label for="status-filter" class="sr-only">Filter by status</label>
              <select
                id="status-filter"
                v-model="statusFilter"
                class="block w-full px-3 py-2.5 border border-surface-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="TRADED">Traded</option>
                <option value="ARCHIVED">Archived</option>
                <option value="REMOVED">Removed</option>
              </select>
            </div>

            <!-- Condition Filter -->
            <div class="flex-1 min-w-[180px]">
              <label for="condition-filter" class="sr-only">Filter by condition</label>
              <select
                id="condition-filter"
                v-model="conditionFilter"
                class="block w-full px-3 py-2.5 border border-surface-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
              >
                <option value="">All Conditions</option>
                <option value="NEW">New</option>
                <option value="LIKE_NEW">Like New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="adminStore.error" class="card bg-red-50 border-red-200 mb-6">
        <div class="flex items-start gap-3">
          <svg
            class="w-5 h-5 text-red-600 shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-medium text-red-800">{{ adminStore.error }}</p>
          </div>
          <button
            type="button"
            class="text-red-400 hover:text-red-600"
            @click="adminStore.clearError()"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="adminStore.loading" class="card">
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!adminStore.listings.length" class="card text-center py-12">
        <svg
          class="mx-auto h-12 w-12 text-surface-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 class="mt-4 text-sm font-medium text-surface-800">No listings found</h3>
        <p class="mt-1 text-sm text-surface-500">Try changing your search or filters.</p>
      </div>

      <!-- Listings Table (Desktop) -->
      <div v-else class="hidden md:block card overflow-hidden">
        <table class="min-w-full divide-y divide-surface-200">
          <thead class="bg-surface-50">
            <tr>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider"
              >
                Listing
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider"
              >
                Owner
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider"
              >
                Condition
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider"
              >
                Created
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-right text-xs font-semibold text-surface-600 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-surface-200">
            <tr
              v-for="listing in adminStore.listings"
              :key="listing.id"
              class="hover:bg-surface-50 transition"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-lg bg-surface-100 overflow-hidden shrink-0">
                    <img
                      v-if="firstImage(listing)"
                      :src="firstImage(listing)!"
                      :alt="listing.title"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <svg
                        class="w-6 h-6 text-surface-300"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-surface-800 truncate">{{ listing.title }}</p>
                    <p class="text-xs text-surface-500">{{ listing.category.name }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold uppercase overflow-hidden shrink-0"
                  >
                    <span v-if="!listing.owner.profileImage">{{
                      listing.owner.displayName.charAt(0)
                    }}</span>
                    <img
                      v-else
                      :src="listing.owner.profileImage"
                      :alt="listing.owner.displayName"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-surface-800 truncate">
                      {{ listing.owner.displayName }}
                    </p>
                    <p class="text-xs text-surface-500 truncate">@{{ listing.owner.username }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm text-surface-700">{{
                  conditionLabel(listing.condition)
                }}</span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full"
                  :class="statusBadgeClass(listing.status)"
                >
                  {{ listing.status }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm text-surface-600">{{ formatDate(listing.createdAt) }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  type="button"
                  class="text-sm font-medium text-primary-600 hover:text-primary-700 transition"
                  @click="viewListing(listing.id)"
                >
                  View →
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Listings Cards (Mobile) -->
      <div class="md:hidden space-y-4">
        <div v-for="listing in adminStore.listings" :key="listing.id" class="card">
          <div class="flex gap-3">
            <div class="w-20 h-20 rounded-lg bg-surface-100 overflow-hidden shrink-0">
              <img
                v-if="firstImage(listing)"
                :src="firstImage(listing)!"
                :alt="listing.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg
                  class="w-8 h-8 text-surface-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-semibold text-surface-800 mb-1">{{ listing.title }}</h3>
              <p class="text-xs text-surface-500 mb-2">
                {{ listing.category.name }} · {{ conditionLabel(listing.condition) }}
              </p>
              <div class="flex items-center gap-2 mb-2">
                <span
                  class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full"
                  :class="statusBadgeClass(listing.status)"
                >
                  {{ listing.status }}
                </span>
                <span class="text-xs text-surface-500">{{ formatDate(listing.createdAt) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <div
                    class="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold uppercase overflow-hidden"
                  >
                    <span v-if="!listing.owner.profileImage">{{
                      listing.owner.displayName.charAt(0)
                    }}</span>
                    <img
                      v-else
                      :src="listing.owner.profileImage"
                      :alt="listing.owner.displayName"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <span class="text-xs text-surface-600">{{ listing.owner.displayName }}</span>
                </div>
                <button
                  type="button"
                  class="text-sm font-medium text-primary-600 hover:text-primary-700 transition"
                  @click="viewListing(listing.id)"
                >
                  View →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="adminStore.pagination && adminStore.pagination.total > 0" class="card mt-6">
        <div class="flex items-center justify-between">
          <p class="text-sm text-surface-600">
            Showing
            <span class="font-medium">{{
              (adminStore.pagination.page - 1) * adminStore.pagination.limit + 1
            }}</span>
            to
            <span class="font-medium">{{
              Math.min(
                adminStore.pagination.page * adminStore.pagination.limit,
                adminStore.pagination.total,
              )
            }}</span>
            of <span class="font-medium">{{ adminStore.pagination.total }}</span> listings
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              :disabled="!adminStore.pagination.hasPrevPage"
              class="btn-secondary"
              :class="{ 'opacity-50 cursor-not-allowed': !adminStore.pagination.hasPrevPage }"
              @click="handlePrevPage"
            >
              ← Prev
            </button>
            <button
              type="button"
              :disabled="!adminStore.pagination.hasNextPage"
              class="btn-secondary"
              :class="{ 'opacity-50 cursor-not-allowed': !adminStore.pagination.hasNextPage }"
              @click="handleNextPage"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>
