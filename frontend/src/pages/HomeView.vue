<template>
  <div class="space-y-8">
    <!-- Hero Section -->
    <div
      class="text-center py-14 bg-gradient-to-br from-primary-800 via-primary-700 to-amber-600 text-white rounded-2xl shadow-lg"
    >
      <h1 class="text-4xl font-bold mb-4 tracking-tight">Welcome to JomBarter</h1>
      <p class="text-lg text-amber-100 mb-8 max-w-xl mx-auto">
        A community marketplace where you exchange items and services — no money needed.
      </p>
      <div class="flex flex-wrap justify-center gap-4">
        <router-link
          to="/register"
          class="bg-white text-primary-700 hover:bg-amber-50 font-semibold py-3 px-7 rounded-lg transition duration-200 shadow"
        >
          Get Started
        </router-link>
        <router-link
          to="/about"
          class="border-2 border-white/70 text-white hover:bg-white/10 font-medium py-3 px-7 rounded-lg transition duration-200"
        >
          Learn More
        </router-link>
      </div>
    </div>

    <!-- Features Section -->
    <div class="grid md:grid-cols-3 gap-6">
      <div class="card text-center">
        <div
          class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg
            class="w-8 h-8 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
            />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-surface-800 mb-2">No Money Required</h3>
        <p class="text-surface-600">Exchange goods and services directly without using cash</p>
      </div>

      <div class="card text-center">
        <div
          class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg class="w-8 h-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-surface-800 mb-2">Community Driven</h3>
        <p class="text-surface-600">Connect with local community members and build relationships</p>
      </div>

      <div class="card text-center">
        <div
          class="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg class="w-8 h-8 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-surface-800 mb-2">Safe &amp; Secure</h3>
        <p class="text-surface-600">Review system and secure messaging for trusted exchanges</p>
      </div>
    </div>

    <!-- System Status -->
    <div class="card">
      <h2 class="text-xl font-semibold text-surface-800 mb-4">System Status</h2>
      <div class="flex items-center space-x-2">
        <div
          class="w-3 h-3 rounded-full"
          :class="
            healthStatus === 'ok'
              ? 'bg-green-500'
              : healthStatus === 'checking'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-red-500'
          "
        ></div>
        <span class="text-sm text-surface-700">
          Backend API:
          {{
            healthStatus === 'ok'
              ? 'Connected'
              : healthStatus === 'checking'
                ? 'Checking…'
                : 'Disconnected'
          }}
        </span>
      </div>
      <p class="text-sm text-surface-500 mt-2">{{ healthMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiService from '@/services/apiService'

const healthStatus = ref('checking')
const healthMessage = ref('Checking backend connection...')

const checkBackendHealth = async () => {
  try {
    const response = await apiService.get('/health')
    const payload = response.data?.data ?? response.data
    if (payload?.status === 'ok') {
      healthStatus.value = 'ok'
      healthMessage.value = 'Backend is running and healthy'
    } else {
      healthStatus.value = 'error'
      healthMessage.value = 'Backend responded but status is not ok'
    }
  } catch (error) {
    healthStatus.value = 'error'
    healthMessage.value = 'Cannot connect to backend API'
    console.error('Backend health check failed:', error)
  }
}

onMounted(() => {
  checkBackendHealth()
})
</script>
