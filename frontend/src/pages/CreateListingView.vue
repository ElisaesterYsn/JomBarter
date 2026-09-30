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
      <h1 class="text-2xl font-bold text-surface-800">Add a new listing</h1>
      <p class="mt-1 text-sm text-surface-500">
        Describe your item so others know what you're offering
      </p>
    </div>

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
        <!-- ── 1. Product Title ──────────────────────────────────────────── -->
        <div>
          <label for="title" class="form-label">
            Product title <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="title"
            v-model.trim="form.title"
            type="text"
            placeholder='e.g. "iPhone 13 128GB"'
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

        <!-- ── 2. Product Description ────────────────────────────────────── -->
        <div>
          <label for="description" class="form-label">
            Description <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <p class="text-xs text-surface-400 mb-2">
            Include: what the item is, how long it's been used, reason for trading, any defects,
            accessories included.
          </p>
          <textarea
            id="description"
            v-model.trim="form.description"
            rows="6"
            placeholder='e.g. "Used iPhone 13 128GB. Fully functional with minor scratches on the frame. Battery health 87%. Comes with original box and charging cable."'
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

        <!-- ── 3. Category ──────────────────────────────────────────────── -->
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
          <p v-if="errors.categoryId" class="mt-1 text-xs text-red-600">{{ errors.categoryId }}</p>
        </div>

        <!-- ── 4. Condition ─────────────────────────────────────────────── -->
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

        <!-- ── 5. Location ──────────────────────────────────────────────── -->
        <div>
          <label for="location" class="form-label">
            Location
            <span class="text-surface-400 font-normal text-xs"
              >(optional — city/area only, not full address)</span
            >
          </label>
          <input
            id="location"
            v-model.trim="form.location"
            type="text"
            placeholder='e.g. "Kota Kinabalu, Sabah"'
            class="form-input"
            maxlength="120"
          />
        </div>

        <!-- ── 6. Images ────────────────────────────────────────────────── -->
        <div>
          <label class="form-label">
            Photos
            <span class="text-surface-400 font-normal text-xs"
              >(optional — up to 8 images, max 10 MB each)</span
            >
          </label>
          <div
            class="mt-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition"
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
            <svg
              class="mx-auto w-10 h-10 text-surface-300 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p class="text-sm text-surface-600">
              Drag &amp; drop photos here, or
              <span class="text-primary-600 font-medium">browse</span>
            </p>
            <p class="mt-1 text-xs text-surface-400">
              Upload clear photos showing the actual condition of your item. JPEG, PNG, WebP, GIF ·
              Max 10 MB each · {{ imageFiles.length }}/8 added
            </p>
            <input
              ref="fileInputRef"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              class="sr-only"
              @change="handleFileChange"
            />
          </div>
          <p v-if="errors.images" class="mt-1 text-xs text-red-600">{{ errors.images }}</p>

          <!-- Preview grid -->
          <div v-if="imageFiles.length" class="mt-3 grid grid-cols-4 gap-2">
            <div
              v-for="(item, i) in imageFiles"
              :key="i"
              class="relative rounded-lg overflow-hidden bg-surface-100 aspect-square group"
            >
              <img :src="item.preview" :alt="item.file.name" class="w-full h-full object-cover" />
              <!-- First image badge -->
              <span
                v-if="i === 0"
                class="absolute bottom-1 left-1 text-[10px] font-semibold bg-primary-700 text-white px-1.5 py-0.5 rounded"
                >Cover</span
              >
              <button
                type="button"
                class="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs"
                :aria-label="`Remove ${item.file.name}`"
                @click.stop="removeFile(i)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <!-- ── 7. Looking For ───────────────────────────────────────────── -->
        <div>
          <label for="lookingFor" class="form-label">
            What are you looking for?
            <span class="text-surface-400 font-normal text-xs">(optional)</span>
          </label>
          <p class="text-xs text-surface-400 mb-2">
            Describe what you want in exchange. Be specific or tick "Open to offers".
          </p>

          <!-- Open to offers toggle -->
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

        <!-- ── Submit actions ───────────────────────────────────────────── -->
        <div class="flex flex-col sm:flex-row gap-3 pt-2 border-t border-surface-100">
          <button
            type="submit"
            class="btn-secondary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="listingStore.submitting"
            @click="submitAction = 'draft'"
          >
            <svg
              v-if="listingStore.submitting && submitAction === 'draft'"
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
            Save as Draft
          </button>
          <button
            type="submit"
            class="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="listingStore.submitting"
            @click="submitAction = 'publish'"
          >
            <svg
              v-if="listingStore.submitting && submitAction === 'publish'"
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
            Save &amp; Publish
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useListingStore } from '@/stores/listing'
import listingService, { type Category, type ListingCondition } from '@/services/listingService'

const router = useRouter()
const listingStore = useListingStore()

// ── Categories ────────────────────────────────────────────────────────────────
const categories = ref<Category[]>([])
const categoriesLoading = ref(true)

onMounted(async () => {
  try {
    categories.value = await listingService.getCategories()
  } catch {
    // non-fatal — user sees empty select
  } finally {
    categoriesLoading.value = false
  }
})

// ── Form state ────────────────────────────────────────────────────────────────
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

const submitAction = ref<'draft' | 'publish'>('draft')
const openToOffers = ref(false)

const conditionOptions = [
  { value: 'NEW', label: 'New', emoji: '✨' },
  { value: 'LIKE_NEW', label: 'Like New', emoji: '🌟' },
  { value: 'GOOD', label: 'Good', emoji: '👍' },
  { value: 'FAIR', label: 'Fair', emoji: '🔧' },
  { value: 'POOR', label: 'Poor', emoji: '⚠️' },
]

function onOpenToOffersChange() {
  if (openToOffers.value) {
    form.lookingFor = 'Open to reasonable offers'
    errors.lookingFor = ''
  } else {
    form.lookingFor = ''
  }
}

// ── Images ────────────────────────────────────────────────────────────────────
interface ImageItem {
  file: File
  preview: string
}
const imageFiles = ref<ImageItem[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const MAX_IMAGES = 8
const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function addFiles(raw: FileList | File[]) {
  errors.images = ''
  for (const file of Array.from(raw)) {
    if (imageFiles.value.length >= MAX_IMAGES) {
      errors.images = `Maximum ${MAX_IMAGES} photos allowed.`
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
    imageFiles.value.push({ file, preview: URL.createObjectURL(file) })
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

function removeFile(index: number) {
  URL.revokeObjectURL(imageFiles.value[index].preview)
  imageFiles.value.splice(index, 1)
}

onUnmounted(() => imageFiles.value.forEach((i) => URL.revokeObjectURL(i.preview)))

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
      if (form.lookingFor.length > 1000) errors.lookingFor = 'Must be at most 1000 characters.'
      else errors.lookingFor = ''
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
    const listing = await listingStore.create(
      {
        title: form.title,
        description: form.description,
        categoryId: form.categoryId,
        condition: form.condition as ListingCondition,
        location: form.location || undefined,
        lookingFor: form.lookingFor || undefined,
      },
      imageFiles.value.map((i) => i.file),
    )

    if (submitAction.value === 'publish') {
      await listingStore.publish(listing.id)
    }

    router.push('/my-listings')
  } catch {
    // error displayed via banner
  }
}
</script>
