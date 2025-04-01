import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/HomeView.vue'),
      meta: {
        title: '首页'
      }
    },
    {
      path: '/design',
      name: 'Design',
      component: () => import('../views/DesignView.vue'),
      meta: {
        title: '门窗设计工具'
      }
    },
    {
      path: '/glass',
      name: 'Glass',
      component: () => import('../views/GlassView.vue'),
      meta: {
        title: '玻璃切割优化'
      }
    },
    {
      path: '/plastic-steel',
      name: 'PlasticSteel',
      component: () => import('../views/PlasticSteelView.vue'),
      meta: {
        title: '塑钢型材切割优化'
      }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
  }
})

export default router
