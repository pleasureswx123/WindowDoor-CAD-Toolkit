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

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<any>(JSON.parse(localStorage.getItem('userInfo') || '{}'))
  
  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value.username)
  
  // 动作
  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }
  
  function setUserInfo(info: any) {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }
  
  async function login(loginData: LoginData) {
    try {
      const res = await apiLogin(loginData)
      setToken(res.token)
      await getInfo() // 登录后获取用户信息
      return Promise.resolve(res)
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
    userInfo.value = {}
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }
  
  function checkLogin() {
    return isLoggedIn.value
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
    checkLogin
  }
}) 