import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/window-door-design',
      name: 'WindowDoorDesign',
      component: () => import('../views/WindowDoorDesign.vue'),
      meta: {
        title: '门窗设计工具'
      }
    },
    {
      path: '/icon-demo',
      name: 'IconDemo',
      component: () => import('../views/IconDemo.vue'),
      meta: {
        title: '图标系统示例'
      }
    },
  ],
})

export default router
