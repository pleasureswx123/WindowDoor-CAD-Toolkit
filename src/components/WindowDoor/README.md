# 门窗设计工具

## 功能概述

这是一个基于Vue 3、Pinia和Vue Konva的门窗设计工具，用于门窗行业的工程制图。该工具允许用户：

1. 创建和编辑门窗布局
2. 调整框架尺寸和类型
3. 按垂直或水平方向分割区域
4. 设置不同的开启方式（左开、右开、倾斜等）
5. 自动显示度量标注

## 组件结构

```
WindowDoor/
├── WindowDoorApp.vue      # 入口组件
├── RootFrame.vue          # 主画布框架组件
├── Section.vue            # 区域组件
├── SectionEdit.vue        # 区域编辑控制组件
├── Sash.vue               # 窗框组件
├── Glass.vue              # 玻璃组件
├── Handle.vue             # 把手组件
├── OpeningDirection.vue   # 开启方向组件
├── Devider.vue            # 分隔线组件
├── Metrics.vue            # 度量组件
├── VerticalMetric.vue     # 垂直度量组件
└── HorizontalMetric.vue   # 水平度量组件
```

## 状态管理

使用Pinia进行状态管理，主要存储：

```typescript
// src/stores/windowDoorStore.ts
```

这个存储维护了整个门窗设计的数据结构，包括区域、分隔线、选中状态等。

## 使用方法

1. 在路由中访问 `/window-door-design` 进入设计界面
2. 点击任意区域进行选择
3. 使用控制面板更改区域类型和框架尺寸
4. 使用"垂直分割"或"水平分割"按钮创建复杂布局
5. 查看自动生成的尺寸标注

## 扩展点

1. 添加保存和加载功能
2. 增加更多的门窗类型和开启方式
3. 支持更复杂的尺寸约束
4. 添加材质和配件选择
5. 集成报价计算功能

## 参考资料

此组件基于React版本的同类工具重新实现，使用了Vue 3的组合式API和Pinia状态管理。 