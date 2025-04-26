import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '../stores/userStore'

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
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue'),
      meta: {
        title: '登录'
      }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/RegisterView.vue'),
      meta: {
        title: '注册'
      }
    },
    {
      path: '/design',
      name: 'Design',
      component: () => import('../views/DesignView.vue'),
      meta: {
        title: '门窗设计工具',
        requiresAuth: true
      }
    },
    {
      path: '/glass',
      name: 'Glass',
      component: () => import('../views/GlassView.vue'),
      meta: {
        title: '玻璃切割优化',
        requiresAuth: true
      }
    },
    {
      path: '/plastic-steel',
      name: 'PlasticSteel',
      component: () => import('../views/PlasticSteelView.vue'),
      meta: {
        title: '塑钢型材切割优化',
        requiresAuth: true
      }
    },
    {
      path: '/feedback',
      name: 'Feedback',
      component: () => import('../views/FeedbacklView.vue'),
      meta: {
        title: '反馈问题',
        requiresAuth: true
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

// 路由导航守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 每次路由导航前检查token是否过期
  userStore.checkLogin()
  
  // 检查该路由是否需要登录
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 如果需要登录但用户未登录，重定向到登录页面
    if (!userStore.isLoggedIn) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      next()
    }
  } else {
    // 不需要登录的路由直接放行
    next()
  }
})

// 设置页面标题
router.afterEach((to) => {
  document.title = `${to.meta.title || '门窗设计系统'}`
})

export default router
