import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, register as apiRegister, logout as apiLogout, getCaptcha as apiGetCaptcha, getUserInfo as apiGetUserInfo } from '../api/user'

interface LoginData {
  username: string
  password: string
  code: string
  uuid: string
}

interface RegisterData {
  username: string
  password: string
  confirmPassword: string
  code: string
  uuid: string
}

// 定义返回数据接口
interface LoginResponse {
  token: string
  [key: string]: any
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string>(localStorage.getItem('token') || '')
  const tokenExpireTime = ref<number>(Number(localStorage.getItem('tokenExpireTime')) || 0)
  const userInfo = ref<any>(JSON.parse(localStorage.getItem('userInfo') || '{}'))
  
  // 计算属性
  const isLoggedIn = computed(() => {
    return !!token.value && !isTokenExpired()
  })
  const username = computed(() => userInfo.value.username)
  
  // 检查token是否过期
  function isTokenExpired(): boolean {
    return Date.now() > tokenExpireTime.value
  }
  
  // 设置token和过期时间（1天后过期）
  function setToken(newToken: string) {
    token.value = newToken
    // 设置token过期时间为当前时间 + 24小时（86400000毫秒）
    const expireTime = Date.now() + 86400000 
    tokenExpireTime.value = expireTime
    localStorage.setItem('token', newToken)
    localStorage.setItem('tokenExpireTime', expireTime.toString())
  }
  
  function setUserInfo(info: any) {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }
  
  async function login(loginData: LoginData) {
    try {
      const response = await apiLogin(loginData) as unknown as LoginResponse
      setToken(response.token)
      await getInfo() // 登录后获取用户信息
      return Promise.resolve(response)
    } catch (error) {
      return Promise.reject(error)
    }
  }
  
  async function register(registerData: RegisterData) {
    try {
      const res = await apiRegister(registerData)
      return Promise.resolve(res)
    } catch (error) {
      return Promise.reject(error)
    }
  }
  
  async function getCaptcha() {
    try {
      const res = await apiGetCaptcha()
      return Promise.resolve(res)
    } catch (error) {
      return Promise.reject(error)
    }
  }
  
  async function getInfo() {
    try {
      const res = await apiGetUserInfo()
      setUserInfo(res)
      return Promise.resolve(res)
    } catch (error) {
      return Promise.reject(error)
    }
  }
  
  async function logout() {
    try {
      await apiLogout()
      resetState()
      return Promise.resolve()
    } catch (error) {
      resetState()
      return Promise.reject(error)
    }
  }
  
  // 重置状态
  function resetState() {
    token.value = ''
    tokenExpireTime.value = 0
    userInfo.value = {}
    localStorage.removeItem('token')
    localStorage.removeItem('tokenExpireTime')
    localStorage.removeItem('userInfo')
  }
  
  // 检查登录状态，包括token是否过期
  function checkLogin() {
    if (isTokenExpired() && token.value) {
      // 如果token已过期但存在，执行登出操作
      resetState()
      return false
    }
    return isLoggedIn.value
  }
  
  // 仅用于测试：设置token即将过期
  function setTokenToExpireSoon() {
    if (token.value) {
      // 设置token将在10秒后过期
      const expireTime = Date.now() + 10000
      tokenExpireTime.value = expireTime
      localStorage.setItem('tokenExpireTime', expireTime.toString())
      return true
    }
    return false
  }
  
  return {
    token,
    userInfo,
    isLoggedIn,
    username,
    login,
    register,
    getCaptcha,
    getInfo,
    logout,
    checkLogin,
    isTokenExpired,
    setTokenToExpireSoon
  }
}) 