import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/onboarding', name: 'onboarding', component: () => import('../views/OnboardingView.vue') },
  {
    path: '/',
    component: () => import('../views/MainLayout.vue'),
    children: [
      { path: '', redirect: '/projects' },
      { path: 'projects', name: 'projects', component: () => import('../views/ProjectsView.vue') },
      { path: 'log/:projectId', name: 'log', component: () => import('../views/LogView.vue') }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/projects' }
]

const router = createRouter({ history: createWebHistory(), routes })

export default router
