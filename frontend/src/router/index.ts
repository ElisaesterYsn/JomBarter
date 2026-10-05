import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '@/pages/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    // ── Public ──────────────────────────────────────────────────────────────
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/pages/AboutView.vue'),
    },

    // ── Guest-only (redirect authenticated users away) ────────────────────
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginView.vue'),
      meta: { guestOnly: true },
    },

    // ── Authenticated user routes ─────────────────────────────────────────
    {
      path: '/listings/:id',
      name: 'listing-detail',
      component: () => import('@/pages/ListingDetailView.vue'),
      // public — anyone can view a listing detail
    },
    {
      path: '/my-listings',
      name: 'my-listings',
      component: () => import('@/pages/MyListingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/my-listings/create',
      name: 'create-listing',
      component: () => import('@/pages/CreateListingView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/my-listings/:id/edit',
      name: 'edit-listing',
      component: () => import('@/pages/EditListingView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/offers',
      name: 'offers',
      component: () => import('@/pages/OffersView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'my-profile',
      component: () => import('@/pages/MyProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/users/:username',
      name: 'public-profile',
      component: () => import('@/pages/PublicProfileView.vue'),
      // public — anyone can view
    },
  ],
})

// ── Navigation guards ────────────────────────────────────────────────────────
router.beforeEach((to) => {
  const auth = useAuthStore()

  // Redirect logged-in users away from guest-only pages
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'home' }
  }

  // Redirect unauthenticated users to login for protected pages
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router
