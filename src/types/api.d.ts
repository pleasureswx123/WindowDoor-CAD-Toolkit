/**
 * API响应类型声明
 */

// 通用响应格式
export interface ApiResponse<T = any> {
  code: number;
  data?: T;
  rows?: any[];
  total?: number;
  msg?: string;
  error?: string;
  url?: string;
  img?: string;  // 用于验证码
  uuid?: string; // 用于验证码
}

// axios响应类型扩展
import { AxiosResponse } from 'axios';

declare module 'axios' {
  export interface AxiosResponse<T = any> extends ApiResponse<T> {
    code?: number;
    data?: T;
    rows?: any[];
    total?: number;
    msg?: string;
    url?: string;
    img?: string;
    uuid?: string;
  }
} 