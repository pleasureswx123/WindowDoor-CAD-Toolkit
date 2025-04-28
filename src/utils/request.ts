import axios from 'axios'
import { useUserStore } from '../stores/userStore'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
// @ts-expect-error: 已在 types/cache.d.ts 提供类型声明
import cache from './cache.js'
// @ts-expect-error: 已在 types/ruoyi.d.ts 提供类型声明
import { tansParams, blobValidate } from './ruoyi.js'

// 是否显示重新登录
export let isRelogin = { show: false }

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
    // 是否需要设置 token
    const isToken = (config.headers || {}).isToken === false
    // 是否需要防止数据重复提交
    const isRepeatSubmit = (config.headers || {}).repeatSubmit === false

    const userStore = useUserStore()
    if (userStore.token && !isToken) {
      // 设置token到请求头
      config.headers['Authorization'] = 'Bearer ' + userStore.token
    }

    // get请求映射params参数
    if (config.method === 'get' && config.params) {
      let url = config.url + '?' + tansParams(config.params)
      url = url.slice(0, -1)
      config.params = {}
      config.url = url
    }

    if (!isRepeatSubmit && (config.method === 'post' || config.method === 'put')) {
      const requestObj = {
        url: config.url,
        data: typeof config.data === 'object' ? JSON.stringify(config.data) : config.data,
        time: new Date().getTime()
      }
      const requestSize = Object.keys(JSON.stringify(requestObj)).length
      const limitSize = 5 * 1024 * 1024 // 限制5M

      if (requestSize >= limitSize) {
        console.warn(`[${config.url}]: 请求数据大小超出允许的5M限制，无法进行防重复提交验证。`)
        return config
      }

      const sessionObj = cache.session.getJSON('sessionObj')
      if (!sessionObj) {
        cache.session.setJSON('sessionObj', requestObj)
      } else {
        const s_url = sessionObj.url
        const s_data = sessionObj.data
        const s_time = sessionObj.time
        const interval = 1000

        if (s_data === requestObj.data && requestObj.time - s_time < interval && s_url === requestObj.url) {
          const message = '数据正在处理，请勿重复提交'
          console.warn(`[${s_url}]: ${message}`)
          return Promise.reject(new Error(message))
        } else {
          cache.session.setJSON('sessionObj', requestObj)
        }
      }
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
    const code = res.code || 200

    // 二进制数据则直接返回
    if (response.request.responseType === 'blob' || response.request.responseType === 'arraybuffer') {
      return res
    }

    if (code === 401) {
      if (!isRelogin.show) {
        isRelogin.show = true
        ElMessageBox.confirm(
          '登录状态已过期，您可以继续留在该页面，或者重新登录',
          '系统提示',
          {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          isRelogin.show = false
          const userStore = useUserStore()
          userStore.logout().then(() => {
            location.href = '/index'
          })
        }).catch(() => {
          isRelogin.show = false
        })
      }
      return Promise.reject('无效的会话，或者会话已过期，请重新登录。')
    } else if (code === 500) {
      ElMessage.error(res.msg || '系统错误')
      return Promise.reject(new Error(res.msg || '系统错误'))
    } else if (code === 601) {
      ElMessage.warning(res.msg || '系统警告')
      return Promise.reject('error')
    } else if (code !== 200) {
      ElMessage.error(res.msg || '未知错误')
      return Promise.reject('error')
    } else {
      return res
    }
  },
  error => {
    console.error('响应错误', error)
    let { message } = error

    if (message === 'Network Error') {
      message = '后端接口连接异常'
    } else if (message.includes('timeout')) {
      message = '系统接口请求超时'
    } else if (message.includes('Request failed with status code')) {
      message = '系统接口' + message.substr(message.length - 3) + '异常'
    }

    ElMessage({
      message,
      type: 'error',
      duration: 5000
    })
    return Promise.reject(error)
  }
)

// 封装GET请求
export function get(url: string, params?: any, config?: any) {
  return service({
    url,
    method: 'get',
    params,
    ...config
  })
}

// 封装POST请求
export function post(url: string, data?: any, config?: any) {
  return service({
    url,
    method: 'post',
    data,
    ...config
  })
}

// 封装PUT请求
export function put(url: string, data?: any, config?: any) {
  return service({
    url,
    method: 'put',
    data,
    ...config
  })
}

// 封装DELETE请求
export function del(url: string, data?: any, config?: any) {
  return service({
    url,
    method: 'delete',
    data,
    ...config
  })
}

export default service 