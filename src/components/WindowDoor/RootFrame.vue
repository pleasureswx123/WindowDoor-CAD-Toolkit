<script setup lang="ts">
// 根框架组件 - 对应React版本中的RootFrame.jsx
import { ref, onMounted, computed, watch, nextTick, onUnmounted } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import Section from './Section.vue';
import Sash from './Sash.vue';
import { useEventListener } from '@vueuse/core';
import PenToolPreview from './PenToolPreview.vue';
import PenToolGuide from './PenToolGuide.vue';

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

// 钢笔工具引用
const penToolPreviewRef = ref<any>(null);

// 计算容器样式类
const containerClass = computed(() => {
  if (!store.isPenToolActive) return 'root-frame-container';
  
  if (store.penToolMode === 'idle') {
    return 'root-frame-container pen-tool-cursor-idle';
  } else if (store.penToolMode === 'drawing') {
    // 检查当前位置是否有效
    const valid = store.penEndPoint ? store.findSectionByPoint(store.penEndPoint) !== null : false;
    return valid 
      ? 'root-frame-container pen-tool-cursor-drawing'
      : 'root-frame-container pen-tool-cursor-invalid';
  } else {
    return 'root-frame-container pen-tool-cursor-drawing';
  }
});

// 舞台配置
const stageConfig = computed(() => ({
  width: stageSize.value.width,
  height: stageSize.value.height,
  draggable: !store.isPenToolActive && draggable.value
}));

// 框架尺寸
const frameWidth = computed(() => store.root.width || 800);
const frameHeight = computed(() => store.root.height || 600);

// 网格配置
const gridConfig = computed(() => ({
  x: 0,
  y: 0,
  width: frameWidth.value,
  height: frameHeight.value,
  fillPatternImage: createGridPattern(),
  fillPatternRepeat: 'repeat'
}));

// 创建网格图案
function createGridPattern() {
  const gridSize = 20;
  const canvas = document.createElement('canvas');
  canvas.width = gridSize;
  canvas.height = gridSize;
  const context = canvas.getContext('2d');
  
  if (context) {
    context.strokeStyle = '#dddddd';
    context.lineWidth = 0.5;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, gridSize);
    context.moveTo(0, 0);
    context.lineTo(gridSize, 0);
    context.stroke();
  }
  
  const image = new Image();
  image.src = canvas.toDataURL();
  return image;
}

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

// 添加键盘事件监听
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

// 处理键盘事件
function handleKeyDown(e: KeyboardEvent) {
  // 仅在钢笔工具激活时处理
  if (!store.isPenToolActive) return;
  
  // ESC键 - 取消当前绘制
  if (e.key === 'Escape') {
    store.resetPenToolState();
  }
  
  // Shift键 - 切换绘制方向
  if (e.key === 'Shift' && store.penToolMode === 'drawing' && store.penStartPoint && store.penEndPoint) {
    // 切换方向（水平 <-> 垂直）
    const newDirection = store.penDirection === 'vertical' ? 'horizontal' : 'vertical';
    console.log(`切换绘制方向: ${store.penDirection} -> ${newDirection}`);
    store.penDirection = newDirection;
    
    // 更新终点坐标以匹配新方向
    if (store.penDirection === 'vertical') {
      // 垂直线，固定X坐标
      store.penEndPoint = {
        x: store.penStartPoint.x,
        y: store.penEndPoint.y
      };
    } else {
      // 水平线，固定Y坐标
      store.penEndPoint = {
        x: store.penEndPoint.x,
        y: store.penStartPoint.y
      };
    }
  }
}

// 原有的handleClick函数修改为分发处理逻辑
function handleClick(e: any) {
  console.log("舞台点击事件", store.isPenToolActive ? "钢笔工具激活" : "钢笔工具未激活");
  
  // 如果钢笔工具激活，优先处理钢笔工具交互
  if (store.isPenToolActive) {
    console.log("转发到钢笔工具处理函数");
    handlePenToolClick(e);
    return;
  }
  
  // 获取目标节点
  const target = e.target;
  
  // 如果已经被子组件处理了，就不再处理
  if (e.cancelBubble) {
    console.log("事件已被取消冒泡");
    return;
  }
  
  // 如果没有被子组件处理且不是section，则取消选择
  // 检查名称是否包含"section"
  const targetName = target.name && target.name();
  const isSection = targetName && targetName.indexOf('section') >= 0;
  
  console.log("点击目标:", targetName, isSection ? "是区域" : "不是区域");
  
  if (!isSection) {
    store.selectedSectionId = null;
  }
}

// 钢笔工具点击处理
function handlePenToolClick(e: any) {
  // 阻止事件冒泡
  e.cancelBubble = true;
  
  console.log("钢笔工具点击", store.penToolMode, "钢笔工具激活状态:", store.isPenToolActive);
  
  // 获取舞台和点击位置
  const stage = e.target.getStage();
  if (!stage) {
    console.error("无法获取舞台对象");
    return;
  }
  
  const pointerPos = stage.getPointerPosition();
  
  if (!pointerPos) {
    console.error("无法获取鼠标位置");
    return;
  }
  
  console.log("原始点击位置:", pointerPos);
  
  // 转换坐标，考虑缩放和平移
  const transformedPoint = {
    x: (pointerPos.x - position.value.x) / scale.value,
    y: (pointerPos.y - position.value.y) / scale.value
  };
  
  console.log("转换后位置:", transformedPoint, "缩放:", scale.value, "平移:", position.value);
  
  // 判断点击位置是否在有效区域内
  const validSection = store.findSectionByPoint(transformedPoint);
  if (!validSection) {
    console.warn("点击位置不在有效区域内");
    // 继续处理，但记录警告
  }
  
  // 根据当前模式处理
  if (store.penToolMode === 'idle') {
    // 设置起点
    store.penStartPoint = transformedPoint;
    store.penToolMode = 'drawing';
    console.log("起点设置成功:", transformedPoint);
  } else if (store.penToolMode === 'drawing') {
    // 设置终点并准备确认 - 使用约束后的终点
    let constrainedEnd = { ...transformedPoint };
    if (store.penDirection === 'vertical' && store.penStartPoint) {
      // 垂直中挺 - 固定X坐标
      constrainedEnd.x = store.penStartPoint.x;
    } else if (store.penDirection === 'horizontal' && store.penStartPoint) {
      // 水平中挺 - 固定Y坐标
      constrainedEnd.y = store.penStartPoint.y;
    }
    
    store.penEndPoint = constrainedEnd;
    store.penToolMode = 'confirming';
    console.log("终点设置成功:", constrainedEnd);
  } else if (store.penToolMode === 'confirming') {
    // 确认创建
    console.log("创建中挺");
    const result = store.createDeviderWithPenTool();
    console.log("创建结果:", result);
    // 重置状态，准备下一次绘制
    store.resetPenToolState();
  }
}

// 处理鼠标移动
function handleMouseMove(e: any) {
  if (!store.isPenToolActive || store.penToolMode !== 'drawing' || !store.penStartPoint) return;
  
  // 获取舞台和鼠标位置
  const stage = e.target.getStage();
  if (!stage) return;
  
  const pointerPos = stage.getPointerPosition();
  if (!pointerPos) return;
  
  console.log("鼠标移动：", pointerPos);
  
  // 转换坐标
  const transformedPoint = {
    x: (pointerPos.x - position.value.x) / scale.value,
    y: (pointerPos.y - position.value.y) / scale.value
  };
  
  // 如果还没确定方向，现在根据移动确定
  if (!store.penDirection) {
    const dx = Math.abs(transformedPoint.x - store.penStartPoint.x);
    const dy = Math.abs(transformedPoint.y - store.penStartPoint.y);
    
    // 如果移动距离太小，不确定方向
    if (dx < 5 && dy < 5) return;
    
    // 根据移动方向确定中挺类型
    // 水平移动距离大 -> 水平中挺 (横线) -> 创建水平分割
    // 垂直移动距离大 -> 垂直中挺 (竖线) -> 创建垂直分割
    store.penDirection = dx > dy ? 'horizontal' : 'vertical';
    console.log("确定绘制方向:", store.penDirection, "水平距离:", dx, "垂直距离:", dy);
  }
  
  // 更新终点坐标
  store.penEndPoint = transformedPoint;
  
  // 检查终点是否有效（是否在某个区域内）
  const validSection = store.findSectionByPoint(transformedPoint);
  console.log("终点有效性:", validSection ? "有效" : "无效");
}

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

const draggable = computed(() => {
  return store.stageDraggable;
});

// 为鼠标滚轮事件添加事件监听
useEventListener(containerRef, 'wheel', handleWheel, { passive: false });
</script>

<template>
  <!-- 根框架容器 -->
  <div ref="containerRef" :class="containerClass">
    <!-- Konva舞台容器 -->
    <v-stage
      ref="stageRef"
      :config="{
        width: stageSize.width,
        height: stageSize.height,
        draggable: store.isPenToolActive ? false : draggable
      }"
      @wheel="handleWheel"
      @click="handleClick"
      @mousemove="handleMouseMove"
    >
      <v-layer 
        :config="{
          scaleX: scale,
          scaleY: scale,
          x: position.x,
          y: position.y,
          listening: true
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
            fill: '#f8f8f8',
            listening: true
          }"
          @click="(e: any) => {
            if (store.isPenToolActive) {
              console.log('背景接收到点击，转发到钢笔工具');
              handlePenToolClick(e);
            }
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
        
        <!-- 钢笔工具预览图层 -->
        <PenToolPreview v-if="store.isPenToolActive" ref="penToolPreviewRef" />
      </v-layer>
    </v-stage>
    
    <!-- 钢笔工具引导提示 -->
    <PenToolGuide v-if="store.isPenToolActive" />
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

.pen-tool-cursor-idle {
  cursor: crosshair;
}

.pen-tool-cursor-drawing {
  cursor: crosshair;
}

.pen-tool-cursor-invalid {
  cursor: not-allowed;
}
</style> 