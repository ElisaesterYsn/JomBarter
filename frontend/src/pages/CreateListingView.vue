<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useListingStore } from '@/stores/listing'
import listingService, {
  type Category,
  type ListingCondition,
  serializeCommaList,
} from '@/services/listingService'

const router = useRouter()
const listingStore = useListingStore()

// ── Options ───────────────────────────────────────────────────────────────────
const conditionOptions = [
  { value: 'NEW', label: 'New', emoji: '✨' },
  { value: 'LIKE_NEW', label: 'Like New', emoji: '🌟' },
  { value: 'GOOD', label: 'Good', emoji: '👍' },
  { value: 'FAIR', label: 'Fair', emoji: '🔧' },
  { value: 'POOR', label: 'Poor', emoji: '⚠️' },
]
const tradePreferenceOptions = [
  { value: 'SPECIFIC_ITEM', label: 'Specific item only' },
  { value: 'SIMILAR_VALUE', label: 'Similar value items' },
  { value: 'OPEN_OFFERS', label: 'Open to offers' },
  { value: 'MULTIPLE_ITEMS', label: 'Multiple items for one' },
]
const exchangeMethodOptions = [
  { value: 'MEETUP', label: 'Meet-up', emoji: '🤝' },
  { value: 'SELF_PICKUP', label: 'Self pickup', emoji: '🚶' },
  { value: 'DELIVERY', label: 'Delivery', emoji: '🚗' },
  { value: 'SHIPPING', label: 'Shipping', emoji: '📬' },
  { value: 'ONLINE', label: 'Online/Digital', emoji: '💻' },
]

// ── Categories ────────────────────────────────────────────────────────────────
const categories = ref<Category[]>([])
const categoriesLoading = ref(true)
onMounted(async () => {
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
  estimatedValue: null as number | null,
  location: '',
  lookingFor: '',
  tradePreferences: [] as string[],
  interestedInCategories: [] as string[],
  exchangeMethods: [] as string[],
})
const errors = reactive({
  title: '',
  description: '',
  categoryId: '',
  condition: '',
  estimatedValue: '',
  lookingFor: '',
  images: '',
})
const submitAction = ref<'draft' | 'publish'>('draft')
const openToOffers = ref(false)

function onOpenToOffersChange() {
  if (openToOffers.value) {
    form.lookingFor = 'Open to reasonable offers'
    errors.lookingFor = ''
  } else form.lookingFor = ''
}

// ── Images ────────────────────────────────────────────────────────────────────
interface ImageItem {
  file: File
  preview: string
}
const imageFiles = ref<ImageItem[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const MAX_IMG = 8
const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function addFiles(raw: FileList | File[]) {
  errors.images = ''
  for (const f of Array.from(raw)) {
    if (imageFiles.value.length >= MAX_IMG) {
      errors.images = `Max ${MAX_IMG} photos.`
      break
    }
    if (!ALLOWED.includes(f.type)) {
      errors.images = `"${f.name}" is not an accepted image type.`
      continue
    }
    if (f.size > MAX_BYTES) {
      errors.images = `"${f.name}" exceeds 10 MB.`
      continue
    }
    imageFiles.value.push({ file: f, preview: URL.createObjectURL(f) })
  }
}
function handleFileChange(e: Event) {
  const i = e.target as HTMLInputElement
  if (i.files) addFiles(i.files)
  i.value = ''
}
function handleDrop(e: DragEvent) {
  isDragging.value = false
  if (e.dataTransfer?.files) addFiles(e.dataTransfer.files)
}
function removeFile(i: number) {
  URL.revokeObjectURL(imageFiles.value[i].preview)
  imageFiles.value.splice(i, 1)
}
onUnmounted(() => imageFiles.value.forEach((i) => URL.revokeObjectURL(i.preview)))

// ── Validation ────────────────────────────────────────────────────────────────
function validate(field: keyof typeof errors) {
  switch (field) {
    case 'title':
      errors.title = !form.title
        ? 'Required.'
        : form.title.length < 3
          ? 'Min 3 chars.'
          : form.title.length > 120
            ? 'Max 120 chars.'
            : ''
      break
    case 'description':
      errors.description = !form.description
        ? 'Required.'
        : form.description.length < 10
          ? 'Min 10 chars.'
          : form.description.length > 3000
            ? 'Max 3000 chars.'
            : ''
      break
    case 'categoryId':
      errors.categoryId = form.categoryId ? '' : 'Required.'
      break
    case 'condition':
      errors.condition = form.condition ? '' : 'Required.'
      break
    case 'estimatedValue':
      errors.estimatedValue =
        form.estimatedValue !== null && form.estimatedValue < 0 ? 'Must be ≥ 0.' : ''
      break
    case 'lookingFor':
      errors.lookingFor = form.lookingFor.length > 1000 ? 'Max 1000 chars.' : ''
      break
  }
}
function validateAll() {
  ;(
    ['title', 'description', 'categoryId', 'condition', 'estimatedValue', 'lookingFor'] as const
  ).forEach(validate)
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
        estimatedValue: form.estimatedValue ?? undefined,
        location: form.location || undefined,
        lookingFor: form.lookingFor || undefined,
        tradePreference: serializeCommaList(form.tradePreferences),
        exchangeMethod: serializeCommaList(form.exchangeMethods),
        interestedInCategories: serializeCommaList(form.interestedInCategories),
      },
      imageFiles.value.map((i) => i.file),
    )
    if (submitAction.value === 'publish') await listingStore.publish(listing.id)
    router.push('/my-listings')
  } catch {
    /* banner handles */
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
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
      <h1 class="text-2xl font-bold text-surface-800">Offer Something</h1>
      <p class="mt-1 text-sm text-surface-500">
        Tell the community what you have and what you're looking for in return
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
        <!-- ══ SECTION 1 — BASIC INFORMATION ════════════════════════════════ -->
        <div class="pb-6 border-b border-surface-100">
          <div class="mb-5">
            <h2 class="text-base font-bold text-surface-800">Basic Information</h2>
            <p class="text-sm text-surface-500 mt-0.5">Tell others what you're offering.</p>
          </div>

          <!-- Title -->
          <div class="mb-5">
            <label for="title" class="form-label"
              >Product Name <span class="text-red-500" aria-hidden="true">*</span></label
            >
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

          <!-- Description -->
          <div class="mb-5">
            <label for="description" class="form-label"
              >Description <span class="text-red-500" aria-hidden="true">*</span></label
            >
            <p class="text-xs text-surface-400 mb-2">
              Include: what it is, how long used, reason for trading, defects, accessories.
            </p>
            <textarea
              id="description"
              v-model.trim="form.description"
              rows="5"
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

          <!-- Category + Condition row -->
          <div class="grid sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label for="category" class="form-label"
                >Category <span class="text-red-500" aria-hidden="true">*</span></label
              >
              <select
                id="category"
                v-model="form.categoryId"
                class="form-input"
                :class="{ 'border-red-400': errors.categoryId }"
                :disabled="categoriesLoading"
                @blur="validate('categoryId')"
              >
                <option value="" disabled>
                  {{ categoriesLoading ? 'Loading…' : 'Select category…' }}
                </option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
              <p v-if="errors.categoryId" class="mt-1 text-xs text-red-600">
                {{ errors.categoryId }}
              </p>
            </div>
            <div>
              <label class="form-label"
                >Condition <span class="text-red-500" aria-hidden="true">*</span></label
              >
              <div class="grid grid-cols-5 gap-1.5">
                <label
                  v-for="opt in conditionOptions"
                  :key="opt.value"
                  class="flex flex-col items-center justify-center gap-0.5 cursor-pointer rounded-lg border-2 py-2 text-[11px] font-medium text-center transition"
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
                  <span class="text-sm" aria-hidden="true">{{ opt.emoji }}</span
                  >{{ opt.label }}
                </label>
              </div>
              <p v-if="errors.condition" class="mt-1 text-xs text-red-600">
                {{ errors.condition }}
              </p>
            </div>
          </div>

          <!-- Estimated Value + Location row — Item Details -->
          <p class="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3 mt-1">
            Item Details
          </p>
          <p class="text-xs text-surface-400 mb-3">
            Help other traders understand the condition and approximate value. The estimated value
            is a guide, not a selling price.
          </p>
          <div class="grid sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label for="estimatedValue" class="form-label"
                >Estimated value
                <span class="text-surface-400 font-normal text-xs">(optional)</span></label
              >
              <div class="relative">
                <span
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm font-medium pointer-events-none"
                  >RM</span
                >
                <input
                  id="estimatedValue"
                  v-model.number="form.estimatedValue"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  class="form-input pl-10"
                  :class="{ 'border-red-400': errors.estimatedValue }"
                  @blur="validate('estimatedValue')"
                />
              </div>
              <p v-if="errors.estimatedValue" class="mt-1 text-xs text-red-600">
                {{ errors.estimatedValue }}
              </p>
              <p v-else class="mt-1 text-xs text-surface-400">Estimated, not the selling price</p>
            </div>
            <div>
              <label for="location" class="form-label"
                >Location
                <span class="text-surface-400 font-normal text-xs">(optional)</span></label
              >
              <input
                id="location"
                v-model.trim="form.location"
                type="text"
                placeholder='e.g. "Kota Kinabalu, Sabah"'
                class="form-input"
                maxlength="120"
              />
              <p class="mt-1 text-xs text-surface-400">City/area only — no full address</p>
            </div>
          </div>

          <!-- Photos sub-heading -->
          <p class="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Photos</p>
          <p class="text-xs text-surface-400 mb-3">
            Show the actual condition of what you're offering. The first photo is used as the cover
            image.
          </p>
          <div>
            <label class="form-label"
              >Photos
              <span class="text-surface-400 font-normal text-xs"
                >(optional — up to 8, max 10 MB each)</span
              ></label
            >
            <div
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
              <svg
                class="mx-auto w-9 h-9 text-surface-300 mb-2"
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
                Drag &amp; drop, or <span class="text-primary-600 font-medium">browse</span>
              </p>
              <p class="mt-1 text-xs text-surface-400">
                JPEG, PNG, WebP, GIF · {{ imageFiles.length }}/8
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
            <div v-if="imageFiles.length" class="mt-3 grid grid-cols-4 gap-2">
              <div
                v-for="(item, i) in imageFiles"
                :key="i"
                class="relative rounded-lg overflow-hidden bg-surface-100 aspect-square group"
              >
                <img :src="item.preview" :alt="item.file.name" class="w-full h-full object-cover" />
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
        </div>

        <!-- ══ SECTION 4 — WHAT YOU WANT ════════════════════════════════════ -->
        <div class="pb-6 border-b border-surface-100">
          <div class="mb-5">
            <h2 class="text-base font-bold text-surface-800">What Are You Looking For?</h2>
            <p class="text-sm text-surface-500 mt-0.5">
              Tell other traders what you'd like in exchange. Being specific increases your chances
              of a good match.
            </p>
          </div>

          <!-- Open to offers toggle -->
          <label class="flex items-center gap-2 mb-4 cursor-pointer select-none">
            <input
              type="checkbox"
              v-model="openToOffers"
              class="w-4 h-4 accent-primary-600"
              @change="onOpenToOffersChange"
            />
            <span class="text-sm text-surface-700 font-medium">Open to reasonable offers</span>
          </label>

          <!-- Free-text lookingFor -->
          <div class="mb-5">
            <label for="lookingFor" class="form-label"
              >Specific preference
              <span class="text-surface-400 font-normal text-xs">(optional)</span></label
            >
            <textarea
              id="lookingFor"
              v-model.trim="form.lookingFor"
              rows="2"
              placeholder='e.g. "Samsung S23 or similar Android phone"'
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

          <!-- Trade preferences (multi-select chips) -->
          <div class="mb-5">
            <label class="form-label"
              >Trade preference
              <span class="text-surface-400 font-normal text-xs"
                >(select all that apply)</span
              ></label
            >
            <div class="flex flex-wrap gap-2 mt-1">
              <label
                v-for="opt in tradePreferenceOptions"
                :key="opt.value"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-xs font-medium transition"
                :class="
                  form.tradePreferences.includes(opt.value)
                    ? 'border-primary-500 bg-primary-600 text-white'
                    : 'border-surface-200 bg-white text-surface-700 hover:border-primary-400'
                "
              >
                <input
                  type="checkbox"
                  :value="opt.value"
                  v-model="form.tradePreferences"
                  class="sr-only"
                />
                {{ opt.label }}
              </label>
            </div>
          </div>

          <!-- Interested-in categories -->
          <div>
            <label class="form-label"
              >I'm interested in
              <span class="text-surface-400 font-normal text-xs"
                >(optional — what categories would you accept?)</span
              ></label
            >
            <div v-if="categoriesLoading" class="text-xs text-surface-400 mt-1">
              Loading categories…
            </div>
            <div v-else class="flex flex-wrap gap-2 mt-1">
              <label
                v-for="cat in categories"
                :key="cat.id"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-xs font-medium transition"
                :class="
                  form.interestedInCategories.includes(cat.id)
                    ? 'border-primary-500 bg-primary-600 text-white'
                    : 'border-surface-200 bg-white text-surface-700 hover:border-primary-400'
                "
              >
                <input
                  type="checkbox"
                  :value="cat.id"
                  v-model="form.interestedInCategories"
                  class="sr-only"
                />
                {{ cat.name }}
              </label>
            </div>
          </div>
        </div>

        <!-- ══ SECTION 5 — EXCHANGE DETAILS ════════════════════════════════ -->
        <div class="pb-6 border-b border-surface-100">
          <div class="mb-5">
            <h2 class="text-base font-bold text-surface-800">Exchange Details</h2>
            <p class="text-sm text-surface-500 mt-0.5">
              Let traders know where and how the exchange can happen.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <label
              v-for="opt in exchangeMethodOptions"
              :key="opt.value"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-xs font-medium transition"
              :class="
                form.exchangeMethods.includes(opt.value)
                  ? 'border-primary-500 bg-primary-600 text-white'
                  : 'border-surface-200 bg-white text-surface-700 hover:border-primary-400'
              "
            >
              <input
                type="checkbox"
                :value="opt.value"
                v-model="form.exchangeMethods"
                class="sr-only"
              />
              <span aria-hidden="true">{{ opt.emoji }}</span> {{ opt.label }}
            </label>
          </div>
        </div>

        <!-- ══ ACTIONS ════════════════════════════════════════════════════════ -->
        <div class="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            class="btn-secondary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
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
            class="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
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
            {{
              listingStore.submitting && submitAction === 'publish' ? 'Creating…' : 'Create Listing'
            }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
