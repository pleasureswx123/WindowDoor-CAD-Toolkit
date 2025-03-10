<script setup lang="ts">
// 根框架组件 - 对应React版本中的RootFrame.jsx
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import Section from './Section.vue';
import Sash from './Sash.vue';
import Metrics from './Metrics.vue';
import FrameSizeControl from './utils/FrameSizeControl.vue';
import MetricsControl from './utils/MetricsControl.vue';
import { useEventListener } from '@vueuse/core';

const store = useWindowDoorStore();
const containerRef = ref<HTMLDivElement | null>(null);
const stageRef = ref<any>(null);

// 舞台尺寸状态
const stageSize = ref({
  width: 100,
  height: 500
});

// 添加缩放和平移状态
const scale = ref(1);
const position = ref({ x: 0, y: 0 });
const lastMousePosition = ref({ x: 0, y: 0 });
const isDragging = ref(false);
// 控制网格显示
const showGrid = ref(false);

// 初始化时获取容器宽度并监听窗口大小变化
onMounted(() => {
  // 确保root对象已正确初始化
  if (!store.root.sections || store.root.sections.length === 0) {
    console.log('初始化窗户布局');
    store.initializeWindowWithSections('default');
  }
  
  // 延迟更新舞台尺寸，确保DOM已经渲染
  nextTick(() => {
    updateStageDimensions();
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateStageDimensions);
  });
  
  // 清理事件监听
  return () => {
    window.removeEventListener('resize', updateStageDimensions);
  };
});

// 更新舞台尺寸
const updateStageDimensions = () => {
  if (containerRef.value) {
    stageSize.value = {
      width: containerRef.value.offsetWidth,
      height: containerRef.value.offsetHeight || 600
    };
    
    // 自动居中画布
    resetZoom();
  }
};

// 监听存储中窗户尺寸变化
watch(() => [store.root.width, store.root.height], () => {
  // 当窗户尺寸变化时，可能需要调整缩放
  nextTick(updateStageDimensions);
});

// 处理舞台点击事件，用于取消选择
const handleClick = (e: any) => {
  // 获取目标节点
  const target = e.target;
  
  // 如果已经被子组件处理了，就不再处理
  if (e.cancelBubble) {
    return;
  }
  
  // 如果没有被子组件处理且不是section，则取消选择
  // 检查名称是否包含"section"
  const targetName = target.name && target.name();
  const isSection = targetName && targetName.indexOf('section') >= 0;
  
  if (!isSection) {
    store.selectedSectionId = null;
  }
};

// 处理鼠标滚轮缩放
const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  
  const scaleBy = 1.05;
  const oldScale = scale.value;
  
  // 计算新的缩放比例
  const newScale = e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
  scale.value = Math.min(Math.max(newScale, 0.1), 5); // 限制缩放范围
  
  // 计算鼠标位置相对于舞台的位置
  const stage = stageRef.value.getStage();
  const pointer = stage.getPointerPosition();
  
  // 获取鼠标在画布上的位置
  const mousePointTo = {
    x: (pointer.x - position.value.x) / oldScale,
    y: (pointer.y - position.value.y) / oldScale
  };
  
  // 计算新的位置，保持鼠标所指位置不变
  position.value = {
    x: pointer.x - mousePointTo.x * scale.value,
    y: pointer.y - mousePointTo.y * scale.value
  };
};

// 处理画布拖动开始
const handleDragStart = (e: any) => {
  // 只有在非选择状态下才允许拖动画布
  if (!store.selectedSectionId) {
    isDragging.value = true;
    const stage = stageRef.value.getStage();
    const pointer = stage.getPointerPosition();
    lastMousePosition.value = {
      x: pointer.x,
      y: pointer.y
    };
  }
};

// 处理画布拖动
const handleDragMove = (e: any) => {
  if (isDragging.value) {
    e.evt.preventDefault();
    const stage = stageRef.value.getStage();
    const pointer = stage.getPointerPosition();
    
    // 计算鼠标移动差值
    const dx = pointer.x - lastMousePosition.value.x;
    const dy = pointer.y - lastMousePosition.value.y;
    
    // 更新位置
    position.value = {
      x: position.value.x + dx,
      y: position.value.y + dy
    };
    
    // 更新上一次鼠标位置
    lastMousePosition.value = {
      x: pointer.x,
      y: pointer.y
    };
  }
};

// 处理画布拖动结束
const handleDragEnd = () => {
  isDragging.value = false;
};

// 重置缩放和位置
const resetZoom = () => {
  // 计算合适的初始缩放比例
  const padding = 60;
  const windowWidth = store.root?.width || 800;
  const windowHeight = store.root?.height || 600;
  
  const stageWidthWithPadding = stageSize.value.width - padding * 2;
  const stageHeightWithPadding = stageSize.value.height - padding * 2;
  
  const widthRatio = stageWidthWithPadding / windowWidth;
  const heightRatio = stageHeightWithPadding / windowHeight;
  
  scale.value = Math.min(widthRatio, heightRatio, 1);
  
  // 计算居中位置
  position.value = {
    x: (stageSize.value.width - windowWidth * scale.value) / 2,
    y: (stageSize.value.height - windowHeight * scale.value) / 2
  };
};

// 放大
const zoomIn = () => {
  scale.value = Math.min(scale.value * 1.2, 5);
  
  // 保持居中
  updateCenterPosition();
};

// 缩小
const zoomOut = () => {
  scale.value = Math.max(scale.value / 1.2, 0.1);
  
  // 保持居中
  updateCenterPosition();
};

// 保持窗户在缩放时居中
const updateCenterPosition = () => {
  const windowWidth = store.root?.width || 800;
  const windowHeight = store.root?.height || 600;
  
  position.value = {
    x: (stageSize.value.width - windowWidth * scale.value) / 2,
    y: (stageSize.value.height - windowHeight * scale.value) / 2
  };
};

// 切换网格显示
const toggleGrid = () => {
  showGrid.value = !showGrid.value;
};

// 将方法暴露给父组件
defineExpose({
  zoomIn,
  zoomOut,
  resetZoom,
  toggleGrid
});

// 用于生成网格线的计算属性
const gridLines = computed(() => {
  if (!showGrid.value) return [];
  
  const windowWidth = store.root?.width || 800;
  const windowHeight = store.root?.height || 600;
  const gridSize = 50; // 网格大小（毫米）
  const lines = [];
  
  // 垂直线
  for (let x = 0; x <= windowWidth; x += gridSize) {
    lines.push({ x1: x, y1: 0, x2: x, y2: windowHeight, strokeWidth: x % 100 === 0 ? 1 : 0.5 });
  }
  
  // 水平线
  for (let y = 0; y <= windowHeight; y += gridSize) {
    lines.push({ x1: 0, y1: y, x2: windowWidth, y2: y, strokeWidth: y % 100 === 0 ? 1 : 0.5 });
  }
  
  return lines;
});

// 为鼠标滚轮事件添加事件监听
useEventListener(containerRef, 'wheel', handleWheel, { passive: false });
</script>

<template>
  <div ref="containerRef" class="root-frame-container">
    <v-stage
      :config="{
        width: stageSize.width,
        height: stageSize.height,
        draggable: true
      }"
      ref="stageRef"
      @click="handleClick"
      @mousedown="handleDragStart"
      @mousemove="handleDragMove"
      @mouseup="handleDragEnd"
      @mouseleave="handleDragEnd"
      @touchstart="handleDragStart"
      @touchmove="handleDragMove"
      @touchend="handleDragEnd"
    >
      <v-layer 
        :config="{
          scaleX: scale,
          scaleY: scale,
          x: position.x,
          y: position.y
        }"
      >
        <!-- 背景 - 用于点击取消选择 -->
        <v-rect 
          :config="{
            width: (store.root.width || 0) + 300,
            height: (store.root.height || 0) + 300,
            x: -150,
            y: -150,
            name: 'background',
            fill: '#f8f8f8'
          }"
        />
        
        <!-- 网格线 -->
        <template v-if="showGrid">
          <v-line
            v-for="(line, index) in gridLines"
            :key="'grid-' + index"
            :config="{
              points: [line.x1, line.y1, line.x2, line.y2],
              stroke: '#ccc',
              strokeWidth: line.strokeWidth,
              opacity: 0.5
            }"
          />
        </template>
        
        <!-- 主区域 -->
        <Section
          v-if="store.root.sections && store.root.sections[0]"
          :section="store.root.sections[0]"
          :x="store.root.frameSize || 0"
          :y="store.root.frameSize || 0"
        />
        
        <!-- 主框架 -->
        <Sash
          :width="store.root.width || 0"
          :height="store.root.height || 0"
          :size="store.root.frameSize || 0"
          :isRoot="true"
        />
        
        <!-- 度量标注 -->
        <Metrics />
        
        <!-- 框架尺寸控制 - 放在右上角 -->
        <FrameSizeControl
          :x="(store.root.width || 0) - 10"
          :y="10"
        />
      </v-layer>
    </v-stage>
    
    <!-- 中心点十字线（帮助用户定位中心） -->
    <div v-if="scale < 0.3" class="center-indicator">
      <div class="center-line horizontal"></div>
      <div class="center-line vertical"></div>
    </div>
    
    <!-- 缩放指示器 -->
    <div class="zoom-indicator">{{ Math.round(scale * 100) }}%</div>
  </div>
</template>

<style scoped>
.root-frame-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
  background-color: #f0f0f0;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  cursor: grab;
}

.root-frame-container:active {
  cursor: grabbing;
}

/* 中心点十字线 */
.center-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
  opacity: 0.4;
}

.center-line {
  position: absolute;
  background-color: rgba(255, 0, 0, 0.7);
}

.center-line.horizontal {
  width: 40px;
  height: 1px;
  top: 0;
  left: -20px;
}

.center-line.vertical {
  width: 1px;
  height: 40px;
  top: -20px;
  left: 0;
}

/* 缩放指示器 */
.zoom-indicator {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
}
</style> 