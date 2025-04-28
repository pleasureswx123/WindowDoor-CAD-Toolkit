/**
 * 接口响应通用格式
 */
export interface ApiResponse<T = any> {
  /** 状态码 */
  code: number;
  /** 数据 */
  data?: T;
  /** 消息 */
  msg?: string;
  /** 错误信息 */
  error?: string;
  /** URL (可选) */
  url?: string;
}

/**
 * 分页数据结构
 */
export interface PaginationData<T = any> {
  /** 当前页码 */
  current: number;
  /** 每页大小 */
  size: number;
  /** 总记录数 */
  total: number;
  /** 总页数 */
  pages: number;
  /** 数据列表 */
  records: T[];
}

/**
 * 分页参数
 */
export interface PaginationParams {
  /** 当前页码 */
  current?: number;
  /** 每页大小 */
  size?: number;
  /** 排序字段 */
  sortField?: string;
  /** 排序方式 */
  sortOrder?: 'asc' | 'desc';
  /** 查询关键字 */
  keyword?: string;
}

/**
 * 反馈表单数据
 */
export interface FeedbackForm {
  /** 反馈ID */
  id?: string | number;
  /** 反馈类型 */
  feedbackType: string;
  /** 反馈描述 */
  description: string;
  /** 优先级 */
  priority: string;
  /** 联系方式 */
  contact?: string;
  /** 图片URL */
  imageUrl?: string;
  /** 状态 */
  status?: string;
  /** 图片文件对象 */
  file?: File;
  /** 创建时间 */
  createTime?: string;
  /** 处理状态描述 */
  statusLabel?: string;
} 