<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import jbLogo from '@/assets/jb-logo.png'
const authStore = useAuthStore()
const router = useRouter()

const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

onMounted(() => {
  authStore.init()
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
})

function handleOutsideClick(event: MouseEvent) {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    userMenuOpen.value = false
  }
}

function handleLogout() {
  userMenuOpen.value = false
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div id="app" class="min-h-screen bg-surface-50 flex flex-col">
    <!-- ── Navigation bar ─────────────────────────────────────────────────── -->
    <header class="bg-white border-b border-surface-200 shadow-sm sticky top-0 z-50">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Brand -->
          <div class="flex items-center">
            <router-link
              to="/"
              class="flex items-center gap-2 text-2xl font-bold text-primary-700 tracking-tight"
            >
              <img :src="jbLogo" alt="JomBarter Logo" class="h-20 w-20 object-contain" />

              <span>JomBarter</span>
            </router-link>
          </div>

          <!-- Desktop nav links -->
          <div class="hidden md:flex items-center space-x-1">
            <router-link
              to="/"
              class="nav-link"
              :class="{ 'nav-link-active': $route.name === 'home' }"
            >
              Home
            </router-link>
            <router-link
              to="/about"
              class="nav-link"
              :class="{ 'nav-link-active': $route.name === 'about' }"
            >
              About
            </router-link>
          </div>

          <!-- Auth controls -->
          <div class="flex items-center space-x-3">
            <!-- Guest -->
            <template v-if="!authStore.isAuthenticated">
              <router-link
                to="/login"
                class="text-surface-600 hover:text-surface-900 px-3 py-2 rounded-md text-sm font-medium transition"
              >
                Sign in
              </router-link>
              <router-link to="/register" class="btn-primary text-sm px-4 py-2">
                Register
              </router-link>
            </template>

            <!-- Authenticated: user menu -->
            <template v-else>
              <div class="relative" ref="userMenuRef">
                <button
                  type="button"
                  class="flex items-center gap-2 text-sm font-medium text-surface-700 hover:text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md px-2 py-1"
                  :aria-expanded="userMenuOpen"
                  aria-haspopup="true"
                  @click="userMenuOpen = !userMenuOpen"
                >
                  <span
                    class="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-semibold uppercase select-none"
                    aria-hidden="true"
                  >
                    {{ authStore.user?.displayName?.charAt(0) ?? '?' }}
                  </span>
                  <span class="hidden sm:block max-w-[120px] truncate">
                    {{ authStore.user?.displayName }}
                  </span>
                  <svg
                    class="w-4 h-4 text-surface-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>

                <!-- Dropdown -->
                <div
                  v-if="userMenuOpen"
                  class="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg ring-1 ring-surface-200 py-1 z-50"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div class="px-4 py-2 border-b border-surface-100">
                    <p class="text-xs text-surface-400">Signed in as</p>
                    <p class="text-sm font-medium text-surface-800 truncate">
                      {{ authStore.user?.email }}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    class="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition"
                    @click="handleLogout"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </nav>
    </header>

    <!-- ── Page content ───────────────────────────────────────────────────── -->
    <main class="flex-1 max-w-7xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <RouterView />
    </main>

    <!-- ── Footer ─────────────────────────────────────────────────────────── -->
    <footer class="bg-white border-t border-surface-200">
      <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <p class="text-center text-sm text-surface-400">
          © 2026 JomBarter. Community marketplace for bartering goods and services.
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.nav-link {
  @apply text-surface-600 hover:text-surface-900 px-3 py-2 rounded-md text-sm font-medium transition;
}
.nav-link-active {
  @apply text-primary-700 font-semibold;
}
</style>
