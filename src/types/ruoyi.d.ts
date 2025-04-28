declare module './ruoyi.js' {
  /**
   * 参数处理
   * @param {*} params 参数
   */
  export function tansParams(params: any): string;

  /**
   * 验证是否为blob格式
   * @param {*} data 数据
   */
  export function blobValidate(data: any): boolean;
} 