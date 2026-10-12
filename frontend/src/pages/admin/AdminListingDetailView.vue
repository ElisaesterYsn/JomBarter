<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import listingService from '@/services/listingService'
import { avatarUrl } from '@/services/userService'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()

const listingId = route.params.id as string

// ── Moderation Modal ───────────────────────────────────────────────────────────
const showModal = ref(false)
const modalAction = ref<'ACTIVE' | 'REMOVED' | 'ARCHIVED' | 'DRAFT' | null>(null)
const successMessage = ref<string | null>(null)

function openModal(action: 'ACTIVE' | 'REMOVED' | 'ARCHIVED' | 'DRAFT') {
  modalAction.value = action
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  modalAction.value = null
}

async function confirmAction() {
  if (!modalAction.value || !adminStore.currentListing) return

  try {
    await adminStore.updateListingStatus(adminStore.currentListing.id, modalAction.value)
    successMessage.value = `Listing status updated to ${modalAction.value}`
    closeModal()

    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    // Error is handled by the store
    closeModal()
  }
}

// ── Computed ───────────────────────────────────────────────────────────────────
const modalTitle = computed(() => {
  switch (modalAction.value) {
    case 'REMOVED':
      return 'Remove Listing?'
    case 'ACTIVE':
      return 'Restore Listing?'
    case 'ARCHIVED':
      return 'Archive Listing?'
    case 'DRAFT':
      return 'Unpublish Listing?'
    default:
      return 'Confirm Action'
  }
})

const modalMessage = computed(() => {
  switch (modalAction.value) {
    case 'REMOVED':
      return 'This listing will be removed from the marketplace and marked as removed. This action is typically used for policy violations.'
    case 'ACTIVE':
      return 'This listing will become visible on the marketplace again and users will be able to make trade offers.'
    case 'ARCHIVED':
      return 'This listing will be archived and no longer visible on the marketplace. Use this for expired or outdated listings.'
    case 'DRAFT':
      return 'This listing will be unpublished and returned to draft status. It will no longer appear in the marketplace.'
    default:
      return 'Are you sure you want to proceed?'
  }
})

const modalButtonText = computed(() => {
  switch (modalAction.value) {
    case 'REMOVED':
      return 'Remove'
    case 'ACTIVE':
      return 'Restore'
    case 'ARCHIVED':
      return 'Archive'
    case 'DRAFT':
      return 'Unpublish'
    default:
      return 'Confirm'
  }
})

const modalButtonClass = computed(() => {
  if (modalAction.value === 'REMOVED') {
    return 'bg-red-600 hover:bg-red-700 text-white'
  }
  return 'btn-primary'
})

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

const accountStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800'
    case 'SUSPENDED':
      return 'bg-amber-100 text-amber-800'
    case 'BANNED':
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
    month: 'long',
    day: 'numeric',
  })
}

const formatCurrency = (value: number | null) => {
  if (value === null) return 'Not specified'
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(value)
}

const parseArrayField = (field: string | null) => {
  if (!field) return []
  return field
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

const tradePreferenceLabels: Record<string, string> = {
  SPECIFIC_ITEM: 'Specific Item',
  SIMILAR_VALUE: 'Similar Value',
  OPEN_OFFERS: 'Open to Offers',
  MULTIPLE_ITEMS: 'Multiple Items',
}

const exchangeMethodLabels: Record<string, string> = {
  MEETUP: 'Meetup',
  SELF_PICKUP: 'Self Pickup',
  DELIVERY: 'Delivery',
  SHIPPING: 'Shipping',
  ONLINE: 'Online',
}

const availableActions = computed(() => {
  if (!adminStore.currentListing) return []
  const status = adminStore.currentListing.status

  const actions = []
  if (status !== 'ACTIVE')
    actions.push({ label: 'Restore Listing', action: 'ACTIVE', variant: 'primary' })
  if (status !== 'DRAFT')
    actions.push({ label: 'Unpublish', action: 'DRAFT', variant: 'secondary' })
  if (status !== 'ARCHIVED')
    actions.push({ label: 'Archive', action: 'ARCHIVED', variant: 'secondary' })
  if (status !== 'REMOVED') actions.push({ label: 'Remove', action: 'REMOVED', variant: 'danger' })

  return actions
})

onMounted(async () => {
  await adminStore.fetchListing(listingId)
})
</script>

<template>
  <AdminLayout>
    <template #breadcrumb>
      <router-link to="/admin" class="text-surface-500 hover:text-surface-700 transition"
        >Dashboard</router-link
      >
      <span class="text-surface-400 mx-2">/</span>
      <router-link to="/admin/listings" class="text-surface-500 hover:text-surface-700 transition"
        >Listings</router-link
      >
      <span class="text-surface-400 mx-2">/</span>
      <span class="text-surface-800 font-medium">Detail</span>
    </template>

    <div class="max-w-5xl">
      <!-- Loading State -->
      <div v-if="adminStore.loading" class="card">
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="adminStore.error" class="card bg-red-50 border-red-200">
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
        </div>
      </div>

      <!-- Listing Detail -->
      <div v-else-if="adminStore.currentListing">
        <!-- Success Message -->
        <div v-if="successMessage" class="card bg-green-50 border-green-200 mb-6">
          <div class="flex items-start gap-3">
            <svg
              class="w-5 h-5 text-green-600 shrink-0 mt-0.5"
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
            <p class="text-sm font-medium text-green-800">{{ successMessage }}</p>
          </div>
        </div>

        <!-- Header -->
        <div class="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-surface-800">
              {{ adminStore.currentListing.title }}
            </h1>
            <div class="flex items-center gap-2 mt-2">
              <span
                class="inline-flex px-2.5 py-1 text-xs font-medium rounded-full"
                :class="statusBadgeClass(adminStore.currentListing.status)"
              >
                {{ adminStore.currentListing.status }}
              </span>
              <span class="text-sm text-surface-500"
                >Listed {{ formatDate(adminStore.currentListing.createdAt) }}</span
              >
            </div>
          </div>
          <router-link
            :to="`/listings/${adminStore.currentListing.id}`"
            target="_blank"
            class="btn-secondary shrink-0"
          >
            <svg
              class="w-4 h-4 mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            View Public
          </router-link>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Images -->
            <div class="card">
              <h2 class="text-lg font-semibold text-surface-800 mb-4">Images</h2>
              <div
                v-if="adminStore.currentListing.images.length > 0"
                class="grid grid-cols-2 sm:grid-cols-3 gap-3"
              >
                <div
                  v-for="img in adminStore.currentListing.images"
                  :key="img.id"
                  class="aspect-square rounded-lg bg-surface-100 overflow-hidden"
                >
                  <img
                    v-if="img.imageUrl"
                    :src="listingService.mediaUrl(img.imageUrl)!"
                    :alt="`Image ${img.sortOrder + 1}`"
                    class="w-full h-full object-cover"
                  />
                </div>
              </div>
              <p v-else class="text-sm text-surface-500">No images</p>
            </div>

            <!-- Description -->
            <div class="card">
              <h2 class="text-lg font-semibold text-surface-800 mb-3">Description</h2>
              <p class="text-sm text-surface-700 whitespace-pre-wrap">
                {{ adminStore.currentListing.description }}
              </p>
            </div>

            <!-- Details -->
            <div class="card">
              <h2 class="text-lg font-semibold text-surface-800 mb-4">Details</h2>
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt class="text-xs font-medium text-surface-500 uppercase">Category</dt>
                  <dd class="mt-1 text-sm text-surface-800">
                    {{ adminStore.currentListing.category.name }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs font-medium text-surface-500 uppercase">Condition</dt>
                  <dd class="mt-1 text-sm text-surface-800">
                    {{ conditionLabel(adminStore.currentListing.condition) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs font-medium text-surface-500 uppercase">Estimated Value</dt>
                  <dd class="mt-1 text-sm text-surface-800">
                    {{ formatCurrency(adminStore.currentListing.estimatedValue) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs font-medium text-surface-500 uppercase">Location</dt>
                  <dd class="mt-1 text-sm text-surface-800">
                    {{ adminStore.currentListing.location || 'Not specified' }}
                  </dd>
                </div>
                <div class="sm:col-span-2">
                  <dt class="text-xs font-medium text-surface-500 uppercase">Looking For</dt>
                  <dd class="mt-1 text-sm text-surface-800">
                    {{ adminStore.currentListing.lookingFor || 'Open to offers' }}
                  </dd>
                </div>
                <div v-if="adminStore.currentListing.tradePreference" class="sm:col-span-2">
                  <dt class="text-xs font-medium text-surface-500 uppercase">Trade Preferences</dt>
                  <dd class="mt-1 flex flex-wrap gap-2">
                    <span
                      v-for="pref in parseArrayField(adminStore.currentListing.tradePreference)"
                      :key="pref"
                      class="inline-flex px-2 py-1 text-xs font-medium bg-surface-100 text-surface-700 rounded"
                    >
                      {{ tradePreferenceLabels[pref] || pref }}
                    </span>
                  </dd>
                </div>
                <div v-if="adminStore.currentListing.exchangeMethod" class="sm:col-span-2">
                  <dt class="text-xs font-medium text-surface-500 uppercase">Exchange Methods</dt>
                  <dd class="mt-1 flex flex-wrap gap-2">
                    <span
                      v-for="method in parseArrayField(adminStore.currentListing.exchangeMethod)"
                      :key="method"
                      class="inline-flex px-2 py-1 text-xs font-medium bg-surface-100 text-surface-700 rounded"
                    >
                      {{ exchangeMethodLabels[method] || method }}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Owner Info -->
            <div class="card">
              <h2 class="text-lg font-semibold text-surface-800 mb-4">Owner</h2>
              <div class="flex items-start gap-3 mb-4">
                <div
                  class="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold uppercase overflow-hidden shrink-0"
                >
                  <img
                    v-if="adminStore.currentListing.owner.profileImage"
                    :src="avatarUrl(adminStore.currentListing.owner.profileImage) ?? undefined"
                    :alt="adminStore.currentListing.owner.displayName"
                    class="w-full h-full object-cover"
                  />
                  <span v-else>{{ adminStore.currentListing.owner.displayName.charAt(0) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-surface-800">
                    {{ adminStore.currentListing.owner.displayName }}
                  </p>
                  <p class="text-xs text-surface-500">
                    @{{ adminStore.currentListing.owner.username }}
                  </p>
                  <p class="text-xs text-surface-500 truncate">
                    {{ adminStore.currentListing.owner.email }}
                  </p>
                </div>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-surface-600">Account Status</span>
                  <span
                    class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full"
                    :class="accountStatusBadgeClass(adminStore.currentListing.owner.status)"
                  >
                    {{ adminStore.currentListing.owner.status }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-surface-600">User ID</span>
                  <span class="text-surface-500 font-mono text-xs"
                    >{{ adminStore.currentListing.owner.id.slice(0, 8) }}...</span
                  >
                </div>
              </div>
              <router-link
                :to="`/admin/users/${adminStore.currentListing.owner.id}`"
                class="mt-4 btn-secondary w-full justify-center"
              >
                View User Profile
              </router-link>
            </div>

            <!-- Admin Actions -->
            <div class="card">
              <h2 class="text-lg font-semibold text-surface-800 mb-4">Moderation Actions</h2>
              <div class="space-y-2">
                <button
                  v-for="action in availableActions"
                  :key="action.action"
                  type="button"
                  :disabled="adminStore.submitting"
                  :class="[
                    'w-full justify-center',
                    action.variant === 'danger'
                      ? 'bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition disabled:opacity-50'
                      : 'btn-secondary',
                    { 'opacity-50 cursor-not-allowed': adminStore.submitting },
                  ]"
                  @click="openModal(action.action as any)"
                >
                  {{ action.label }}
                </button>
              </div>
            </div>

            <!-- Metadata -->
            <div class="card">
              <h2 class="text-lg font-semibold text-surface-800 mb-4">Metadata</h2>
              <dl class="space-y-3 text-sm">
                <div>
                  <dt class="text-xs font-medium text-surface-500 uppercase">Listing ID</dt>
                  <dd class="mt-1 text-surface-800 font-mono text-xs break-all">
                    {{ adminStore.currentListing.id }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs font-medium text-surface-500 uppercase">Created</dt>
                  <dd class="mt-1 text-surface-800">
                    {{ formatDate(adminStore.currentListing.createdAt) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs font-medium text-surface-500 uppercase">Last Updated</dt>
                  <dd class="mt-1 text-surface-800">
                    {{ formatDate(adminStore.currentListing.updatedAt) }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
        >
          <!-- Background overlay -->
          <div
            class="fixed inset-0 bg-surface-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
            @click="closeModal"
          ></div>

          <!-- Center modal -->
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true"
            >&#8203;</span
          >

          <div
            class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          >
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div
                  class="mx-auto shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10"
                >
                  <svg
                    class="h-6 w-6 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                  <h3 class="text-lg leading-6 font-medium text-surface-900" id="modal-title">
                    {{ modalTitle }}
                  </h3>
                  <div class="mt-2">
                    <p class="text-sm text-surface-500">{{ modalMessage }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-surface-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
              <button
                type="button"
                :disabled="adminStore.submitting"
                :class="[
                  modalButtonClass,
                  'w-full inline-flex justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition sm:w-auto disabled:opacity-50',
                ]"
                @click="confirmAction"
              >
                <span v-if="adminStore.submitting" class="flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
                <span v-else>{{ modalButtonText }}</span>
              </button>
              <button
                type="button"
                :disabled="adminStore.submitting"
                class="mt-3 w-full inline-flex justify-center rounded-lg border border-surface-300 px-4 py-2.5 bg-white text-sm font-medium text-surface-700 hover:bg-surface-50 transition sm:mt-0 sm:w-auto disabled:opacity-50"
                @click="closeModal"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>
