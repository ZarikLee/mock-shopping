import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/onboarding', name: 'onboarding', component: () => import('../views/OnboardingView.vue') },
  { path: '/projects', name: 'projects', component: () => import('../views/ProjectsView.vue') },
  { path: '/log/:projectId', name: 'log', component: () => import('../views/LogView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
