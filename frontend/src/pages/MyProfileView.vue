<template>
  <div class="max-w-2xl mx-auto space-y-6">

    <!-- Page header -->
    <div>
      <h1 class="text-2xl font-bold text-surface-800">My Profile</h1>
      <p class="mt-1 text-sm text-surface-500">Manage how others see you on JomBarter</p>
    </div>

    <!-- Error banner -->
    <div v-if="profileStore.error" class="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-2" role="alert">
      <svg class="w-5 h-5 shrink-0 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
      {{ profileStore.error }}
    </div>

    <!-- Loading -->
    <div v-if="profileStore.loading" class="card animate-pulse space-y-4">
      <div class="flex items-center gap-4">
        <div class="w-20 h-20 bg-surface-200 rounded-full shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="h-5 bg-surface-200 rounded w-1/3"></div>
          <div class="h-4 bg-surface-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>

    <template v-else-if="profileStore.myProfile">

      <!-- ── Avatar + identity card ── -->
      <div class="card">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">

          <!-- Avatar area -->
          <div class="relative shrink-0">
            <div class="w-20 h-20 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center">
              <img
                v-if="currentAvatarUrl"
                :src="currentAvatarUrl"
                :alt="profileStore.myProfile.displayName"
                class="w-full h-full object-cover"
                @error="avatarError = true"
              />
              <span v-else class="text-2xl font-bold text-white uppercase select-none">
                {{ avatarInitial(profileStore.myProfile.displayName) }}
              </span>
            </div>
            <!-- Upload button overlay -->
            <label
              class="absolute bottom-0 right-0 w-7 h-7 bg-white border-2 border-surface-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-surface-50 transition shadow-sm"
              title="Change avatar"
              aria-label="Change avatar"
            >
              <svg class="w-3.5 h-3.5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <input type="file" class="sr-only" accept="image/jpeg,image/png,image/webp,image/gif" @change="handleAvatarUpload"/>
            </label>
          </div>

          <!-- Name / username / email -->
          <div class="flex-1 min-w-0">
            <h2 class="text-lg font-bold text-surface-800">{{ profileStore.myProfile.displayName }}</h2>
            <p class="text-sm text-surface-500">@{{ profileStore.myProfile.username }}</p>
            <p class="text-xs text-surface-400 mt-0.5">{{ profileStore.myProfile.email }}</p>
            <p class="text-xs text-surface-400 mt-1">
              Member since {{ memberSince(profileStore.myProfile.createdAt) }}
            </p>
          </div>

          <!-- Remove avatar (only when avatar exists) -->
          <button
            v-if="currentAvatarUrl"
            type="button"
            class="text-xs text-red-500 hover:underline shrink-0 self-start sm:self-auto"
            :disabled="profileStore.submitting"
            @click="handleRemoveAvatar"
          >
            Remove photo
          </button>
        </div>

        <!-- Avatar upload error -->
        <p v-if="avatarUploadError" class="mt-2 text-xs text-red-600">{{ avatarUploadError }}</p>
        <p class="mt-2 text-xs text-surface-400">JPEG, PNG, WebP or GIF · Max 10 MB</p>
      </div>

      <!-- ── Edit form ── -->
      <div class="card">
        <h2 class="text-base font-bold text-surface-800 mb-5">Edit Profile</h2>

        <form novalidate @submit.prevent="handleSubmit" class="space-y-5">

          <!-- Display Name -->
          <div>
            <label for="displayName" class="form-label">
              Display name <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="displayName"
              v-model.trim="form.displayName"
              type="text"
              class="form-input"
              :class="{ 'border-red-400': errors.displayName }"
              maxlength="50"
              @blur="validate('displayName')"
            />
            <div class="flex justify-between mt-1">
              <p v-if="errors.displayName" class="text-xs text-red-600">{{ errors.displayName }}</p>
              <p class="text-xs text-surface-400 ml-auto">{{ form.displayName.length }}/50</p>
            </div>
          </div>

          <!-- Username -->
          <div>
            <label for="username" class="form-label">
              Username <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm pointer-events-none">@</span>
              <input
                id="username"
                v-model.trim="form.username"
                type="text"
                class="form-input pl-7"
                :class="{ 'border-red-400': errors.username }"
                maxlength="30"
                @blur="validate('username')"
              />
            </div>
            <div class="flex justify-between mt-1">
              <p v-if="errors.username" class="text-xs text-red-600">{{ errors.username }}</p>
              <p v-else class="text-xs text-surface-400">Lowercase letters, numbers, and underscores only</p>
              <p class="text-xs text-surface-400 ml-auto">{{ form.username.length }}/30</p>
            </div>
          </div>

          <!-- Bio -->
          <div>
            <label for="bio" class="form-label">
              Bio <span class="text-surface-400 font-normal text-xs">(optional)</span>
            </label>
            <textarea
              id="bio"
              v-model.trim="form.bio"
              rows="3"
              placeholder="Tell others a bit about yourself and what you like to trade..."
              class="form-input resize-y"
              maxlength="300"
            ></textarea>
            <p class="text-xs text-surface-400 mt-1 text-right">{{ form.bio.length }}/300</p>
          </div>

          <!-- Location -->
          <div>
            <label for="location" class="form-label">
              Location <span class="text-surface-400 font-normal text-xs">(optional)</span>
            </label>
            <input
              id="location"
              v-model.trim="form.location"
              type="text"
              placeholder='e.g. "Kota Kinabalu, Sabah"'
              class="form-input"
              maxlength="120"
            />
            <p class="mt-1 text-xs text-surface-400">Use a general area only. Do not enter your full address.</p>
          </div>

          <!-- Success message -->
          <div v-if="saveSuccess" class="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800 flex items-center gap-2">
            <svg class="w-4 h-4 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Profile saved successfully.
          </div>

          <!-- Actions -->
          <div class="flex flex-col-reverse sm:flex-row gap-3 pt-2 border-t border-surface-100">
            <router-link to="/" class="btn-secondary flex-1 py-2.5 text-center text-sm">Cancel</router-link>
            <button
              type="submit"
              class="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              :disabled="profileStore.submitting"
            >
              <svg v-if="profileStore.submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              {{ profileStore.submitting ? 'Saving…' : 'Save Profile' }}
            </button>
          </div>

        </form>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { useProfileStore } from '@/stores/profile'
import userService, { avatarUrl, avatarInitial } from '@/services/userService'

const profileStore = useProfileStore()

const form = reactive({ displayName: '', username: '', bio: '', location: '' })
const errors = reactive({ displayName: '', username: '' })
const saveSuccess = ref(false)
const avatarError = ref(false)
const avatarUploadError = ref('')

// Pre-fill form from loaded profile
watch(
  () => profileStore.myProfile,
  (p) => {
    if (!p) return
    form.displayName = p.displayName
    form.username    = p.username
    form.bio         = p.bio ?? ''
    form.location    = p.location ?? ''
    avatarError.value = false
  },
  { immediate: true },
)

onMounted(() => profileStore.fetchMyProfile())

const currentAvatarUrl = computed(() => {
  if (avatarError.value) return null
  return avatarUrl(profileStore.myProfile?.profileImage)
})

// ── Avatar ────────────────────────────────────────────────────────────────────
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 10 * 1024 * 1024

async function handleAvatarUpload(e: Event) {
  avatarUploadError.value = ''
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!ALLOWED.includes(file.type)) { avatarUploadError.value = 'Accepted formats: JPEG, PNG, WebP, GIF.'; return }
  if (file.size > MAX_BYTES) { avatarUploadError.value = 'File exceeds 10 MB limit.'; return }
  try {
    avatarError.value = false
    await profileStore.uploadAvatar(file)
  } catch { /* error shown via profileStore.error */ }
}

async function handleRemoveAvatar() {
  try { await profileStore.removeAvatar() }
  catch { /* error shown via profileStore.error */ }
}

// ── Validation ────────────────────────────────────────────────────────────────
function validate(field: 'displayName' | 'username') {
  if (field === 'displayName') {
    errors.displayName = !form.displayName ? 'Required.'
      : form.displayName.length < 2 ? 'Min 2 chars.'
      : form.displayName.length > 50 ? 'Max 50 chars.' : ''
  }
  if (field === 'username') {
    errors.username = !form.username ? 'Required.'
      : form.username.length < 2 ? 'Min 2 chars.'
      : form.username.length > 30 ? 'Max 30 chars.'
      : !/^[a-z0-9_]+$/.test(form.username) ? 'Lowercase letters, numbers, underscores only.' : ''
  }
}

// ── Submit ────────────────────────────────────────────────────────────────────
async function handleSubmit() {
  validate('displayName')
  validate('username')
  if (errors.displayName || errors.username) return
  profileStore.clearError()
  saveSuccess.value = false
  try {
    await profileStore.updateProfile({
      displayName: form.displayName,
      username:    form.username,
      bio:         form.bio || null,
      location:    form.location || null,
    })
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch { /* error shown via banner */ }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function memberSince(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
}
</script>
