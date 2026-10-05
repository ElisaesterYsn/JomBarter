<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const form = reactive({ displayName: '', email: '', password: '' })
const fieldErrors = reactive({ displayName: '', email: '', password: '' })
const showPassword = ref(false)
const successMessage = ref('')

function validateField(field: keyof typeof form) {
  switch (field) {
    case 'displayName':
      if (!form.displayName) fieldErrors.displayName = 'Display name is required.'
      else if (form.displayName.length < 2)
        fieldErrors.displayName = 'Must be at least 2 characters.'
      else if (form.displayName.length > 50)
        fieldErrors.displayName = 'Must be at most 50 characters.'
      else fieldErrors.displayName = ''
      break
    case 'email':
      if (!form.email) fieldErrors.email = 'Email address is required.'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        fieldErrors.email = 'Please enter a valid email address.'
      else fieldErrors.email = ''
      break
    case 'password':
      if (!form.password) fieldErrors.password = 'Password is required.'
      else if (form.password.length < 8)
        fieldErrors.password = 'Password must be at least 8 characters.'
      else fieldErrors.password = ''
      break
  }
}

function validateAll(): boolean {
  validateField('displayName')
  validateField('email')
  validateField('password')
  return !fieldErrors.displayName && !fieldErrors.email && !fieldErrors.password
}

async function handleSubmit() {
  authStore.clearError()
  if (!validateAll()) return
  try {
    const result = await authStore.register({
      email: form.email,
      password: form.password,
      displayName: form.displayName,
    })
    successMessage.value = `Welcome, ${result.user.displayName}! Your account has been created.`
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
          <h1 class="mt-3 text-2xl font-semibold text-surface-800">Create your account</h1>
          <p class="mt-1 text-sm text-surface-500">Join the community and start bartering today</p>
        </div>

        <!-- Success state -->
        <div
          v-if="successMessage"
          class="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3"
          role="alert"
        >
          <svg
            class="mt-0.5 w-5 h-5 text-green-600 shrink-0"
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
          <div>
            <p class="text-sm font-medium text-green-800">{{ successMessage }}</p>
            <p class="mt-1 text-sm text-green-700">
              <router-link to="/login" class="font-semibold underline hover:no-underline">
                Sign in to your account →
              </router-link>
            </p>
          </div>
        </div>

        <!-- Error banner -->
        <div
          v-if="authStore.error && !successMessage"
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
        <form v-if="!successMessage" novalidate @submit.prevent="handleSubmit">
          <!-- Display Name -->
          <div class="mb-5">
            <label for="displayName" class="form-label">
              Display name <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="displayName"
              v-model.trim="form.displayName"
              type="text"
              autocomplete="name"
              placeholder="e.g. Eli"
              class="form-input"
              :class="{
                'border-red-400 focus:ring-red-400 focus:border-red-400': fieldErrors.displayName,
              }"
              :aria-invalid="!!fieldErrors.displayName"
              :aria-describedby="fieldErrors.displayName ? 'displayName-error' : undefined"
              @blur="validateField('displayName')"
            />
            <p
              v-if="fieldErrors.displayName"
              id="displayName-error"
              class="mt-1 text-xs text-red-600"
            >
              {{ fieldErrors.displayName }}
            </p>
          </div>

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
          <div class="mb-5">
            <label for="password" class="form-label">
              Password <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="At least 8 characters"
                class="form-input pr-10"
                :class="{
                  'border-red-400 focus:ring-red-400 focus:border-red-400': fieldErrors.password,
                }"
                :aria-invalid="!!fieldErrors.password"
                :aria-describedby="fieldErrors.password ? 'password-error' : 'password-hint'"
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
            <p v-else id="password-hint" class="mt-1 text-xs text-surface-400">
              Minimum 8 characters
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
            {{ authStore.loading ? 'Creating account…' : 'Create account' }}
          </button>
        </form>

        <!-- Footer link -->
        <p class="mt-6 text-center text-sm text-surface-500">
          Already have an account?
          <router-link to="/login" class="text-primary-600 hover:text-primary-700 font-medium">
            Sign in
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
