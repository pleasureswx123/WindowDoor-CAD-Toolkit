import { get, post } from '../utils/request'

// 登录接口
export function login(data: {
  username: string
  password: string
  code: string
  uuid: string
}) {
  return post('/login', data, {
    headers: {
      isToken: false,
      repeatSubmit: false
    }
  })
}

// 注册接口
export function register(data: {
  username: string
  password: string
  confirmPassword: string
  code: string
  uuid: string
}) {
  return post('/register', data, {
    headers: {
      isToken: false
    }
  })
}

// 退出登录
export function logout() {
  return post('/logout')
}

// 获取验证码
export function getCaptcha() {
  return get('/captchaImage', {
    headers: {
      isToken: false
    },
    timeout: 20000
  })
}

// 获取用户信息
export function getUserInfo() {
  return get('/getInfo')
}

// 获取用户路由权限
export function getUserRouters() {
  return get('/getRouters')
} 