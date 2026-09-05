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

router.beforeEach((to) => {
  const token = localStorage.getItem('dl_token')
  const user = JSON.parse(localStorage.getItem('dl_user') || 'null')
  const authed = !!token
  if (to.path === '/login') {
    if (authed && user?.role) return '/projects'
    if (authed && !user?.role) return '/onboarding'
  }
  if (to.path === '/onboarding' && authed && user?.role) {
    // 有身份仍可访问以便修改/重建首个项目，不强制拦截
  }
  if (to.path !== '/login' && to.path !== '/onboarding' && !authed) return '/login'
  return true
})

export default router
