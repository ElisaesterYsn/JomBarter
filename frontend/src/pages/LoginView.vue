<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const fieldErrors = reactive({ email: '', password: '' })
const showPassword = ref(false)

function validateField(field: keyof typeof form) {
  switch (field) {
    case 'email':
      if (!form.email) {
        fieldErrors.email = 'Email address is required.'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        fieldErrors.email = 'Please enter a valid email address.'
      } else {
        fieldErrors.email = ''
      }
      break
    case 'password':
      fieldErrors.password = form.password ? '' : 'Password is required.'
      break
  }
}

function validateAll(): boolean {
  validateField('email')
  validateField('password')
  return !fieldErrors.email && !fieldErrors.password
}

async function handleSubmit() {
  authStore.clearError()
  if (!validateAll()) return
  try {
    await authStore.login({ email: form.email, password: form.password })
    router.push('/')
  } catch {
    // error surfaced via authStore.error
  }
}
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="card">
        <!-- Header -->
        <div class="text-center mb-8">
          <router-link to="/" class="text-3xl font-bold text-primary-700 tracking-tight"
            >JomBarter</router-link
          >
          <h1 class="mt-3 text-2xl font-semibold text-surface-800">Sign in to your account</h1>
          <p class="mt-1 text-sm text-surface-500">Welcome back — pick up where you left off</p>
        </div>

        <!-- Error banner -->
        <div
          v-if="authStore.error"
          class="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3"
          role="alert"
        >
          <svg
            class="mt-0.5 w-5 h-5 text-red-500 shrink-0"
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
          <p class="text-sm text-red-700">{{ authStore.error }}</p>
        </div>

        <!-- Form -->
        <form novalidate @submit.prevent="handleSubmit">
          <!-- Email -->
          <div class="mb-5">
            <label for="email" class="form-label">
              Email address <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="email"
              v-model.trim="form.email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              class="form-input"
              :class="{
                'border-red-400 focus:ring-red-400 focus:border-red-400': fieldErrors.email,
              }"
              :aria-invalid="!!fieldErrors.email"
              :aria-describedby="fieldErrors.email ? 'email-error' : undefined"
              @blur="validateField('email')"
            />
            <p v-if="fieldErrors.email" id="email-error" class="mt-1 text-xs text-red-600">
              {{ fieldErrors.email }}
            </p>
          </div>

          <!-- Password -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-1">
              <label for="password" class="form-label mb-0">
                Password <span class="text-red-500" aria-hidden="true">*</span>
              </label>
              <span class="text-xs text-surface-400">Forgot password? (coming soon)</span>
            </div>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Your password"
                class="form-input pr-10"
                :class="{
                  'border-red-400 focus:ring-red-400 focus:border-red-400': fieldErrors.password,
                }"
                :aria-invalid="!!fieldErrors.password"
                :aria-describedby="fieldErrors.password ? 'password-error' : undefined"
                @blur="validateField('password')"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-surface-400 hover:text-surface-600"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <svg
                  v-if="!showPassword"
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <svg
                  v-else
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
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                  />
                </svg>
              </button>
            </div>
            <p v-if="fieldErrors.password" id="password-error" class="mt-1 text-xs text-red-600">
              {{ fieldErrors.password }}
            </p>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="w-full btn-primary py-2.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="authStore.loading"
          >
            <svg
              v-if="authStore.loading"
              class="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            {{ authStore.loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <!-- Footer link -->
        <p class="mt-6 text-center text-sm text-surface-500">
          Don't have an account?
          <router-link to="/register" class="text-primary-600 hover:text-primary-700 font-medium">
            Create one
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
