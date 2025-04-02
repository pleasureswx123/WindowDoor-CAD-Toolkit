import { useUserStore } from '../stores/userStore'
import type { Router } from 'vue-router'

// 检查是否已登录，如果没有登录，跳转到登录页面
export function checkLoginAndRedirect(router: Router, callback?: () => void) {
  const userStore = useUserStore()
  
  if (userStore.isLoggedIn) {
    if (callback) callback()
  } else {
    router.push({
      path: '/login',
      query: { redirect: router.currentRoute.value.fullPath }
    })
  }
} 