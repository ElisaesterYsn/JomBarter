<template>
  <div class="max-w-4xl mx-auto">
    <!-- Back -->
    <button
      class="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-primary-700 transition mb-5"
      @click="$router.back()"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to listings
    </button>

    <!-- ── Loading skeleton ── -->
    <div v-if="loading" class="grid lg:grid-cols-[1fr_380px] gap-6">
      <div class="card animate-pulse space-y-3">
        <div class="aspect-[4/3] bg-surface-200 rounded-xl"></div>
        <div class="flex gap-2">
          <div v-for="n in 4" :key="n" class="w-16 h-16 bg-surface-200 rounded-lg shrink-0"></div>
        </div>
      </div>
      <div class="space-y-4">
        <div class="card animate-pulse space-y-4">
          <div class="h-5 bg-surface-200 rounded w-1/3"></div>
          <div class="h-7 bg-surface-200 rounded w-5/6"></div>
          <div class="h-4 bg-surface-200 rounded w-2/3"></div>
        </div>
        <div class="card animate-pulse space-y-3">
          <div class="h-3 bg-surface-200 rounded w-full"></div>
          <div class="h-3 bg-surface-200 rounded w-full"></div>
          <div class="h-3 bg-surface-200 rounded w-4/6"></div>
        </div>
      </div>
    </div>

    <!-- ── Error ── -->
    <div v-else-if="error" class="card text-center py-14">
      <div
        class="w-14 h-14 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <svg
          class="w-7 h-7 text-surface-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 class="text-base font-semibold text-surface-800 mb-1">Listing not found</h2>
      <p class="text-sm text-surface-500 mb-5">
        This listing may have been removed or the link is invalid.
      </p>
      <div class="flex gap-3 justify-center">
        <button class="btn-secondary px-4 py-2 text-sm" @click="$router.back()">← Go back</button>
        <router-link to="/" class="btn-primary px-4 py-2 text-sm">Browse listings</router-link>
      </div>
    </div>

    <!-- ── Main content ── -->
    <template v-else-if="listing">
      <!-- ── TRADED / UNAVAILABLE banner (full width, above grid) ── -->
      <div
        v-if="listing.status === 'TRADED'"
        class="mb-5 rounded-2xl bg-primary-50 border border-primary-200 px-5 py-4 flex items-center gap-3"
        role="status"
      >
        <span
          class="text-xs font-bold uppercase tracking-widest bg-primary-600 text-white px-2.5 py-1 rounded-full shrink-0"
          >Traded</span
        >
        <p class="text-sm text-primary-800">This item is no longer available for barter.</p>
      </div>
      <div
        v-else-if="['ARCHIVED', 'REMOVED'].includes(listing.status)"
        class="mb-5 rounded-2xl bg-surface-100 border border-surface-200 px-5 py-4 flex items-center gap-3"
        role="status"
      >
        <span
          class="text-xs font-bold uppercase tracking-widest bg-surface-500 text-white px-2.5 py-1 rounded-full shrink-0"
          >{{ listing.status === 'ARCHIVED' ? 'Archived' : 'Removed' }}</span
        >
        <p class="text-sm text-surface-600">This listing is no longer active.</p>
      </div>

      <!-- Two-column on desktop, single column on mobile -->
      <div class="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <!-- ══ LEFT COLUMN: Gallery ════════════════════════════════════════ -->
        <div class="space-y-3">
          <!-- Main image / placeholder -->
          <div
            class="rounded-2xl overflow-hidden bg-surface-100 border border-surface-200"
            style="aspect-ratio: 4/3"
          >
            <template v-if="currentMedia?.imageUrl">
              <img
                :src="mediaUrl(currentMedia.imageUrl)"
                :alt="listing.title"
                class="w-full h-full object-cover cursor-zoom-in"
                @click="lightboxOpen = true"
              />
            </template>
            <template v-else>
              <div
                class="w-full h-full flex flex-col items-center justify-center text-surface-300 gap-2"
              >
                <svg
                  class="w-16 h-16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span class="text-sm font-medium">No photos added yet</span>
              </div>
            </template>
          </div>

          <!-- Thumbnail strip -->
          <div
            v-if="listing.images.length > 1"
            class="flex gap-2 overflow-x-auto pb-1"
            role="list"
            :aria-label="`${listing.images.length} photos`"
          >
            <button
              v-for="(img, i) in listing.images"
              :key="img.id"
              role="listitem"
              class="shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition focus:outline-none focus:ring-2 focus:ring-primary-500"
              :class="
                i === mediaIndex
                  ? 'border-primary-500 ring-1 ring-primary-400'
                  : 'border-surface-200 opacity-60 hover:opacity-100 hover:border-surface-400'
              "
              :aria-label="`View photo ${i + 1}`"
              :aria-pressed="i === mediaIndex"
              @click="mediaIndex = i"
            >
              <img
                v-if="img.imageUrl"
                :src="mediaUrl(img.imageUrl)"
                :alt="`Photo ${i + 1}`"
                class="w-full h-full object-cover"
                loading="lazy"
              />
              <div
                v-else
                class="w-full h-full bg-surface-200 flex items-center justify-center text-surface-400"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </button>
          </div>

          <p v-if="listing.images.length > 1" class="text-xs text-surface-400 text-center">
            Photo {{ mediaIndex + 1 }} of {{ listing.images.length }}
            <span
              class="ml-1 text-primary-600 cursor-pointer hover:underline"
              @click="lightboxOpen = true"
              >· View larger</span
            >
          </p>
        </div>

        <!-- ══ RIGHT COLUMN: Header → CTA → Owner (sticky context) ══════════ -->
        <div class="space-y-4 lg:sticky lg:top-24">
          <!-- ── Title / condition / badges ── -->
          <div class="card">
            <!-- Badges row -->
            <div class="flex items-center gap-2 mb-3 flex-wrap">
              <span
                class="inline-flex items-center gap-1 text-xs font-medium bg-surface-100 text-surface-600 px-2.5 py-1 rounded-full border border-surface-200"
              >
                <span aria-hidden="true">{{ listingTypeEmoji(listing.listingType) }}</span>
                {{ listingTypeLabel(listing.listingType) }}
              </span>
              <span
                class="text-xs font-bold px-2.5 py-1 rounded-full"
                :class="conditionClass(listing.condition)"
              >
                {{ conditionLabel(listing.condition) }}
              </span>
              <span
                v-if="listing.status !== 'ACTIVE'"
                class="text-xs font-semibold px-2.5 py-1 rounded-full"
                :class="
                  listing.status === 'TRADED'
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-surface-200 text-surface-600'
                "
              >
                {{
                  listing.status === 'TRADED'
                    ? 'Traded'
                    : listing.status === 'ARCHIVED'
                      ? 'Archived'
                      : listing.status
                }}
              </span>
              <span
                v-if="listing.category"
                class="text-xs bg-surface-100 text-surface-600 px-2.5 py-1 rounded-full font-medium"
              >
                📂 {{ listing.category.name }}
              </span>
            </div>

            <!-- Title -->
            <h1 class="text-2xl font-bold text-surface-900 leading-tight mb-3">
              {{ listing.title }}
            </h1>

            <!-- Location + date -->
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-surface-500 mb-3">
              <span v-if="listing.location" class="flex items-center gap-1">
                <svg
                  class="w-4 h-4 shrink-0 text-surface-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {{ listing.location }}
              </span>
              <span class="flex items-center gap-1">
                <svg
                  class="w-4 h-4 shrink-0 text-surface-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {{ fullDate(listing.createdAt) }}
              </span>
              <span class="text-surface-400">{{ relativeTime(listing.createdAt) }}</span>
            </div>

            <!-- Estimated value -->
            <div v-if="listing.estimatedValue">
              <div
                class="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold px-3 py-1.5 rounded-xl"
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                RM {{ listing.estimatedValue.toLocaleString() }}
              </div>
              <p class="mt-1 text-xs text-surface-400">Estimated value — not a selling price</p>
            </div>
          </div>

          <!-- ── CTA card ── -->
          <div class="card">
            <!-- Guest -->
            <router-link
              v-if="!authStore.isAuthenticated"
              to="/register"
              class="btn-primary w-full py-3 text-sm text-center block"
            >
              Sign in to make an offer
            </router-link>

            <!-- Own listing -->
            <div v-else-if="authStore.user?.id === listing.userId" class="text-center">
              <p class="text-xs font-semibold text-surface-500 uppercase tracking-widest mb-2">
                This is your listing
              </p>
              <router-link
                :to="`/my-listings/${listing.id}/edit`"
                class="btn-secondary w-full py-2.5 text-sm text-center block"
              >
                Edit listing
              </router-link>
            </div>

            <!-- Not available -->
            <div
              v-else-if="listing.status !== 'ACTIVE'"
              class="text-center py-3 px-4 bg-surface-100 rounded-xl border border-surface-200"
            >
              <p class="text-xs font-semibold text-surface-500 uppercase tracking-widest mb-1">
                Not Available
              </p>
              <p class="text-sm text-surface-500">
                This listing is no longer available for barter.
              </p>
            </div>

            <!-- Pending offer exists -->
            <div
              v-else-if="existingPendingOffer"
              class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center space-y-2"
            >
              <p class="text-xs font-bold text-amber-700 uppercase tracking-widest">
                Offer Pending
              </p>
              <p class="text-sm text-amber-800">
                You already have an active offer on this listing.
              </p>
              <div class="flex gap-2 justify-center pt-1">
                <router-link
                  to="/offers"
                  class="text-xs font-semibold text-primary-700 border border-primary-300 bg-white rounded-lg px-3 py-1.5 hover:bg-primary-50 transition"
                >
                  View Offer
                </router-link>
                <button
                  class="text-xs font-semibold text-red-600 border border-red-200 bg-white rounded-lg px-3 py-1.5 hover:bg-red-50 transition disabled:opacity-50"
                  :disabled="offerStore.processingId === existingPendingOffer.id"
                  @click="cancelPendingOffer"
                >
                  {{
                    offerStore.processingId === existingPendingOffer.id
                      ? 'Cancelling…'
                      : 'Cancel Offer'
                  }}
                </button>
              </div>
            </div>

            <!-- Make an Offer -->
            <button
              v-else
              class="btn-primary w-full py-3 text-base font-semibold flex items-center justify-center gap-2"
              @click="openOfferModal"
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
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              Make an Offer
            </button>
          </div>

          <!-- ── Listed by ── -->
          <div class="card">
            <h2 class="text-xs font-bold text-surface-400 uppercase tracking-widest mb-3">
              Listed By
            </h2>
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold uppercase shrink-0"
                aria-hidden="true"
              >
                {{ listing.user?.displayName?.charAt(0) ?? '?' }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-surface-800 truncate">
                  {{ listing.user?.displayName }}
                </p>
                <p v-if="listing.user?.username" class="text-xs text-surface-400 truncate">
                  @{{ listing.user.username }}
                </p>
                <p
                  v-if="listing.location"
                  class="text-xs text-surface-400 flex items-center gap-0.5 mt-0.5"
                >
                  <svg
                    class="w-3 h-3 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {{ listing.location }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <!-- end right column -->
      </div>
      <!-- end grid -->

      <!-- ══ FULL-WIDTH DETAIL SECTIONS (below grid) ══════════════════════ -->
      <div class="mt-6 space-y-4 max-w-2xl lg:max-w-none">
        <!-- About this listing -->
        <div class="card">
          <h2 class="text-xs font-bold text-surface-500 uppercase tracking-widest mb-3">
            About This Listing
          </h2>
          <p class="text-sm text-surface-700 leading-relaxed whitespace-pre-line">
            {{ listing.description }}
          </p>
        </div>

        <!-- Looking to trade for -->
        <div v-if="listing.lookingFor" class="card border-primary-200 bg-primary-50">
          <h2
            class="text-xs font-bold text-primary-700 uppercase tracking-widest mb-2 flex items-center gap-1.5"
          >
            <svg
              class="w-3.5 h-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            Looking to Trade For
          </h2>
          <p class="text-base text-primary-900 leading-relaxed font-semibold">
            {{ listing.lookingFor }}
          </p>
        </div>

        <!-- Trade preferences -->
        <div v-if="tradePreferences.length" class="card">
          <h2 class="text-xs font-bold text-surface-500 uppercase tracking-widest mb-3">
            Trade Preferences
          </h2>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="p in tradePreferences"
              :key="p"
              class="inline-flex items-center gap-1 bg-surface-100 text-surface-700 text-xs px-2.5 py-1.5 rounded-full border border-surface-200"
            >
              <svg
                class="w-3 h-3 text-primary-600"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              {{ tradePrefLabel(p) }}
            </span>
          </div>
        </div>

        <!-- Exchange methods -->
        <div v-if="exchangeMethods.length" class="card">
          <h2 class="text-xs font-bold text-surface-500 uppercase tracking-widest mb-3">
            Exchange Method
          </h2>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="m in exchangeMethods"
              :key="m"
              class="inline-flex items-center gap-1.5 bg-surface-100 text-surface-700 text-xs px-2.5 py-1.5 rounded-full border border-surface-200"
            >
              {{ exchangeMethodEmoji(m) }} {{ exchangeMethodLabel(m) }}
            </span>
          </div>
        </div>

        <!-- Interested categories -->
        <div v-if="resolvedInterestedCats.length" class="card">
          <h2 class="text-xs font-bold text-surface-500 uppercase tracking-widest mb-3">
            Interested In
          </h2>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="cat in resolvedInterestedCats"
              :key="cat"
              class="inline-flex items-center bg-surface-100 text-surface-700 text-xs px-2.5 py-1.5 rounded-full border border-surface-200"
            >
              📂 {{ cat }}
            </span>
          </div>
        </div>
      </div>

      <!-- ══ RELATED LISTINGS ══════════════════════════════════════════════ -->
      <div v-if="relatedLoading || relatedListings.length" class="mt-8">
        <h2 class="text-lg font-bold text-surface-800 mb-4">More from this category</h2>

        <!-- Skeleton -->
        <div v-if="relatedLoading" class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="n in 4"
            :key="n"
            class="rounded-2xl border border-surface-200 bg-white overflow-hidden animate-pulse"
          >
            <div class="aspect-[4/3] bg-surface-200"></div>
            <div class="p-3 space-y-2">
              <div class="h-3 bg-surface-200 rounded w-3/4"></div>
              <div class="h-3 bg-surface-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>

        <!-- Related cards -->
        <div v-else class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <router-link
            v-for="item in relatedListings"
            :key="item.id"
            :to="`/listings/${item.id}`"
            class="group rounded-2xl border border-surface-200 bg-white overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
            :aria-label="`View ${item.title}`"
          >
            <div class="aspect-[4/3] bg-surface-100 overflow-hidden">
              <img
                v-if="firstImage(item)"
                :src="firstImage(item)!"
                :alt="item.title"
                class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-surface-300">
                <svg
                  class="w-8 h-8"
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
              </div>
            </div>
            <div class="p-3 flex-1">
              <p class="text-xs font-semibold text-surface-800 line-clamp-2 leading-snug mb-1.5">
                {{ item.title }}
              </p>
              <div class="flex items-center justify-between gap-1">
                <span
                  class="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  :class="conditionClass(item.condition)"
                >
                  {{ conditionLabel(item.condition) }}
                </span>
                <span v-if="item.location" class="text-[11px] text-surface-400 truncate ml-1">{{
                  item.location
                }}</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════════════
         LIGHTBOX
    ══════════════════════════════════════════════════════════════════ -->
    <div
      v-if="lightboxOpen && currentMedia?.imageUrl"
      class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      @click.self="lightboxOpen = false"
    >
      <button
        class="absolute top-4 right-4 text-white/70 hover:text-white transition"
        aria-label="Close photo viewer"
        @click="lightboxOpen = false"
      >
        <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <!-- Prev/Next in lightbox -->
      <button
        v-if="listing && mediaIndex > 0"
        class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition"
        aria-label="Previous photo"
        @click.stop="mediaIndex--"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        v-if="listing && mediaIndex < listing.images.length - 1"
        class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition"
        aria-label="Next photo"
        @click.stop="mediaIndex++"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <img
        :src="mediaUrl(currentMedia.imageUrl)"
        :alt="listing?.title ?? 'Listing photo'"
        class="max-w-full max-h-[90vh] object-contain rounded-lg select-none"
      />
    </div>

    <!-- ══════════════════════════════════════════════════════════════════
         MAKE AN OFFER MODAL
    ══════════════════════════════════════════════════════════════════ -->
    <div
      v-if="showOfferModal"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-modal-title"
      @click.self="closeOfferModal"
    >
      <div class="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <!-- Modal header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h2 id="offer-modal-title" class="text-base font-bold text-surface-800">Make an Offer</h2>
          <button
            type="button"
            class="text-surface-400 hover:text-surface-700 transition"
            aria-label="Close"
            @click="closeOfferModal"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div class="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <!-- Target listing summary -->
          <div class="bg-surface-50 rounded-xl p-3 flex items-center gap-3">
            <div class="w-12 h-12 bg-surface-200 rounded-lg overflow-hidden shrink-0">
              <img
                v-if="firstImage(listing)"
                :src="firstImage(listing)!"
                :alt="listing?.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-surface-400">
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
                    stroke-width="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                  />
                </svg>
              </div>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-surface-500 font-medium uppercase tracking-wide">You want</p>
              <p class="text-sm font-semibold text-surface-800 truncate">{{ listing?.title }}</p>
            </div>
          </div>

          <!-- My listings to offer -->
          <div>
            <p class="text-sm font-semibold text-surface-700 mb-2">
              Choose something to offer: <span class="text-red-500" aria-hidden="true">*</span>
            </p>
            <div v-if="myListingsLoading" class="text-sm text-surface-400 text-center py-4">
              Loading your listings…
            </div>
            <div v-else-if="offerableListing.length === 0" class="text-center py-6">
              <p class="text-sm text-surface-500 mb-3">
                You don't have any active listings to offer.
              </p>
              <router-link
                to="/my-listings/create"
                class="btn-primary text-sm px-4 py-2 inline-block"
                @click="showOfferModal = false"
              >
                Create a listing first
              </router-link>
            </div>
            <div v-else class="space-y-2 max-h-56 overflow-y-auto pr-1">
              <label
                v-for="item in offerableListing"
                :key="item.id"
                class="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition"
                :class="
                  selectedOfferedId === item.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-surface-200 hover:border-primary-300'
                "
              >
                <input type="radio" :value="item.id" v-model="selectedOfferedId" class="sr-only" />
                <div class="w-12 h-12 bg-surface-200 rounded-lg overflow-hidden shrink-0">
                  <img
                    v-if="firstImage(item)"
                    :src="firstImage(item)!"
                    :alt="item.title"
                    class="w-full h-full object-cover"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center text-surface-400"
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
                        stroke-width="1.5"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                      />
                    </svg>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-surface-800 truncate">{{ item.title }}</p>
                  <p class="text-xs text-surface-500">
                    {{ conditionLabel(item.condition)
                    }}{{ item.location ? ' · ' + item.location : '' }}
                  </p>
                </div>
                <div
                  v-if="selectedOfferedId === item.id"
                  class="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              </label>
            </div>
            <p v-if="offerError.listing" class="mt-1 text-xs text-red-600">
              {{ offerError.listing }}
            </p>
          </div>

          <!-- Message -->
          <div>
            <label for="offer-message" class="form-label">
              Message <span class="text-surface-400 font-normal text-xs">(optional)</span>
            </label>
            <textarea
              id="offer-message"
              v-model="offerMessage"
              rows="3"
              placeholder="Hi! Would you be interested in exchanging for my item?"
              class="form-input resize-none"
              maxlength="1000"
            ></textarea>
          </div>

          <!-- API error -->
          <div
            v-if="offerStore.error"
            class="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"
          >
            {{ offerStore.error }}
          </div>

          <!-- Success -->
          <div
            v-if="offerSuccess"
            class="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800 flex items-center gap-2"
          >
            <svg
              class="w-4 h-4 text-green-600 shrink-0"
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
            Offer sent! The owner will be notified.
          </div>
        </div>

        <!-- Modal footer -->
        <div class="flex gap-3 px-5 py-4 border-t border-surface-100">
          <button type="button" class="btn-secondary flex-1 py-2.5" @click="closeOfferModal">
            Cancel
          </button>
          <button
            type="button"
            class="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
            :disabled="offerStore.submitting || offerSuccess"
            @click="sendOffer"
          >
            <svg
              v-if="offerStore.submitting"
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
            {{ offerSuccess ? 'Offer Sent ✓' : offerStore.submitting ? 'Sending…' : 'Send Offer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useOfferStore } from '@/stores/offer'
import { useListingStore } from '@/stores/listing'
import listingService, {
  type Listing,
  type FeedListing,
  type Category,
  parseCommaList,
} from '@/services/listingService'

const route = useRoute()
const authStore = useAuthStore()
const offerStore = useOfferStore()
const listingStore = useListingStore()
const id = route.params.id as string

// ── Listing data ──────────────────────────────────────────────────────────────
const listing = ref<Listing | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const mediaIndex = ref(0)
const lightboxOpen = ref(false)
const currentMedia = computed(() => listing.value?.images[mediaIndex.value] ?? null)

async function load() {
  loading.value = true
  error.value = null
  mediaIndex.value = 0
  relatedListings.value = []
  try {
    listing.value = await listingService.getOne(id)
    // Load related listings after main listing loads (non-blocking)
    if (listing.value?.categoryId) {
      loadRelated(listing.value.categoryId)
    }
  } catch {
    error.value = 'Could not load this listing.'
  } finally {
    loading.value = false
  }
}

// ── Categories (to resolve interestedInCategories ids → names) ───────────────
const allCategories = ref<Category[]>([])

async function loadCategories() {
  try {
    allCategories.value = await listingService.getCategories()
  } catch {
    /* non-fatal */
  }
}

// ── Related listings ──────────────────────────────────────────────────────────
const relatedListings = ref<FeedListing[]>([])
const relatedLoading = ref(false)

async function loadRelated(categoryId: string) {
  relatedLoading.value = true
  try {
    relatedListings.value = await listingService.getRelatedListings(categoryId, id, 4)
  } catch {
    /* non-fatal — section simply won't render */
  } finally {
    relatedLoading.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  load()
  loadCategories()
  if (authStore.isAuthenticated) {
    loadMyListings()
    offerStore.fetchSent()
  }
})

// ── Parsed fields ─────────────────────────────────────────────────────────────
const tradePreferences = computed(() => parseCommaList(listing.value?.tradePreference))
const exchangeMethods = computed(() => parseCommaList(listing.value?.exchangeMethod))

/** Resolve comma-sep category IDs to human-readable names */
const resolvedInterestedCats = computed((): string[] => {
  const ids = parseCommaList(listing.value?.interestedInCategories)
  if (!ids.length) return []
  const map = new Map(allCategories.value.map((c) => [c.id, c.name]))
  return ids.map((id) => map.get(id) ?? id) // fallback to id if not resolved yet
})

// ── Offer modal ───────────────────────────────────────────────────────────────
const showOfferModal = ref(false)
const selectedOfferedId = ref<string | null>(null)
const offerMessage = ref('')
const offerSuccess = ref(false)
const offerError = ref({ listing: '' })
const myListingsLoading = ref(false)

const offerableListing = computed(() =>
  listingStore.myListings.filter((l) => l.status === 'ACTIVE' && l.id !== id),
)

const existingPendingOffer = computed(
  () => offerStore.sent.find((o) => o.targetListingId === id && o.status === 'PENDING') ?? null,
)

function openOfferModal() {
  offerStore.clearError()
  offerError.value.listing = ''
  selectedOfferedId.value = null
  offerMessage.value = ''
  offerSuccess.value = false
  showOfferModal.value = true
}

function closeOfferModal() {
  if (offerStore.submitting) return
  showOfferModal.value = false
}

async function cancelPendingOffer() {
  if (!existingPendingOffer.value) return
  offerStore.clearError()
  await offerStore.cancelOffer(existingPendingOffer.value.id)
}

async function loadMyListings() {
  if (listingStore.myListings.length) return
  myListingsLoading.value = true
  await listingStore.fetchMyListings()
  myListingsLoading.value = false
}

async function sendOffer() {
  offerError.value.listing = ''
  offerStore.clearError()
  if (!selectedOfferedId.value) {
    offerError.value.listing = 'Please select a listing to offer.'
    return
  }
  try {
    await offerStore.createOffer({
      targetListingId: id,
      offeredListingId: selectedOfferedId.value,
      message: offerMessage.value || undefined,
    })
    offerSuccess.value = true
    setTimeout(() => {
      showOfferModal.value = false
      offerSuccess.value = false
      selectedOfferedId.value = null
      offerMessage.value = ''
    }, 2000)
  } catch {
    /* error displayed via offerStore.error */
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mediaUrl(filename: string | null | undefined) {
  return listingService.mediaUrl(filename) ?? ''
}

function firstImage(item: Listing | null | undefined): string | null {
  if (!item) return null
  const m = item.images?.find((i) => i.imageUrl)
  return m ? listingService.mediaUrl(m.imageUrl) : null
}

const conditionLabels: Record<string, string> = {
  NEW: 'New',
  LIKE_NEW: 'Like New',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
}
function conditionLabel(c: string) {
  return conditionLabels[c] ?? c
}

function conditionClass(c: string) {
  const map: Record<string, string> = {
    NEW: 'bg-green-100 text-green-800',
    LIKE_NEW: 'bg-emerald-100 text-emerald-800',
    GOOD: 'bg-primary-100 text-primary-800',
    FAIR: 'bg-amber-100 text-amber-800',
    POOR: 'bg-red-100 text-red-700',
  }
  return map[c] ?? 'bg-surface-100 text-surface-700'
}

const tradePrefLabels: Record<string, string> = {
  SPECIFIC_ITEM: 'Specific item only',
  SIMILAR_VALUE: 'Similar value items',
  OPEN_OFFERS: 'Open to offers',
  MULTIPLE_ITEMS: 'Multiple items for one',
}
function tradePrefLabel(p: string) {
  return tradePrefLabels[p] ?? p
}

const exchangeLabels: Record<string, string> = {
  MEETUP: 'Meet-up',
  SELF_PICKUP: 'Self pickup',
  DELIVERY: 'Delivery',
  SHIPPING: 'Shipping',
  ONLINE: 'Online/Digital',
}
const exchangeEmojis: Record<string, string> = {
  MEETUP: '🤝',
  SELF_PICKUP: '🚶',
  DELIVERY: '🚗',
  SHIPPING: '📬',
  ONLINE: '💻',
}
function exchangeMethodLabel(m: string) {
  return exchangeLabels[m] ?? m
}
function exchangeMethodEmoji(m: string) {
  return exchangeEmojis[m] ?? ''
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function fullDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Listing type is now always PHYSICAL_ITEM, but keep helpers in case
// future types are re-introduced without requiring a template change.
const listingTypeLabels: Record<string, string> = {
  PHYSICAL_ITEM: 'Physical Item',
}
const listingTypeEmojis: Record<string, string> = {
  PHYSICAL_ITEM: '📦',
}
function listingTypeLabel(t: string) {
  return listingTypeLabels[t] ?? 'Physical Item'
}
function listingTypeEmoji(t: string) {
  return listingTypeEmojis[t] ?? '📦'
}
</script>
