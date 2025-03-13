<script setup lang="ts">
// 中挺组件 - 重构版本
import { ref, computed, onMounted, nextTick } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import Konva from 'konva';

const props = defineProps<{
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}>();

// 获取窗户状态管理器
const store = useWindowDoorStore();

// 判断中挺方向
const isVertical = computed(() => props.width < props.height);
const dividerRef = ref<any>(null);

// 计算中挺的配置
const rectConfig = computed(() => {
  return {
    x: props.x,
    y: props.y,
    width: props.width,
    height: props.height,
    fill: '#e8e8e8',
    stroke: props.id === store.selectedDeviderId ? '#4a90e2' : '#999',
    strokeWidth: props.id === store.selectedDeviderId ? 2 : 1,
    id: `devider-${props.id}`,
    deviderId: props.id,
    name: 'devider',
    draggable: true, // 允许拖拽
    // 拖拽约束函数 - 限制中挺只能在特定方向移动
    dragBoundFunc: function(pos: {x: number, y: number}): {x: number, y: number} {
      // 在Konva拖动函数中，this上下文指向Konva节点实例
      // 但在TypeScript中我们需要明确类型
      const node = this as any; // Konva节点
      
      // 在拖动过程中，我们尝试保持中挺在其指定方向上的坐标不变
      // 使用当前绝对位置而非props，确保坐标系一致性
      let currentY = props.y;
      let currentX = props.x;
      
      try {
        // 尝试获取节点的绝对位置，如果可用的话
        if (node && typeof node.getAbsolutePosition === 'function') {
          const absPos = node.getAbsolutePosition();
          currentX = absPos.x;
          currentY = absPos.y;
        }
      } catch (error) {
        console.log('获取节点位置失败，使用props坐标代替');
      }
      
      if (isVertical.value) {
        // 垂直中挺只能水平移动（x坐标跟随鼠标，y坐标固定）
        return {
          x: pos.x, // 允许水平方向移动
          y: currentY // 保持原始y坐标不变
        };
      } else {
        // 水平中挺只能垂直移动（y坐标跟随鼠标，x坐标固定）
        return {
          x: currentX, // 保持原始x坐标不变
          y: pos.y // 允许垂直方向移动
        };
      }
    },
    listening: true
  };
});

// 查找当前中挺的父区域
function findParentSection(rootSection: any, deviderId: number): any {
  if (!rootSection || !rootSection.sections) return null;
  
  // 在当前层级查找
  for (let i = 0; i < rootSection.sections.length; i++) {
    const child = rootSection.sections[i];
    if (child.nodeType === 'devider' && child.id === deviderId) {
      return rootSection; // 返回父区域
    }
  }
  
  // 递归查找子区域
  for (let i = 0; i < rootSection.sections.length; i++) {
    const child = rootSection.sections[i];
    if (child.nodeType === 'section') {
      const result = findParentSection(child, deviderId);
      if (result) return result;
    }
  }
  
  return null;
}

// 拖拽开始事件
function handleDragStart(e: any) {
  // 阻止事件冒泡
  e.cancelBubble = true;
  store.stageDraggable = false;
  
  // 选中中挺
  store.selectedDeviderId = props.id;
  
  try {
    // 获取Konva节点
    const node = e.target;

    // 获取初始位置
    const startPos = {
      x: node.x(),
      y: node.y()
    };
    // 记录初始位置用于计算位移
    store.dragStartPos = startPos;
    
    // 记录当前节点的父区域
    const parentSection = findParentSection(store.root, props.id);
    if (parentSection) {
      store.dragParentSection = parentSection;
      console.log('开始拖动中挺', props.id, '父区域:', parentSection.id);
    }
  } catch (error) {
    console.error('拖拽开始事件处理错误:', error);
  }
}

// 拖拽中事件
function handleDragMove(e: any) {
  try {
    // 获取Konva节点
    const node = e.target;
    const currentPos = {
      x: node.x(),
      y: node.y()
    };
    
    // 计算中挺在父容器中的相对位置（百分比）
    if (store.dragParentSection) {
      // 获取父区域
      const parent = store.dragParentSection;
      
      // 计算相对位置
      let percentage = 0;
      
      if (isVertical.value) {
        // 垂直中挺 - 计算水平方向位置百分比
        // 计算中挺相对于父区域左边界的偏移量
        const offsetFromLeft = currentPos.x - parent.x;
        // 计算相对父区域宽度的百分比
        percentage = (offsetFromLeft / parent.width) * 100;
      } else {
        // 水平中挺 - 计算垂直方向位置百分比
        // 计算中挺相对于父区域顶部边界的偏移量
        const offsetFromTop = currentPos.y - parent.y;
        // 计算相对父区域高度的百分比
        percentage = (offsetFromTop / parent.height) * 100;
      }
      
      // 限制百分比在有效范围内 (10%-90%)
      percentage = Math.max(10, Math.min(90, percentage));
      
      // 临时更新UI显示 (最终位置会在dragend时更新到store)
      console.log('拖动中:', percentage.toFixed(2) + '%');
    }
  } catch (error) {
    console.error('拖拽移动事件处理错误:', error);
  }
}

// 拖拽结束事件
function handleDragEnd(e: any) {
  // 恢复舞台拖动功能
  store.stageDraggable = true;
  
  try {
    // 获取Konva节点
    const node = e.target;
    
    // 获取当前位置
    const endPos = {
      x: node.x(),
      y: node.y()
    };
    
    // 计算中挺在父容器中的相对位置（百分比）
    if (store.dragParentSection) {
      // 获取父区域
      const parent = store.dragParentSection;
      
      // 计算相对位置
      let percentage = 0;
      
      if (isVertical.value) {
        // 垂直中挺 - 计算水平方向位置百分比
        // 计算中挺相对于父区域左边界的偏移量
        const offsetFromLeft = endPos.x - parent.x;
        // 计算相对父区域宽度的百分比
        percentage = (offsetFromLeft / parent.width) * 100;
      } else {
        // 水平中挺 - 计算垂直方向位置百分比
        // 计算中挺相对于父区域顶部边界的偏移量
        const offsetFromTop = endPos.y - parent.y;
        // 计算相对父区域高度的百分比
        percentage = (offsetFromTop / parent.height) * 100;
      }
      
      // 限制百分比在有效范围内 (10%-90%)
      percentage = Math.max(10, Math.min(90, percentage));
      
      // 更新中挺位置
      console.log('更新中挺位置:', percentage.toFixed(2) + '%');
      store.updateDeviderPosition(props.id, percentage);
    }
    
    // 清除拖拽状态
    store.dragStartPos = null;
    store.dragParentSection = null;
  } catch (error) {
    console.error('拖拽结束事件处理错误:', error);
  }
}
</script>

<template>
  <v-group>
    <!-- 中挺主体 - 配置了拖拽相关事件 -->
    <v-rect 
      ref="dividerRef" 
      :config="rectConfig"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @mousedown="handleDragStart"
    />

    <!-- 选中指示器 -->
    <v-circle 
      v-if="store.selectedDeviderId === props.id" 
      :config="{
        x: props.x + props.width / 2,
        y: props.y + props.height / 2,
        radius: 6,
        fill: '#4a90e2',
        stroke: 'white',
        strokeWidth: 1,
        listening: false
      }" 
    />
    
    <!-- 拖拽手柄 -->
    <v-rect
      v-if="store.selectedDeviderId === props.id"
      :config="{
        x: isVertical ? props.x + props.width / 2 - 10 : props.x + props.width / 2 - 30,
        y: isVertical ? props.y + props.height / 2 - 30 : props.y + props.height / 2 - 10,
        width: isVertical ? 20 : 60,
        height: isVertical ? 60 : 20,
        fill: 'rgba(74, 144, 226, 0.3)',
        stroke: '#4a90e2',
        strokeWidth: 1,
        cornerRadius: 3,
        listening: false
      }"
    />
  </v-group>
</template> 