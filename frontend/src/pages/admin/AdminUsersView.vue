<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { avatarUrl } from '@/services/userService'

const adminStore = useAdminStore()

const search = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

function load(page = 1) {
  currentPage.value = page
  adminStore.fetchUsers({
    page,
    limit: 20,
    search: search.value || undefined,
    role: roleFilter.value || undefined,
    status: statusFilter.value || undefined,
  })
}

function onSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => load(1), 350)
}

watch([roleFilter, statusFilter], () => load(1))

onMounted(() => load())

function statusClass(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    SUSPENDED: 'bg-amber-100 text-amber-800',
    BANNED: 'bg-red-100 text-red-800',
  }
  return map[status] ?? 'bg-surface-100 text-surface-700'
}

function roleClass(role: string) {
  return role === 'ADMIN' ? 'bg-primary-100 text-primary-800' : 'bg-surface-100 text-surface-700'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <AdminLayout>
    <template #breadcrumb>
      <span class="text-surface-400">Dashboard</span>
      <svg class="w-3 h-3 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
      <span class="font-medium text-surface-800">Users</span>
    </template>

    <div class="space-y-4">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-surface-800">Users</h1>
          <p class="text-sm text-surface-500 mt-0.5">
            {{ adminStore.pagination?.total.toLocaleString() ?? '—' }} registered users
          </p>
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="adminStore.error"
        class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700"
        role="alert"
      >
        {{ adminStore.error }}
      </div>

      <!-- Filters -->
      <div class="card !p-4 flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none"
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
          <input
            v-model="search"
            type="search"
            placeholder="Search by name, email, or username…"
            class="form-input !pl-9 text-sm"
            @input="onSearch"
          />
        </div>
        <select v-model="roleFilter" class="form-input text-sm w-full sm:w-36">
          <option value="">All roles</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select v-model="statusFilter" class="form-input text-sm w-full sm:w-40">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
      </div>

      <!-- Table -->
      <div class="card !p-0 overflow-hidden">
        <!-- Loading -->
        <div v-if="adminStore.loading" class="p-6 space-y-3">
          <div v-for="n in 5" :key="n" class="h-12 bg-surface-100 rounded-lg animate-pulse"></div>
        </div>

        <!-- Empty -->
        <div v-else-if="adminStore.users.length === 0" class="py-16 text-center">
          <svg
            class="w-10 h-10 text-surface-300 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p class="text-sm text-surface-500">No users found.</p>
        </div>

        <!-- Desktop table -->
        <table
          v-if="!adminStore.loading && adminStore.users.length > 0"
          class="hidden sm:table min-w-full divide-y divide-surface-200"
        >
          <thead class="bg-surface-50">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider"
              >
                User
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider"
              >
                Role
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider"
              >
                Joined
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider"
              >
                Listings
              </th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100">
            <tr
              v-for="user in adminStore.users"
              :key="user.id"
              class="hover:bg-surface-50 transition-colors"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0 overflow-hidden"
                  >
                    <img
                      v-if="user.profileImage"
                      :src="avatarUrl(user.profileImage) ?? undefined"
                      :alt="user.displayName"
                      class="w-full h-full object-cover"
                    />
                    <span v-else>{{ user.displayName.charAt(0) }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-surface-800">{{ user.displayName }}</p>
                    <p class="text-xs text-surface-400">@{{ user.username }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-surface-600">{{ user.email }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  :class="roleClass(user.role)"
                  >{{ user.role }}</span
                >
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  :class="statusClass(user.status)"
                  >{{ user.status }}</span
                >
              </td>
              <td class="px-4 py-3 text-sm text-surface-500">{{ formatDate(user.createdAt) }}</td>
              <td class="px-4 py-3 text-sm text-surface-600 text-right">{{ user.listingCount }}</td>
              <td class="px-4 py-3 text-right">
                <router-link
                  :to="`/admin/users/${user.id}`"
                  class="text-xs font-semibold text-primary-600 hover:text-primary-800 transition"
                  >View →</router-link
                >
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Mobile cards -->
        <div
          v-if="!adminStore.loading && adminStore.users.length > 0"
          class="sm:hidden divide-y divide-surface-100"
        >
          <div v-for="user in adminStore.users" :key="user.id" class="p-4 flex items-start gap-3">
            <div
              class="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0 overflow-hidden"
            >
              <img
                v-if="user.profileImage"
                :src="avatarUrl(user.profileImage) ?? undefined"
                :alt="user.displayName"
                class="w-full h-full object-cover"
              />
              <span v-else>{{ user.displayName.charAt(0) }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-semibold text-surface-800 truncate">
                  {{ user.displayName }}
                </p>
                <span
                  class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  :class="statusClass(user.status)"
                  >{{ user.status }}</span
                >
              </div>
              <p class="text-xs text-surface-400 truncate">{{ user.email }}</p>
              <p class="text-xs text-surface-400 mt-0.5">
                Joined {{ formatDate(user.createdAt) }} · {{ user.listingCount }} listings
              </p>
            </div>
            <router-link
              :to="`/admin/users/${user.id}`"
              class="text-xs font-semibold text-primary-600 shrink-0"
              >View →</router-link
            >
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="adminStore.pagination && adminStore.pagination.totalPages > 1"
        class="flex items-center justify-between gap-4"
      >
        <p class="text-sm text-surface-500">
          Page {{ adminStore.pagination.page }} of {{ adminStore.pagination.totalPages }} ({{
            adminStore.pagination.total.toLocaleString()
          }}
          users)
        </p>
        <div class="flex gap-2">
          <button
            class="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
            :disabled="!adminStore.pagination.hasPrevPage"
            @click="load(currentPage - 1)"
          >
            ← Prev
          </button>
          <button
            class="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
            :disabled="!adminStore.pagination.hasNextPage"
            @click="load(currentPage + 1)"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>
