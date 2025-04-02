import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
      // 这里应该是实际的API调用
      // 示例：const res = await api.post('/login', loginData)
      // 模拟登录成功
      const mockResponse = {
        token: 'mock_token_' + Date.now(),
        user: {
          id: 1,
          username: loginData.username,
          nickname: '用户' + loginData.username,
          avatar: '',
          permissions: ['user']
        }
      }
      
      setToken(mockResponse.token)
      setUserInfo(mockResponse.user)
      return Promise.resolve(mockResponse)
    } catch (error) {
      return Promise.reject(error)
    }
  }
  
  async function register(registerData: RegisterData) {
    try {
      // 这里应该是实际的API调用
      // 示例：const res = await api.post('/register', registerData)
      // 模拟注册成功
      return Promise.resolve({
        success: true,
        message: '注册成功'
      })
    } catch (error) {
      return Promise.reject(error)
    }
  }
  
  async function getCaptcha() {
    try {
      // 这里应该是实际的API调用
      // 示例：const res = await api.get('/captcha')
      // 模拟获取验证码
      const uuid = 'uuid_' + Date.now()
      const captchaUrl = `data:image/png;base64,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`
      
      return Promise.resolve({
        uuid,
        captchaUrl
      })
    } catch (error) {
      return Promise.reject(error)
    }
  }
  
  function logout() {
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
    logout,
    checkLogin
  }
}) 