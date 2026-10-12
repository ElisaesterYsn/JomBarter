<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { avatarUrl } from '@/services/userService'

const route = useRoute()
const adminStore = useAdminStore()
const authStore = useAuthStore()
const id = route.params.id as string

const confirmAction = ref<'ACTIVE' | 'SUSPENDED' | 'BANNED' | null>(null)
const actionSuccess = ref('')

onMounted(() => adminStore.fetchUser(id))

const isSelf = computed(() => authStore.user?.id === id)

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: 'Active', bg: 'bg-green-100', text: 'text-green-800' },
  SUSPENDED: { label: 'Suspended', bg: 'bg-amber-100', text: 'text-amber-800' },
  BANNED: { label: 'Banned', bg: 'bg-red-100', text: 'text-red-800' },
}

function memberSince(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

async function applyStatus(status: 'ACTIVE' | 'SUSPENDED' | 'BANNED') {
  confirmAction.value = null
  actionSuccess.value = ''
  try {
    await adminStore.updateUserStatus(id, status)
    actionSuccess.value = `User status changed to ${status}`
    setTimeout(() => {
      actionSuccess.value = ''
    }, 3000)
  } catch {
    /* shown via adminStore.error */
  }
}
</script>

<template>
  <AdminLayout>
    <template #breadcrumb>
      <router-link to="/admin" class="text-surface-400 hover:text-surface-700 transition"
        >Dashboard</router-link
      >
      <svg class="w-3 h-3 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
      <router-link to="/admin/users" class="text-surface-400 hover:text-surface-700 transition"
        >Users</router-link
      >
      <svg class="w-3 h-3 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
      <span class="font-medium text-surface-800">Detail</span>
    </template>

    <!-- Loading -->
    <div v-if="adminStore.loading" class="card animate-pulse space-y-4">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 bg-surface-200 rounded-full shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="h-5 bg-surface-200 rounded w-1/3"></div>
          <div class="h-4 bg-surface-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>

    <!-- Error / Not found -->
    <div v-else-if="adminStore.error && !adminStore.currentUser" class="card text-center py-14">
      <p class="text-base font-semibold text-surface-800 mb-1">User not found</p>
      <p class="text-sm text-surface-500 mb-5">{{ adminStore.error }}</p>
      <router-link to="/admin/users" class="btn-secondary text-sm px-5 py-2"
        >Back to Users</router-link
      >
    </div>

    <template v-else-if="adminStore.currentUser">
      <div class="space-y-6 max-w-3xl">
        <!-- Success message -->
        <div
          v-if="actionSuccess"
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
          {{ actionSuccess }}
        </div>

        <!-- Error from action -->
        <div
          v-if="adminStore.error"
          class="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"
          role="alert"
        >
          {{ adminStore.error }}
        </div>

        <!-- Profile header card -->
        <div class="card">
          <div class="flex flex-col sm:flex-row gap-5 items-start">
            <!-- Avatar -->
            <div
              class="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-xl font-bold uppercase shrink-0 overflow-hidden"
            >
              <img
                v-if="adminStore.currentUser.profileImage"
                :src="avatarUrl(adminStore.currentUser.profileImage) ?? undefined"
                :alt="adminStore.currentUser.displayName"
                class="w-full h-full object-cover"
              />
              <span v-else>{{ adminStore.currentUser.displayName.charAt(0) }}</span>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <h1 class="text-lg font-bold text-surface-900">
                  {{ adminStore.currentUser.displayName }}
                </h1>
                <span
                  class="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  :class="
                    adminStore.currentUser.role === 'ADMIN'
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-surface-100 text-surface-700'
                  "
                >
                  {{ adminStore.currentUser.role }}
                </span>
                <span
                  class="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  :class="
                    statusConfig[adminStore.currentUser.status]?.bg +
                    ' ' +
                    statusConfig[adminStore.currentUser.status]?.text
                  "
                >
                  {{
                    statusConfig[adminStore.currentUser.status]?.label ??
                    adminStore.currentUser.status
                  }}
                </span>
              </div>
              <p class="text-sm text-surface-500">@{{ adminStore.currentUser.username }}</p>
              <p class="text-sm text-surface-600 mt-0.5">{{ adminStore.currentUser.email }}</p>
              <p v-if="adminStore.currentUser.location" class="text-xs text-surface-400 mt-1">
                📍 {{ adminStore.currentUser.location }}
              </p>
              <p class="text-xs text-surface-400 mt-1">
                Member since {{ memberSince(adminStore.currentUser.createdAt) }}
              </p>
            </div>
          </div>

          <!-- Bio -->
          <div v-if="adminStore.currentUser.bio" class="mt-4 pt-4 border-t border-surface-100">
            <p class="text-sm text-surface-700 leading-relaxed">{{ adminStore.currentUser.bio }}</p>
          </div>

          <!-- Internal IDs (admin only) -->
          <div class="mt-4 pt-4 border-t border-surface-100">
            <p class="text-[10px] font-semibold text-surface-400 uppercase tracking-widest mb-1">
              User ID
            </p>
            <p class="text-xs font-mono text-surface-500 select-all">
              {{ adminStore.currentUser.id }}
            </p>
          </div>
        </div>

        <!-- Stats row -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="card text-center py-4">
            <p class="text-2xl font-bold text-surface-900">
              {{ adminStore.currentUser.listingCount }}
            </p>
            <p class="text-xs text-surface-500 mt-0.5">Total Listings</p>
          </div>
          <div class="card text-center py-4">
            <p class="text-2xl font-bold text-primary-700">
              {{ adminStore.currentUser.activeListingCount }}
            </p>
            <p class="text-xs text-surface-500 mt-0.5">Active Listings</p>
          </div>
          <div class="card text-center py-4">
            <p class="text-2xl font-bold text-surface-900">
              {{
                adminStore.currentUser.offersSentCount + adminStore.currentUser.offersReceivedCount
              }}
            </p>
            <p class="text-xs text-surface-500 mt-0.5">Total Offers</p>
          </div>
          <div class="card text-center py-4">
            <p class="text-2xl font-bold text-green-700">
              {{ adminStore.currentUser.completedTradeCount }}
            </p>
            <p class="text-xs text-surface-500 mt-0.5">Completed Trades</p>
          </div>
        </div>

        <!-- Account Actions -->
        <div class="card">
          <h2 class="text-sm font-bold text-surface-700 mb-4">Account Actions</h2>

          <!-- Self-action warning -->
          <div
            v-if="isSelf"
            class="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex items-center gap-2 mb-4"
          >
            <svg
              class="w-4 h-4 shrink-0 text-amber-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            You cannot change your own account status.
          </div>

          <div v-else class="flex flex-wrap gap-3">
            <!-- Activate -->
            <button
              v-if="adminStore.currentUser.status !== 'ACTIVE'"
              class="btn-primary text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-50"
              :disabled="adminStore.submitting"
              @click="confirmAction = 'ACTIVE'"
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Activate Account
            </button>
            <!-- Suspend -->
            <button
              v-if="adminStore.currentUser.status !== 'SUSPENDED'"
              class="btn-secondary text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-50 !text-amber-700 hover:!bg-amber-50"
              :disabled="adminStore.submitting"
              @click="confirmAction = 'SUSPENDED'"
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
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
              Suspend Account
            </button>
            <!-- Ban -->
            <button
              v-if="adminStore.currentUser.status !== 'BANNED'"
              class="btn-secondary text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-50 !text-red-700 hover:!bg-red-50"
              :disabled="adminStore.submitting"
              @click="confirmAction = 'BANNED'"
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
                  d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728"
                />
              </svg>
              Ban Account
            </button>
          </div>
        </div>

        <!-- View public profile link -->
        <div class="flex justify-end">
          <router-link
            :to="`/users/${adminStore.currentUser.username}`"
            class="text-sm text-primary-600 hover:underline"
            target="_blank"
          >
            View public profile →
          </router-link>
        </div>
      </div>
    </template>

    <!-- ── Confirmation Modal ── -->
    <Teleport to="body">
      <div
        v-if="confirmAction"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        role="dialog"
        aria-modal="true"
      >
        <div class="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
          <h3 class="text-base font-bold text-surface-900">
            {{
              confirmAction === 'ACTIVE'
                ? 'Activate'
                : confirmAction === 'SUSPENDED'
                  ? 'Suspend'
                  : 'Ban'
            }}
            this account?
          </h3>
          <p class="text-sm text-surface-600">
            <template v-if="confirmAction === 'ACTIVE'"
              >This user will be able to log in and use JomBarter again.</template
            >
            <template v-else-if="confirmAction === 'SUSPENDED'"
              >This user will not be able to log in until reactivated.</template
            >
            <template v-else
              >This is a serious action. The user will be permanently banned from
              JomBarter.</template
            >
          </p>
          <div class="flex gap-3 pt-2">
            <button class="btn-secondary flex-1 py-2 text-sm" @click="confirmAction = null">
              Cancel
            </button>
            <button
              class="flex-1 py-2 text-sm font-semibold rounded-lg text-white transition disabled:opacity-50"
              :class="
                confirmAction === 'ACTIVE'
                  ? 'bg-green-600 hover:bg-green-700'
                  : confirmAction === 'SUSPENDED'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-red-600 hover:bg-red-700'
              "
              :disabled="adminStore.submitting"
              @click="applyStatus(confirmAction!)"
            >
              {{ adminStore.submitting ? 'Saving…' : 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>
