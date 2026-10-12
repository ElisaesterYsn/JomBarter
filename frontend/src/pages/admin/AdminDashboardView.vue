<script setup lang="ts">
import { onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import AdminLayout from '@/layouts/AdminLayout.vue'

const adminStore = useAdminStore()

onMounted(() => adminStore.fetchDashboard())
</script>

<template>
  <AdminLayout>
    <template #breadcrumb>
      <span class="font-medium text-surface-800">Dashboard</span>
    </template>

    <!-- Error -->
    <div v-if="adminStore.error" class="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-2" role="alert">
      <svg class="w-5 h-5 shrink-0 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
      {{ adminStore.error }}
    </div>

    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-xl font-bold text-surface-800">Platform Overview</h1>
        <p class="text-sm text-surface-500 mt-0.5">Live statistics from the JomBarter database</p>
      </div>

      <!-- Loading skeleton -->
      <div v-if="adminStore.loading" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="n in 8" :key="n" class="card animate-pulse h-28">
          <div class="h-3 bg-surface-200 rounded w-1/2 mb-3"></div>
          <div class="h-8 bg-surface-200 rounded w-2/3"></div>
        </div>
      </div>

      <!-- Stats -->
      <template v-else-if="adminStore.stats">
        <!-- Users row -->
        <div>
          <h2 class="text-xs font-semibold text-surface-500 uppercase tracking-widest mb-3">Users</h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="card">
              <p class="text-xs font-medium text-surface-500 mb-1">Total Users</p>
              <p class="text-3xl font-bold text-surface-900">{{ adminStore.stats.users.total.toLocaleString() }}</p>
            </div>
            <div class="card">
              <p class="text-xs font-medium text-surface-500 mb-1">Active</p>
              <p class="text-3xl font-bold text-green-700">{{ adminStore.stats.users.active.toLocaleString() }}</p>
            </div>
            <div class="card">
              <p class="text-xs font-medium text-surface-500 mb-1">Suspended</p>
              <p class="text-3xl font-bold text-amber-700">{{ adminStore.stats.users.suspended.toLocaleString() }}</p>
            </div>
            <div class="card">
              <p class="text-xs font-medium text-surface-500 mb-1">Banned</p>
              <p class="text-3xl font-bold text-red-700">{{ adminStore.stats.users.banned.toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <!-- Listings row -->
        <div>
          <h2 class="text-xs font-semibold text-surface-500 uppercase tracking-widest mb-3">Listings</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div class="card">
              <p class="text-xs font-medium text-surface-500 mb-1">Total Listings</p>
              <p class="text-3xl font-bold text-surface-900">{{ adminStore.stats.listings.total.toLocaleString() }}</p>
            </div>
            <div class="card">
              <p class="text-xs font-medium text-surface-500 mb-1">Active</p>
              <p class="text-3xl font-bold text-primary-700">{{ adminStore.stats.listings.active.toLocaleString() }}</p>
            </div>
            <div class="card">
              <p class="text-xs font-medium text-surface-500 mb-1">Draft</p>
              <p class="text-3xl font-bold text-surface-600">{{ adminStore.stats.listings.draft.toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <!-- Offers + Trades row -->
        <div>
          <h2 class="text-xs font-semibold text-surface-500 uppercase tracking-widest mb-3">Trade Activity</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div class="card">
              <p class="text-xs font-medium text-surface-500 mb-1">Total Offers</p>
              <p class="text-3xl font-bold text-surface-900">{{ adminStore.stats.offers.total.toLocaleString() }}</p>
            </div>
            <div class="card">
              <p class="text-xs font-medium text-surface-500 mb-1">Pending Offers</p>
              <p class="text-3xl font-bold text-amber-700">{{ adminStore.stats.offers.pending.toLocaleString() }}</p>
            </div>
            <div class="card">
              <p class="text-xs font-medium text-surface-500 mb-1">Completed Trades</p>
              <p class="text-3xl font-bold text-green-700">{{ adminStore.stats.trades.completed.toLocaleString() }}</p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </AdminLayout>
</template>
