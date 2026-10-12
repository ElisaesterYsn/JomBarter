<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { avatarUrl } from '@/services/userService'

const authStore = useAuthStore()
const router = useRouter()
const sidebarOpen = ref(false)

function handleLogout() {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-surface-50 flex">
    <!-- ── Sidebar ─────────────────────────────────────────────────────────── -->
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/40 z-20 lg:hidden"
      @click="sidebarOpen = false"
    />

    <aside
      class="fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-surface-200 flex flex-col transition-transform duration-300"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center gap-3 px-5 border-b border-surface-200 shrink-0">
        <router-link to="/" class="flex items-center gap-2 group">
          <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
            <svg
              class="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"
              />
            </svg>
          </div>
          <div class="leading-tight">
            <p class="text-sm font-bold text-surface-800 group-hover:text-primary-700 transition">
              JomBarter
            </p>
            <p class="text-[10px] text-surface-400 uppercase tracking-widest">Admin</p>
          </div>
        </router-link>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto py-4 px-3">
        <p class="text-[10px] font-semibold text-surface-400 uppercase tracking-widest px-3 mb-2">
          Management
        </p>
        <ul class="space-y-0.5">
          <li>
            <router-link
              to="/admin"
              :class="
                $route.name === 'admin-dashboard'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
              "
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition"
              @click="sidebarOpen = false"
            >
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Dashboard
            </router-link>
          </li>
          <li>
            <router-link
              to="/admin/users"
              :class="
                String($route.name).startsWith('admin-users')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
              "
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition"
              @click="sidebarOpen = false"
            >
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Users
            </router-link>
          </li>
        </ul>

        <p
          class="text-[10px] font-semibold text-surface-400 uppercase tracking-widest px-3 mt-6 mb-2"
        >
          Content
        </p>
        <ul class="space-y-0.5">
          <li>
            <router-link
              to="/admin/listings"
              :class="
                String($route.name).startsWith('admin-listings')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
              "
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition"
              @click="sidebarOpen = false"
            >
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
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              Listings
            </router-link>
          </li>
        </ul>

        <p
          class="text-[10px] font-semibold text-surface-400 uppercase tracking-widest px-3 mt-6 mb-2"
        >
          Coming Soon
        </p>
        <ul class="space-y-0.5">
          <li v-for="item in ['Reports', 'Categories', 'Settings']" :key="item">
            <span
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-surface-300 cursor-not-allowed select-none"
            >
              <svg
                class="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" stroke-width="2" />
                <path stroke-linecap="round" stroke-width="2" d="M12 8v4m0 4h.01" />
              </svg>
              {{ item }}
            </span>
          </li>
        </ul>
      </nav>

      <!-- User footer -->
      <div class="shrink-0 border-t border-surface-200 px-4 py-3 flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold uppercase overflow-hidden shrink-0"
        >
          <img
            v-if="authStore.user?.profileImage"
            :src="avatarUrl(authStore.user.profileImage) ?? undefined"
            :alt="authStore.user.displayName"
            class="w-full h-full object-cover"
          />
          <span v-else>{{ authStore.user?.displayName?.charAt(0) ?? '?' }}</span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold text-surface-800 truncate">
            {{ authStore.user?.displayName }}
          </p>
          <p class="text-[10px] text-surface-400 truncate">{{ authStore.user?.email }}</p>
        </div>
        <button
          type="button"
          class="shrink-0 text-surface-400 hover:text-red-600 transition"
          title="Sign out"
          @click="handleLogout"
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
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </aside>

    <!-- ── Main area ───────────────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col lg:ml-64 min-w-0">
      <!-- Top bar -->
      <header
        class="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10"
      >
        <!-- Mobile menu button -->
        <button
          type="button"
          class="lg:hidden p-2 rounded-md text-surface-500 hover:text-surface-900 hover:bg-surface-100 transition"
          aria-label="Open menu"
          @click="sidebarOpen = !sidebarOpen"
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
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <!-- Breadcrumb / page title (slot) -->
        <div class="flex items-center gap-2 text-sm text-surface-500 flex-1 ml-2 lg:ml-0">
          <slot name="breadcrumb" />
        </div>

        <!-- Back to marketplace -->
        <router-link
          to="/"
          class="flex items-center gap-1.5 text-xs text-surface-500 hover:text-primary-700 transition px-3 py-1.5 rounded-lg hover:bg-surface-50"
        >
          <svg
            class="w-3.5 h-3.5"
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
          Marketplace
        </router-link>
      </header>

      <!-- Page content -->
      <main class="flex-1 p-4 sm:p-6 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
