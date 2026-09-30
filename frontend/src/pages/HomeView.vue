<template>
  <div>
    <!-- ══════════════════════════════════════════════════════════════════════
         AUTHENTICATED VIEW
    ═══════════════════════════════════════════════════════════════════════ -->
    <template v-if="authStore.isAuthenticated">
      <div class="max-w-6xl mx-auto space-y-8 px-0">
        <!-- ── Greeting + CTA ──────────────────────────────────────────────── -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-surface-800 leading-tight">
              Hello, {{ authStore.user?.displayName }} 👋
            </h1>
            <p class="text-sm text-surface-500 mt-1">See what the community is bartering today</p>
          </div>
          <router-link
            to="/my-listings/create"
            class="btn-primary text-sm px-5 py-2.5 self-start sm:self-auto flex items-center gap-2 shrink-0"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Offer Something
          </router-link>
        </div>

        <!-- ── Search bar ──────────────────────────────────────────────────── -->
        <div class="relative">
          <label for="search" class="sr-only">Search items you want to barter</label>
          <div class="relative">
            <svg
              class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              id="search"
              v-model="searchQuery"
              type="search"
              placeholder="Search items you want to barter..."
              class="w-full pl-12 pr-4 py-3 bg-white border border-surface-200 rounded-xl shadow-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition duration-150"
              aria-label="Search items you want to barter"
              @keydown.enter="handleSearch"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition p-1"
              aria-label="Clear search"
              @click="clearSearch"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
          <!-- Future search hint -->
          <p v-if="searchQuery" class="mt-2 text-xs text-surface-400 pl-1">
            Full search coming soon — browsing all listings for now.
          </p>
        </div>

        <!-- ── Category browser ────────────────────────────────────────────── -->
        <div>
          <h2 class="text-sm font-semibold text-surface-600 uppercase tracking-wide mb-3">
            Browse by category
          </h2>
          <!-- Loading shimmer -->
          <div v-if="categoriesLoading" class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <div
              v-for="n in 8"
              :key="n"
              class="h-9 w-28 bg-surface-200 rounded-full animate-pulse shrink-0"
            ></div>
          </div>
          <!-- Category chips -->
          <div v-else class="flex flex-wrap gap-2" role="list" aria-label="Browse by category">
            <button
              type="button"
              role="listitem"
              class="category-chip"
              :class="selectedCategory === null ? 'category-chip-active' : ''"
              @click="selectCategory(null)"
            >
              All
            </button>
            <button
              v-for="cat in categories"
              :key="cat.id"
              type="button"
              role="listitem"
              class="category-chip"
              :class="selectedCategory === cat.id ? 'category-chip-active' : ''"
              @click="selectCategory(cat.id)"
            >
              {{ cat.name }}
            </button>
          </div>
        </div>

        <!-- ── Listings section ────────────────────────────────────────────── -->
        <div>
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-bold text-surface-800">
              Latest Barter Listings
              <span
                v-if="selectedCategory || searchQuery"
                class="text-primary-600 font-normal text-sm ml-1"
              >
                — filtered
              </span>
            </h2>
            <span v-if="pagination" class="text-xs text-surface-400">
              {{ pagination.total }} listing{{ pagination.total === 1 ? '' : 's' }}
            </span>
          </div>

          <!-- Loading skeletons: 3-column grid -->
          <div v-if="feedLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div
              v-for="n in 6"
              :key="n"
              class="rounded-2xl border border-surface-200 bg-white overflow-hidden animate-pulse"
            >
              <div class="aspect-[4/3] bg-surface-200"></div>
              <div class="p-4 space-y-3">
                <div class="h-4 bg-surface-200 rounded w-3/4"></div>
                <div class="h-3 bg-surface-200 rounded w-1/2"></div>
                <div class="h-3 bg-surface-200 rounded w-full"></div>
                <div class="h-3 bg-surface-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>

          <!-- Error -->
          <div v-else-if="feedError" class="card text-center py-12">
            <svg
              class="w-12 h-12 text-surface-300 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p class="text-surface-600 mb-4">{{ feedError }}</p>
            <button class="btn-secondary px-5 py-2 text-sm" @click="loadFeed(1)">Try again</button>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="!feedLoading && displayedItems.length === 0"
            class="card text-center py-16"
          >
            <div
              class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <svg
                class="w-8 h-8 text-primary-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-surface-800 mb-2">Nothing to barter yet</h2>
            <p class="text-surface-500 text-sm mb-6">
              Be the first to offer something to the community.
            </p>
            <router-link
              to="/my-listings/create"
              class="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
            >
              Offer Something
            </router-link>
          </div>

          <!-- ── Listing grid ── -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <article
              v-for="item in displayedItems"
              :key="item.id"
              class="group rounded-2xl border border-surface-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
            >
              <!-- Image area -->
              <div class="relative aspect-[4/3] bg-surface-100 overflow-hidden">
                <img
                  v-if="firstImage(item)"
                  :src="firstImage(item)!"
                  :alt="item.title"
                  class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  loading="lazy"
                  @error="handleImageError"
                />
                <!-- Image placeholder (no photo or error) -->
                <div
                  v-else
                  class="w-full h-full flex flex-col items-center justify-center bg-surface-100 text-surface-300"
                >
                  <svg
                    class="w-10 h-10 mb-1"
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
                  <span class="text-xs text-surface-400">No photo</span>
                </div>

                <!-- Condition badge — overlaid on image -->
                <span
                  class="absolute top-2.5 left-2.5 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  :class="conditionClass(item.condition)"
                >
                  {{ conditionLabel(item.condition) }}
                </span>

                <!-- Multi-photo badge -->
                <span
                  v-if="item.images.length > 1"
                  class="absolute top-2.5 right-2.5 bg-black/50 text-white text-[11px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                >
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fill-rule="evenodd"
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  {{ item.images.length }}
                </span>
              </div>

              <!-- Card body -->
              <div class="flex flex-col flex-1 p-4 gap-3">
                <!-- Title + Favourite -->
                <div class="flex items-start justify-between gap-2">
                  <h3
                    class="font-semibold text-surface-800 text-sm leading-snug line-clamp-2 flex-1"
                  >
                    {{ item.title }}
                  </h3>
                  <!-- Favourite button: UI-ready, backend not yet implemented -->
                  <button
                    type="button"
                    class="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-surface-300 hover:text-red-400 hover:bg-red-50 transition-colors duration-150"
                    aria-label="Add to favourites (coming soon)"
                    title="Add to favourites"
                    @click.prevent
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
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                </div>

                <!-- Location -->
                <div v-if="item.location" class="flex items-center gap-1 text-xs text-surface-500">
                  <svg
                    class="w-3.5 h-3.5 shrink-0 text-surface-400"
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
                  {{ item.location }}
                </div>

                <!-- Barter preference — the KEY JomBarter differentiator -->
                <div class="flex-1">
                  <div
                    v-if="item.lookingFor"
                    class="bg-primary-50 border border-primary-100 rounded-lg px-3 py-2"
                  >
                    <p
                      class="text-[11px] font-semibold text-primary-700 uppercase tracking-wide mb-0.5"
                    >
                      Looking to trade for
                    </p>
                    <p class="text-xs text-primary-900 line-clamp-2 leading-relaxed">
                      {{ item.lookingFor }}
                    </p>
                  </div>
                  <div v-else class="bg-surface-100 border border-surface-200 rounded-lg px-3 py-2">
                    <p
                      class="text-[11px] font-semibold text-surface-500 uppercase tracking-wide mb-0.5"
                    >
                      Looking to trade for
                    </p>
                    <p class="text-xs text-surface-400 italic">Open to offers</p>
                  </div>
                </div>

                <!-- User info + time + CTA -->
                <div class="flex items-center justify-between pt-2 border-t border-surface-100">
                  <div class="flex items-center gap-2 min-w-0">
                    <div
                      class="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold uppercase shrink-0"
                      aria-hidden="true"
                    >
                      {{ item.user.displayName.charAt(0) }}
                    </div>
                    <span class="text-xs text-surface-600 font-medium truncate">
                      {{ item.user.displayName }}
                    </span>
                    <span class="text-[11px] text-surface-400 shrink-0">
                      · {{ relativeTime(item.createdAt) }}
                    </span>
                  </div>
                  <router-link
                    :to="`/listings/${item.id}`"
                    class="text-xs font-semibold text-primary-600 hover:text-primary-800 transition shrink-0 ml-2"
                    :aria-label="`View details for ${item.title}`"
                  >
                    View →
                  </router-link>
                </div>
              </div>
            </article>
          </div>

          <!-- ── Pagination ── -->
          <div
            v-if="pagination && pagination.totalPages > 1 && !feedLoading"
            class="flex items-center justify-center gap-3 pt-6"
          >
            <button
              class="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
              :disabled="!pagination.hasPrevPage || feedLoading"
              @click="loadFeed(pagination!.page - 1)"
            >
              ← Newer
            </button>
            <span class="text-sm text-surface-500">
              Page {{ pagination.page }} of {{ pagination.totalPages }}
            </span>
            <button
              class="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
              :disabled="!pagination.hasNextPage || feedLoading"
              @click="loadFeed(pagination!.page + 1)"
            >
              Older →
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════════════════
         GUEST VIEW
    ═══════════════════════════════════════════════════════════════════════ -->
    <template v-else>
      <div class="max-w-6xl mx-auto space-y-8 px-0">
        <!-- Hero banner -->
        <div
          class="text-center py-12 bg-gradient-to-br from-primary-800 via-primary-700 to-amber-600 text-white rounded-2xl shadow-lg px-6"
        >
          <h1 class="text-3xl font-bold mb-3 tracking-tight">Welcome to JomBarter</h1>
          <p class="text-base text-amber-100 mb-6 max-w-sm mx-auto">
            A community marketplace where you exchange items and services — no money needed.
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <router-link
              to="/register"
              class="bg-white text-primary-700 hover:bg-amber-50 font-semibold py-2.5 px-6 rounded-lg transition shadow text-sm"
            >
              Create Free Account
            </router-link>
            <router-link
              to="/login"
              class="border-2 border-white/70 text-white hover:bg-white/10 font-medium py-2.5 px-6 rounded-lg transition text-sm"
            >
              Sign In
            </router-link>
          </div>
        </div>

        <!-- Lock nudge -->
        <div
          class="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800"
        >
          <svg
            class="w-4 h-4 shrink-0 text-amber-500"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clip-rule="evenodd"
            />
          </svg>
          <span>
            Browsing as guest.
            <router-link to="/register" class="font-semibold underline hover:no-underline"
              >Create a free account</router-link
            >
            to see full details and propose a barter.
          </span>
        </div>

        <!-- Latest listings heading -->
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-surface-800">Latest Barter Listings</h2>
          <span v-if="pagination" class="text-xs text-surface-400">
            {{ pagination.total }} listing{{ pagination.total === 1 ? '' : 's' }}
          </span>
        </div>

        <!-- Loading -->
        <div v-if="feedLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="n in 6"
            :key="n"
            class="rounded-2xl border border-surface-200 bg-white overflow-hidden animate-pulse"
          >
            <div class="aspect-[4/3] bg-surface-200"></div>
            <div class="p-4 space-y-3">
              <div class="h-4 bg-surface-200 rounded w-3/4"></div>
              <div class="h-3 bg-surface-200 rounded w-1/2"></div>
              <div class="h-3 bg-surface-200 rounded w-full"></div>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="feedError" class="card text-center py-10">
          <p class="text-surface-600 mb-4">{{ feedError }}</p>
          <button class="btn-secondary px-5 py-2 text-sm" @click="loadFeed(1)">Try again</button>
        </div>

        <!-- Empty -->
        <div v-else-if="!feedLoading && feedItems.length === 0" class="card text-center py-16">
          <h2 class="text-lg font-semibold text-surface-800 mb-2">Nothing to barter yet</h2>
          <p class="text-surface-500 text-sm mb-6">
            Be the first to offer something to the community.
          </p>
          <router-link
            to="/register"
            class="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
          >
            Join to start bartering
          </router-link>
        </div>

        <!-- Guest listing grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <article
            v-for="item in feedItems"
            :key="item.id"
            class="group rounded-2xl border border-surface-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
          >
            <!-- Image -->
            <div class="relative aspect-[4/3] bg-surface-100 overflow-hidden">
              <img
                v-if="firstImage(item)"
                :src="firstImage(item)!"
                :alt="item.title"
                class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                loading="lazy"
                @error="handleImageError"
              />
              <div
                v-else
                class="w-full h-full flex flex-col items-center justify-center text-surface-300"
              >
                <svg
                  class="w-10 h-10 mb-1"
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
                <span class="text-xs text-surface-400">No photo</span>
              </div>
              <span
                class="absolute top-2.5 left-2.5 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                :class="conditionClass(item.condition)"
              >
                {{ conditionLabel(item.condition) }}
              </span>
            </div>

            <!-- Body -->
            <div class="flex flex-col flex-1 p-4 gap-3">
              <h3 class="font-semibold text-surface-800 text-sm leading-snug line-clamp-2">
                {{ item.title }}
              </h3>
              <div v-if="item.location" class="flex items-center gap-1 text-xs text-surface-500">
                <svg
                  class="w-3.5 h-3.5 shrink-0 text-surface-400"
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
                {{ item.location }}
              </div>

              <!-- Barter preference (teaser for guest) -->
              <div class="flex-1 relative">
                <div
                  class="bg-primary-50 border border-primary-100 rounded-lg px-3 py-2 select-none"
                >
                  <p
                    class="text-[11px] font-semibold text-primary-700 uppercase tracking-wide mb-0.5"
                  >
                    Looking to trade for
                  </p>
                  <p class="text-xs text-primary-900/60 line-clamp-1 blur-[3px] italic">
                    {{ item.lookingFor || 'Open to offers' }}
                  </p>
                </div>
                <!-- Lock overlay -->
                <div class="absolute inset-0 flex items-center justify-center rounded-lg">
                  <router-link
                    to="/register"
                    class="flex items-center gap-1 text-[11px] font-semibold text-primary-700 bg-white/90 border border-primary-200 px-2.5 py-1 rounded-full shadow-sm hover:bg-primary-50 transition"
                    aria-label="Sign up to see barter preference"
                  >
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path
                        fill-rule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    Sign up to see
                  </router-link>
                </div>
              </div>

              <!-- Poster + CTA -->
              <div class="flex items-center justify-between pt-2 border-t border-surface-100">
                <div class="flex items-center gap-1.5 min-w-0">
                  <div
                    class="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold uppercase shrink-0"
                    aria-hidden="true"
                  >
                    {{ item.user.displayName.charAt(0) }}
                  </div>
                  <span class="text-xs text-surface-600 font-medium truncate">{{
                    item.user.displayName
                  }}</span>
                  <span class="text-[11px] text-surface-400 shrink-0"
                    >· {{ relativeTime(item.createdAt) }}</span
                  >
                </div>
                <router-link
                  to="/register"
                  class="text-xs font-semibold text-primary-600 hover:text-primary-800 transition shrink-0 ml-2"
                  aria-label="Sign up to see more details"
                >
                  Sign up →
                </router-link>
              </div>
            </div>
          </article>
        </div>

        <!-- Guest pagination -->
        <div
          v-if="pagination && pagination.totalPages > 1 && !feedLoading"
          class="flex items-center justify-center gap-3 pt-4"
        >
          <button
            class="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
            :disabled="!pagination.hasPrevPage || feedLoading"
            @click="loadFeed(pagination!.page - 1)"
          >
            ← Newer
          </button>
          <span class="text-sm text-surface-500"
            >Page {{ pagination.page }} of {{ pagination.totalPages }}</span
          >
          <button
            class="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
            :disabled="!pagination.hasNextPage || feedLoading"
            @click="loadFeed(pagination!.page + 1)"
          >
            Older →
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import listingService, {
  type FeedListing,
  type FeedResponse,
  type Category,
} from '@/services/listingService'

const authStore = useAuthStore()

// ── Feed state ────────────────────────────────────────────────────────────────
const feedItems = ref<FeedListing[]>([])
const pagination = ref<FeedResponse['pagination'] | null>(null)
const feedLoading = ref(false)
const feedError = ref<string | null>(null)

async function loadFeed(page = 1) {
  feedLoading.value = true
  feedError.value = null
  try {
    const data = await listingService.getPublicFeed(page, 12)
    feedItems.value = data.listings
    pagination.value = data.pagination
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch {
    feedError.value = 'Could not load listings. Please try again.'
  } finally {
    feedLoading.value = false
  }
}

// ── Categories ────────────────────────────────────────────────────────────────
const categories = ref<Category[]>([])
const categoriesLoading = ref(true)
const selectedCategory = ref<string | null>(null)

async function loadCategories() {
  try {
    categories.value = await listingService.getCategories()
  } catch {
    // non-fatal — categories are cosmetic on the home page
  } finally {
    categoriesLoading.value = false
  }
}

function selectCategory(id: string | null) {
  selectedCategory.value = id
}

// ── Search (UI-ready, backend filtering not yet implemented) ──────────────────
const searchQuery = ref('')

function handleSearch() {
  // Placeholder — full-text search will be wired when the search API is available.
  // For now, client-side filter is applied via displayedItems computed.
}

function clearSearch() {
  searchQuery.value = ''
}

// ── Displayed items — client-side filter by category + search query ───────────
const displayedItems = computed(() => {
  let items = feedItems.value

  if (selectedCategory.value) {
    items = items.filter((i) => i.categoryId === selectedCategory.value)
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.lookingFor ?? '').toLowerCase().includes(q),
    )
  }

  return items
})

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  loadFeed()
  if (authStore.isAuthenticated) loadCategories()
})

watch(
  () => authStore.isAuthenticated,
  (authed) => {
    loadFeed()
    if (authed) loadCategories()
  },
)

// ── Image error handler — replaces broken img with placeholder ────────────────
function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
  const parent = img.parentElement
  if (parent && !parent.querySelector('.img-fallback')) {
    const fallback = document.createElement('div')
    fallback.className =
      'img-fallback w-full h-full flex flex-col items-center justify-center text-surface-300'
    fallback.innerHTML = `
      <svg class="w-10 h-10 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      <span style="font-size:11px;color:#b5a994">No photo</span>`
    parent.appendChild(fallback)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function firstImage(item: FeedListing): string | null {
  const m = item.images.find((i) => i.imageUrl)
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

function conditionClass(c: string): string {
  const map: Record<string, string> = {
    NEW: 'bg-green-100 text-green-800',
    LIKE_NEW: 'bg-emerald-100 text-emerald-800',
    GOOD: 'bg-primary-100 text-primary-800',
    FAIR: 'bg-amber-100 text-amber-800',
    POOR: 'bg-red-100 text-red-700',
  }
  return map[c] ?? 'bg-surface-100 text-surface-700'
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
</script>

<style scoped>
/* Category chip base */
.category-chip {
  @apply inline-flex items-center gap-1.5 px-3.5 py-1.5
    text-xs font-medium rounded-full border
    border-surface-200 bg-white text-surface-700
    hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50
    transition-all duration-150
    focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1;
}

/* Active / selected chip */
.category-chip-active {
  @apply border-primary-500 bg-primary-600 text-white hover:bg-primary-700 hover:text-white hover:border-primary-600;
}
</style>
