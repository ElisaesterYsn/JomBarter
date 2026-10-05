import { defineStore } from 'pinia'
import { ref } from 'vue'
import userService, {
  type PrivateProfile,
  type PublicProfile,
  type UpdateProfilePayload,
} from '@/services/userService'
import { useAuthStore } from '@/stores/auth'

export const useProfileStore = defineStore('profile', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const myProfile = ref<PrivateProfile | null>(null)
  const publicProfile = ref<PublicProfile | null>(null)
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref<string | null>(null)

  // ── Actions ────────────────────────────────────────────────────────────────

  async function fetchMyProfile() {
    loading.value = true
    error.value = null
    try {
      myProfile.value = await userService.getMe()
    } catch (err: any) {
      error.value = extractMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function fetchPublicProfile(username: string) {
    loading.value = true
    error.value = null
    publicProfile.value = null
    try {
      publicProfile.value = await userService.getPublicProfile(username)
    } catch (err: any) {
      error.value = extractMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(payload: UpdateProfilePayload): Promise<PrivateProfile> {
    submitting.value = true
    error.value = null
    try {
      const updated = await userService.updateMe(payload)
      myProfile.value = updated
      // Keep auth store in sync so navbar updates immediately
      useAuthStore().updateUser({
        displayName: updated.displayName,
        username: updated.username,
        profileImage: updated.profileImage,
      })
      return updated
    } catch (err: any) {
      error.value = extractMessage(err)
      throw err
    } finally {
      submitting.value = false
    }
  }

  async function uploadAvatar(file: File): Promise<PrivateProfile> {
    submitting.value = true
    error.value = null
    try {
      const updated = await userService.uploadAvatar(file)
      myProfile.value = updated
      useAuthStore().updateUser({ profileImage: updated.profileImage })
      return updated
    } catch (err: any) {
      error.value = extractMessage(err)
      throw err
    } finally {
      submitting.value = false
    }
  }

  async function removeAvatar(): Promise<PrivateProfile> {
    submitting.value = true
    error.value = null
    try {
      const updated = await userService.removeAvatar()
      myProfile.value = updated
      useAuthStore().updateUser({ profileImage: null })
      return updated
    } catch (err: any) {
      error.value = extractMessage(err)
      throw err
    } finally {
      submitting.value = false
    }
  }

  function clearError() { error.value = null }
  function clearPublicProfile() { publicProfile.value = null }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function extractMessage(err: any): string {
    const nested = err?.response?.data?.data ?? err?.response?.data
    if (Array.isArray(nested?.message)) return nested.message.join(', ')
    if (typeof nested?.message === 'string') return nested.message
    return 'An unexpected error occurred.'
  }

  return {
    myProfile, publicProfile, loading, submitting, error,
    fetchMyProfile, fetchPublicProfile, updateProfile,
    uploadAvatar, removeAvatar, clearError, clearPublicProfile,
  }
})
