import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home/index.vue')
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('../views/Auth/index.vue')
  },
  {
    path: '/products',
    name: 'ProductList',
    component: () => import('../views/ProductList/index.vue')
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetail/index.vue')
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('../views/Cart/index.vue')
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('../views/Checkout/index.vue')
  },
  {
    path: '/payment/:orderId',
    name: 'Payment',
    component: () => import('../views/Payment/index.vue')
  },
  {
    path: '/orders',
    name: 'OrderList',
    component: () => import('../views/OrderList/index.vue')
  },
  {
    path: '/order/:id',
    name: 'OrderDetail',
    component: () => import('../views/OrderDetail/index.vue')
  },
  {
    path: '/user',
    name: 'UserCenter',
    component: () => import('../views/UserCenter/index.vue')
  },
  {
    path: '/user/:id',
    name: 'UserProfile',
    component: () => import('../views/UserProfile/index.vue')
  },
  {
    path: '/messages',
    name: 'MessageCenter',
    component: () => import('../views/MessageCenter/index.vue')
  },
  {
    path: '/achievements',
    name: 'Achievements',
    component: () => import('../views/Achievements/index.vue')
  },
  {
    path: '/games',
    name: 'Games',
    component: () => import('../views/Games/index.vue')
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: () => import('../views/Leaderboard/index.vue')
  },
  {
    path: '/stocks',
    name: 'Stocks',
    component: () => import('../views/Stocks/index.vue')
  },
  {
    path: '/stocks/:symbol',
    name: 'StockDetail',
    component: () => import('../views/StockDetail/index.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

export default router
