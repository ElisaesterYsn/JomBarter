<template>
  <div class="max-w-2xl mx-auto">
    <!-- Page header -->
    <div class="mb-6">
      <router-link
        to="/my-listings"
        class="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-primary-700 transition mb-3"
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to My Listings
      </router-link>
      <h1 class="text-2xl font-bold text-surface-800">Edit listing</h1>
      <p class="mt-1 text-sm text-surface-500">Update your item's details</p>
    </div>

    <!-- Loading skeleton -->
    <div v-if="listingStore.loading" class="card animate-pulse space-y-4">
      <div class="h-6 bg-surface-200 rounded w-1/2"></div>
      <div class="h-24 bg-surface-200 rounded"></div>
      <div class="h-6 bg-surface-200 rounded w-1/3"></div>
      <div class="h-6 bg-surface-200 rounded w-1/4"></div>
    </div>

    <!-- Not found -->
    <div v-else-if="!listingStore.current && !listingStore.loading" class="card text-center py-12">
      <p class="text-surface-600 mb-4">Listing not found.</p>
      <router-link to="/my-listings" class="btn-primary inline-block px-5 py-2">Back</router-link>
    </div>

    <template v-else>
      <!-- Error banner -->
      <div
        v-if="listingStore.error"
        class="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-2"
        role="alert"
      >
        <svg
          class="w-5 h-5 shrink-0 mt-0.5 text-red-500"
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
        {{ listingStore.error }}
      </div>

      <div class="card space-y-6">
        <form novalidate @submit.prevent="handleSubmit">
          <!-- ── 1. Title ──────────────────────────────────────────────── -->
          <div>
            <label for="title" class="form-label">
              Product title <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="title"
              v-model.trim="form.title"
              type="text"
              class="form-input"
              :class="{ 'border-red-400': errors.title }"
              maxlength="120"
              @blur="validate('title')"
            />
            <div class="flex justify-between mt-1">
              <p v-if="errors.title" class="text-xs text-red-600">{{ errors.title }}</p>
              <p class="text-xs text-surface-400 ml-auto">{{ form.title.length }}/120</p>
            </div>
          </div>

          <!-- ── 2. Description ────────────────────────────────────────── -->
          <div>
            <label for="description" class="form-label">
              Description <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <textarea
              id="description"
              v-model.trim="form.description"
              rows="6"
              class="form-input resize-y"
              :class="{ 'border-red-400': errors.description }"
              maxlength="3000"
              @blur="validate('description')"
            ></textarea>
            <div class="flex justify-between mt-1">
              <p v-if="errors.description" class="text-xs text-red-600">{{ errors.description }}</p>
              <p class="text-xs text-surface-400 ml-auto">{{ form.description.length }}/3000</p>
            </div>
          </div>

          <!-- ── 3. Category ───────────────────────────────────────────── -->
          <div>
            <label for="category" class="form-label">
              Category <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="category"
              v-model="form.categoryId"
              class="form-input"
              :class="{ 'border-red-400': errors.categoryId }"
              :disabled="categoriesLoading"
              @blur="validate('categoryId')"
            >
              <option value="" disabled>
                {{ categoriesLoading ? 'Loading categories…' : 'Select a category…' }}
              </option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <p v-if="errors.categoryId" class="mt-1 text-xs text-red-600">
              {{ errors.categoryId }}
            </p>
          </div>

          <!-- ── 4. Condition ──────────────────────────────────────────── -->
          <div>
            <label class="form-label">
              Condition <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <div class="grid grid-cols-5 gap-2">
              <label
                v-for="opt in conditionOptions"
                :key="opt.value"
                class="flex flex-col items-center justify-center gap-1 cursor-pointer rounded-lg border-2 py-2.5 px-1 text-xs font-medium text-center transition"
                :class="
                  form.condition === opt.value
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-surface-200 text-surface-600 hover:border-primary-400'
                "
              >
                <input
                  type="radio"
                  :value="opt.value"
                  v-model="form.condition"
                  class="sr-only"
                  @change="errors.condition = ''"
                />
                <span class="text-base" aria-hidden="true">{{ opt.emoji }}</span>
                {{ opt.label }}
              </label>
            </div>
            <p v-if="errors.condition" class="mt-1 text-xs text-red-600">{{ errors.condition }}</p>
          </div>

          <!-- ── 5. Location ───────────────────────────────────────────── -->
          <div>
            <label for="location" class="form-label">
              Location
              <span class="text-surface-400 font-normal text-xs">(optional)</span>
            </label>
            <input
              id="location"
              v-model.trim="form.location"
              type="text"
              class="form-input"
              maxlength="120"
            />
          </div>

          <!-- ── 6. Existing images ─────────────────────────────────────── -->
          <div v-if="listingStore.current?.images.length">
            <label class="form-label">Current photos</label>
            <div class="grid grid-cols-4 gap-2 mt-1">
              <div
                v-for="(item, idx) in listingStore.current.images"
                :key="item.id"
                class="relative rounded-lg overflow-hidden bg-surface-100 aspect-square group"
              >
                <img
                  v-if="item.imageUrl"
                  :src="mediaUrl(item.imageUrl)"
                  alt="Listing photo"
                  class="w-full h-full object-cover"
                />
                <span
                  v-if="idx === 0"
                  class="absolute bottom-1 left-1 text-[10px] font-semibold bg-primary-700 text-white px-1.5 py-0.5 rounded"
                  >Cover</span
                >
                <button
                  type="button"
                  class="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs"
                  :disabled="deletingMediaId === item.id"
                  :aria-label="`Delete photo`"
                  @click.stop="handleDeleteMedia(item.id)"
                >
                  <svg
                    v-if="deletingMediaId === item.id"
                    class="w-3 h-3 animate-spin"
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
                  <span v-else>✕</span>
                </button>
              </div>
            </div>
          </div>

          <!-- ── 7. Add new images ──────────────────────────────────────── -->
          <div>
            <label class="form-label">
              Add more photos
              <span class="text-surface-400 font-normal text-xs">
                (optional — {{ availableSlots }} slot{{
                  availableSlots === 1 ? '' : 's'
                }}
                remaining)
              </span>
            </label>
            <div
              v-if="availableSlots > 0"
              class="mt-1 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition"
              :class="
                isDragging
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-surface-300 hover:border-primary-400 hover:bg-primary-50/40'
              "
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
              @click="fileInputRef?.click()"
            >
              <p class="text-sm text-surface-600">
                Drag &amp; drop photos, or <span class="text-primary-600 font-medium">browse</span>
              </p>
              <p class="mt-1 text-xs text-surface-400">JPEG, PNG, WebP, GIF · Max 10 MB each</p>
              <input
                ref="fileInputRef"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                class="sr-only"
                @change="handleFileChange"
              />
            </div>
            <p v-else class="mt-1 text-xs text-surface-400">
              Maximum 8 photos reached. Delete existing photos to add more.
            </p>
            <p v-if="errors.images" class="mt-1 text-xs text-red-600">{{ errors.images }}</p>

            <!-- New images preview -->
            <div v-if="newImageFiles.length" class="mt-3 grid grid-cols-4 gap-2">
              <div
                v-for="(item, i) in newImageFiles"
                :key="i"
                class="relative rounded-lg overflow-hidden bg-surface-100 aspect-square group"
              >
                <img :src="item.preview" :alt="item.file.name" class="w-full h-full object-cover" />
                <button
                  type="button"
                  class="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs"
                  :aria-label="`Remove ${item.file.name}`"
                  @click.stop="removeNewFile(i)"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <!-- ── 8. Looking For ─────────────────────────────────────────── -->
          <div>
            <label for="lookingFor" class="form-label">
              What are you looking for?
              <span class="text-surface-400 font-normal text-xs">(optional)</span>
            </label>
            <label class="flex items-center gap-2 mb-3 cursor-pointer select-none">
              <input
                type="checkbox"
                v-model="openToOffers"
                class="w-4 h-4 accent-primary-600"
                @change="onOpenToOffersChange"
              />
              <span class="text-sm text-surface-700 font-medium">Open to reasonable offers</span>
            </label>
            <textarea
              id="lookingFor"
              v-model.trim="form.lookingFor"
              rows="3"
              placeholder='e.g. "Looking for a Samsung S23 or similar Android phone."'
              class="form-input resize-y"
              :class="{ 'border-red-400': errors.lookingFor, 'opacity-50': openToOffers }"
              :disabled="openToOffers"
              maxlength="1000"
              @blur="validate('lookingFor')"
            ></textarea>
            <div class="flex justify-between mt-1">
              <p v-if="errors.lookingFor" class="text-xs text-red-600">{{ errors.lookingFor }}</p>
              <p class="text-xs text-surface-400 ml-auto">{{ form.lookingFor.length }}/1000</p>
            </div>
          </div>

          <!-- ── Submit ─────────────────────────────────────────────────── -->
          <div class="flex flex-col sm:flex-row gap-3 pt-2 border-t border-surface-100">
            <router-link to="/my-listings" class="btn-secondary flex-1 py-2.5 text-center">
              Cancel
            </router-link>
            <button
              type="submit"
              class="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="listingStore.submitting"
            >
              <svg
                v-if="listingStore.submitting"
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
              {{ listingStore.submitting ? 'Saving…' : 'Save changes' }}
            </button>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useListingStore } from '@/stores/listing'
import listingService, { type Category, type ListingCondition } from '@/services/listingService'

const route = useRoute()
const router = useRouter()
const listingStore = useListingStore()
const id = route.params.id as string

// ── Load listing + categories on mount ───────────────────────────────────────
const categories = ref<Category[]>([])
const categoriesLoading = ref(true)

onMounted(async () => {
  listingStore.clearCurrent()
  await listingStore.fetchOne(id)
  try {
    categories.value = await listingService.getCategories()
  } catch {
    /* non-fatal */
  } finally {
    categoriesLoading.value = false
  }
})

// ── Form ──────────────────────────────────────────────────────────────────────
const form = reactive({
  title: '',
  description: '',
  categoryId: '',
  condition: '' as ListingCondition | '',
  location: '',
  lookingFor: '',
})

const errors = reactive({
  title: '',
  description: '',
  categoryId: '',
  condition: '',
  lookingFor: '',
  images: '',
})

const openToOffers = ref(false)

const conditionOptions = [
  { value: 'NEW', label: 'New', emoji: '✨' },
  { value: 'LIKE_NEW', label: 'Like New', emoji: '🌟' },
  { value: 'GOOD', label: 'Good', emoji: '👍' },
  { value: 'FAIR', label: 'Fair', emoji: '🔧' },
  { value: 'POOR', label: 'Poor', emoji: '⚠️' },
]

// Populate form once the listing loads
watch(
  () => listingStore.current,
  (listing) => {
    if (!listing) return
    form.title = listing.title
    form.description = listing.description
    form.categoryId = listing.categoryId
    form.condition = listing.condition
    form.location = listing.location ?? ''
    const lf = listing.lookingFor ?? ''
    form.lookingFor = lf
    openToOffers.value = lf === 'Open to reasonable offers'
  },
  { immediate: true },
)

function onOpenToOffersChange() {
  if (openToOffers.value) {
    form.lookingFor = 'Open to reasonable offers'
    errors.lookingFor = ''
  } else {
    form.lookingFor = ''
  }
}

// ── Image management ──────────────────────────────────────────────────────────
interface ImageItem {
  file: File
  preview: string
}
const newImageFiles = ref<ImageItem[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const deletingMediaId = ref<string | null>(null)

const MAX_IMAGES = 8
const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const existingCount = computed(() => listingStore.current?.images.length ?? 0)
const availableSlots = computed(() =>
  Math.max(0, MAX_IMAGES - existingCount.value - newImageFiles.value.length),
)

function addFiles(raw: FileList | File[]) {
  errors.images = ''
  for (const file of Array.from(raw)) {
    if (availableSlots.value <= 0) {
      errors.images = `Maximum ${MAX_IMAGES} photos total.`
      break
    }
    if (!ALLOWED.includes(file.type)) {
      errors.images = `"${file.name}" is not an accepted image type.`
      continue
    }
    if (file.size > MAX_BYTES) {
      errors.images = `"${file.name}" exceeds the 10 MB limit.`
      continue
    }
    newImageFiles.value.push({ file, preview: URL.createObjectURL(file) })
  }
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) addFiles(input.files)
  input.value = ''
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  if (e.dataTransfer?.files) addFiles(e.dataTransfer.files)
}

function removeNewFile(index: number) {
  URL.revokeObjectURL(newImageFiles.value[index].preview)
  newImageFiles.value.splice(index, 1)
}

async function handleDeleteMedia(mediaId: string) {
  deletingMediaId.value = mediaId
  await listingStore.deleteMedia(id, mediaId)
  deletingMediaId.value = null
}

function mediaUrl(filename: string | null | undefined) {
  return listingService.mediaUrl(filename) ?? ''
}

onUnmounted(() => newImageFiles.value.forEach((i) => URL.revokeObjectURL(i.preview)))

// ── Validation ────────────────────────────────────────────────────────────────
function validate(field: keyof typeof errors) {
  switch (field) {
    case 'title':
      if (!form.title) errors.title = 'Product title is required.'
      else if (form.title.length < 3) errors.title = 'Must be at least 3 characters.'
      else if (form.title.length > 120) errors.title = 'Must be at most 120 characters.'
      else errors.title = ''
      break
    case 'description':
      if (!form.description) errors.description = 'Description is required.'
      else if (form.description.length < 10) errors.description = 'Must be at least 10 characters.'
      else if (form.description.length > 3000)
        errors.description = 'Must be at most 3000 characters.'
      else errors.description = ''
      break
    case 'categoryId':
      errors.categoryId = form.categoryId ? '' : 'Please select a category.'
      break
    case 'condition':
      errors.condition = form.condition ? '' : 'Please select a condition.'
      break
    case 'lookingFor':
      errors.lookingFor = form.lookingFor.length > 1000 ? 'Must be at most 1000 characters.' : ''
      break
  }
}

function validateAll(): boolean {
  validate('title')
  validate('description')
  validate('categoryId')
  validate('condition')
  validate('lookingFor')
  return !Object.values(errors).some(Boolean)
}

// ── Submit ────────────────────────────────────────────────────────────────────
async function handleSubmit() {
  listingStore.clearError()
  if (!validateAll()) return

  try {
    await listingStore.update(
      id,
      {
        title: form.title,
        description: form.description,
        categoryId: form.categoryId,
        condition: form.condition as ListingCondition,
        location: form.location || undefined,
        lookingFor: form.lookingFor || undefined,
      },
      newImageFiles.value.map((i) => i.file),
    )
    router.push('/my-listings')
  } catch {
    // error shown via banner
  }
}
</script>
