/**
 * 提供Element Plus相关的类型声明
 */

// 添加zh-cn.mjs模块的声明
declare module 'element-plus/dist/locale/zh-cn.mjs' {
  const zhCn: any;
  export default zhCn;
}

// 声明Element Plus图标组件类型
declare module '@element-plus/icons-vue' {
  import { Component } from 'vue';
  
  // 定义图标组件的共享结构
  interface IconComponent extends Component {
    name: string;
  }
  
  // 导出所有图标组件
  export const Plus: IconComponent;
  export const Minus: IconComponent;
  export const Close: IconComponent;
  export const Edit: IconComponent;
  export const Search: IconComponent;
  export const Delete: IconComponent;
  export const Setting: IconComponent;
  export const ArrowUp: IconComponent;
  export const ArrowDown: IconComponent;
  export const ArrowLeft: IconComponent;
  export const ArrowRight: IconComponent;
  export const ZoomIn: IconComponent;
  export const ZoomOut: IconComponent;
  export const Refresh: IconComponent;
  export const FullScreen: IconComponent;
  export const Download: IconComponent;
  export const Upload: IconComponent;
  // 可以在此处添加更多图标组件
} 