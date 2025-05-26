import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.ts'

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/explore', component: () => import('@/views/ExploreView.vue') },
  { path: '/members', component: () => import('@/views/ArtistView.vue') },
  { path: '/search', component: () => import('@/views/SearchView.vue') },
  { path: '/about', component: () => import('@/views/AboutView.vue') },
  { path: '/contact', component: () => import('@/views/ContactUsView.vue') },
  {
    path: '/login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAnon: true },
  },
  {
    path: '/signup',
    component: () => import('@/views/SignupView.vue'),
    meta: { requiresAnon: true },
  },
  {
    path: '/reset',
    component: () => import('@/views/RequestPasswordReset.vue'),
    meta: { requiresAnon: true },
  },
  {
    path: '/account/password/reset/:key?',
    component: () => import('@/views/CompletePasswordReset.vue'),
    meta: { requiresAnon: true },
  },
  {
    path: '/account/email/verify/:key?',
    component: () => import('@/views/ConfirmEmail.vue'),
    meta: { requiresAnon: true },
  },
  {
    path: '/studio',
    component: () => import('@/views/StudioView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Manage Auth/Anon routing
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  authStore.resetErrors()
  const isAuthenticated = !!authStore.id
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresAnon && isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
