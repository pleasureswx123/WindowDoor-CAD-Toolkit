<script setup lang="ts">
// 中挺组件 - 重构版本
import { computed, ref, onMounted, nextTick } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const store = useWindowDoorStore();
const deviderRef = ref<any>(null);

const props = defineProps<{
  x: number;
  y: number;
  width: number;
  height: number;
  id: number;
}>();

// 计算中挺方向 - 宽度小于高度为垂直中挺，否则为水平中挺
const isVertical = computed(() => props.width < props.height);

// 计算中挺的配置
const rectConfig = computed(() => ({
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
  dragBoundFunc: isVertical.value 
    ? (pos: {x: number, y: number}) => ({ x: pos.x, y: props.y }) // 垂直中挺只能左右移动
    : (pos: {x: number, y: number}) => ({ x: props.x, y: pos.y }), // 水平中挺只能上下移动
  listening: true
}));

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
    node.setAttr('startPos', startPos);
    
    // 日志输出中挺信息
    console.log(`选中中挺 #${props.id}, 尺寸: ${props.width}x${props.height}`);
    console.log(`方向: ${isVertical.value ? '垂直' : '水平'}`);
  } catch (error) {
    console.error('处理点击事件失败:', error);
  }
}

// 拖拽中事件
function handleDragMove(e: any) {
  const target = e.target;
  const devider = store.selectedDevider;
  if (!devider) return;
  
  // 获取初始位置和当前位置
  const startPos = target.getAttr('startPos') || { x: props.x, y: props.y };
  const currentPos = { x: target.x(), y: target.y() };
  
  // 计算相对移动距离
  const moveX = currentPos.x - startPos.x;
  const moveY = currentPos.y - startPos.y;
  
  // 计算移动百分比 - 使用父容器信息
  const parentSection = devider.parentSection;
  if (!parentSection) return;
  
  let newPosition;
  
  if (isVertical.value) {
    // 垂直中挺: 计算水平方向位置百分比
    const totalWidth = parentSection.width;
    const currentX = devider.x + moveX;
    newPosition = (currentX / totalWidth) * 100;
  } else {
    // 水平中挺: 计算垂直方向位置百分比
    const totalHeight = parentSection.height;
    const currentY = devider.y + moveY;
    newPosition = (currentY / totalHeight) * 100;
  }
  
  // 临时更新UI显示，不更新数据模型
  console.log(`拖动中: ${newPosition.toFixed(1)}%`);
}

// 拖拽结束事件
function handleDragEnd(e: any) {
  store.stageDraggable = true;
  
  const target = e.target;
  const devider = store.selectedDevider;
  if (!devider) return;
  
  // 获取初始位置和当前位置
  const startPos = target.getAttr('startPos') || { x: props.x, y: props.y };
  const currentPos = { x: target.x(), y: target.y() };
  
  // 计算相对移动距离
  const moveX = currentPos.x - startPos.x;
  const moveY = currentPos.y - startPos.y;
  
  // 计算移动百分比 - 使用父容器信息
  const parentSection = devider.parentSection;
  if (!parentSection) return;
  
  let newPosition;
  
  if (isVertical.value) {
    // 垂直中挺: 计算水平方向位置百分比
    const totalWidth = parentSection.width;
    const prevSectionWidth = devider.x;
    newPosition = ((prevSectionWidth + moveX) / totalWidth) * 100;
  } else {
    // 水平中挺: 计算垂直方向位置百分比
    const totalHeight = parentSection.height;
    const prevSectionHeight = devider.y;
    newPosition = ((prevSectionHeight + moveY) / totalHeight) * 100;
  }
  
  // 更新中挺位置并触发相邻区域更新
  store.updateDeviderPosition(props.id, Math.max(10, Math.min(90, newPosition)));
  
  // 重置Konva节点位置为props中的位置，以便与数据模型保持一致
  // 这样可以避免UI和数据不一致的情况
  nextTick(() => {
    if (deviderRef.value) {
      const node = deviderRef.value.getNode();
      if (node) {
        node.x(props.x);
        node.y(props.y);
        node.getLayer()?.batchDraw();
      }
    }
  });
}
</script>

<template>
  <v-group @click.stop.prevent @touch.stop.prevent>
    <!-- 中挺主体 -->
    <v-rect 
      ref="deviderRef" 
      :config="rectConfig"
      @mousedown="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd" 
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