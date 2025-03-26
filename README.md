# 门窗设计工具

一个基于Vue 3 + TypeScript + Konva的专业门窗设计工具，用于创建和编辑门窗的CAD效果图。

## 功能特点

- 🎨 专业的门窗设计界面
- 📏 精确的尺寸标注系统
- 🎯 智能吸附对齐
- 🔄 实时预览
- 📊 材料统计
- 💾 设计方案保存与加载
- 🖼️ 多种视图模式
- 🛠️ 丰富的设计工具

## 技术栈

- Vue 3.5.13
- TypeScript 5.7.3
- Vite 6.1.0
- Element Plus 2.9.6
- vue-konva 3.2.0
- Konva 9.3.18
- Pinia 3.0.1
- Vue Router 4.5.0

## 项目结构

```
src/
├── assets/        # 静态资源
├── components/    # 组件
│   ├── WindowCanvas.vue        # 画布主组件
│   ├── DesignToolbar.vue      # 设计工具栏
│   ├── SettingPanel.vue       # 设置面板
│   ├── MaterialStatsTable.vue # 材料统计表
│   └── AnnotationMarker.vue   # 标注组件
├── stores/        # 状态管理
├── types/         # 类型定义
├── utils/         # 工具函数
├── views/         # 页面视图
└── router/        # 路由配置
```

## 开发环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

## 安装

```bash
# 安装依赖
cnpm install
```

## 开发

```bash
# 启动开发服务器
cnpm run dev
```

## 构建

```bash
# 构建生产版本
cnpm run build
```

## 预览

```bash
# 预览生产构建
cnpm run preview
```

## 主要功能模块

### 1. 画布系统 (WindowCanvas)
- 支持缩放、平移
- 智能吸附对齐
- 实时预览
- 标注系统

### 2. 设计工具栏 (DesignToolbar)
- 分割工具
- 中挺设置
- 材料选择
- 样式调整

### 3. 设置面板 (SettingPanel)
- 窗户属性设置
- 材料参数配置
- 样式定制
- 保存加载

### 4. 材料统计 (MaterialStatsTable)
- 实时材料用量计算
- 成本估算
- 数据导出

## 使用说明

1. 创建新项目
2. 设置基础参数
3. 使用分割工具设计布局
4. 添加中挺和配件
5. 调整材料和样式
6. 添加标注
7. 导出设计方案

## 注意事项

- 保存前请确保所有参数设置正确
- 建议定期保存设计方案
- 大型项目可能需要更多的系统资源

## 许可证

[MIT License](LICENSE) 