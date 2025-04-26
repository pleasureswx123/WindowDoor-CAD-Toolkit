import { get, post, put, del } from '../utils/request'

// 查询用户反馈列表
export function listFeedback(query?: any) {
  return get('/system/feedback/list', query)
}

// 查询用户反馈详细
export function getFeedback(id: string | number) {
  return get(`/system/feedback/${id}`)
}

// 新增用户反馈
export function addFeedback(data: any) {
  return post('/system/feedback', data)
}

// 修改用户反馈
export function updateFeedback(data: any) {
  return put('/system/feedback', data)
}

// 删除用户反馈
export function delFeedback(id: string | number) {
  return del(`/system/feedback/${id}`)
}

// 上传图片
export function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return post('/system/feedback/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
} 