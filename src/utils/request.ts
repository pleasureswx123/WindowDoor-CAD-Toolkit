import axios from 'axios'
import { useUserStore } from '../stores/userStore'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    if (userStore.token) {
      // 设置token到请求头
      config.headers['Authorization'] = 'Bearer ' + userStore.token
    }
    return config
  },
  error => {
    console.error('请求错误', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    
    // 根据后端的约定处理响应数据
    // 假设后端返回格式为 { code: number, msg: string, data: any }
    if (res.code !== 200) {
      // 处理错误情况
      console.error('后端响应错误', res.msg || '未知错误')
      
      // 特殊错误处理
      if (res.code === 401) {
        // token失效，需要重新登录
        const userStore = useUserStore()
        userStore.logout()
      }
      
      return Promise.reject(new Error(res.msg || '未知错误'))
    } else {
      return res
    }
  },
  error => {
    console.error('响应错误', error)
    
    // 处理HTTP错误状态码
    if (error.response) {
      const status = error.response.status
      
      if (status === 401) {
        // 未授权，需要重新登录
        const userStore = useUserStore()
        userStore.logout()
      }
      
      if (status === 500) {
        console.error('服务器错误', error.response.data)
      }
    }
    
    return Promise.reject(error)
  }
)

// 封装GET请求
export function get(url: string, params?: any) {
  return service({
    url,
    method: 'get',
    params
  })
}

// 封装POST请求
export function post(url: string, data?: any) {
  return service({
    url,
    method: 'post',
    data
  })
}

// 封装PUT请求
export function put(url: string, data?: any) {
  return service({
    url,
    method: 'put',
    data
  })
}

// 封装DELETE请求
export function del(url: string, data?: any) {
  return service({
    url,
    method: 'delete',
    data
  })
}

export default service 