import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'landing', component: () => import('../views/LandingView.vue') },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/onboarding', name: 'onboarding', component: () => import('../views/OnboardingView.vue') },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('../views/MainLayout.vue'),
    children: [{ path: '', name: 'projectsPage', component: () => import('../views/ProjectsView.vue') }],
  },
  {
    path: '/log/:projectId',
    name: 'log',
    component: () => import('../views/MainLayout.vue'),
    children: [{ path: '', name: 'logPage', component: () => import('../views/LogView.vue') }],
  },
  {
    path: '/files/:projectId',
    name: 'files',
    component: () => import('../views/MainLayout.vue'),
    children: [{ path: '', name: 'filesPage', component: () => import('../views/FilesView.vue') }],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const token = localStorage.getItem('dl_token')
  const user = JSON.parse(localStorage.getItem('dl_user') || 'null')
  const authed = !!token
  const role = user?.role

  // 落地页公开可访问
  if (to.path === '/') return true

  if (!authed) {
    if (to.path === '/login' || to.path === '/onboarding') return true
    return '/'
  }

  if (to.path === '/login') return role ? '/projects' : '/onboarding'
  return true
})

export default router
