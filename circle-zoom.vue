<template>
  <div class="canvas-container" ref="containerRef">
    <v-stage
      ref="stageRef"
      :config="stageConfig"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @mousemove="handleMouseMove"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <v-layer ref="layerRef">
        <v-circle :config="circleConfig" />
      </v-layer>
    </v-stage>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';

// 容器引用
const containerRef = ref<HTMLElement | null>(null);
const stageRef = ref(null);
const layerRef = ref(null);

// 舞台尺寸 - 默认为窗口尺寸，之后会自动调整
const stageSize = reactive({
  width: window.innerWidth,
  height: window.innerHeight
});

// 视图状态
const viewState = reactive({
  scale: 1,
  x: 0,
  y: 0
});

// 平移状态跟踪
const isPanning = ref(false);
const lastPointerPosition = ref({ x: 0, y: 0 });

// 触摸状态
const lastTouchCenter = ref({ x: 0, y: 0 });
const lastTouchDistance = ref(0);

// 舞台配置
const stageConfig = computed(() => ({
  width: stageSize.width,
  height: stageSize.height,
  x: viewState.x,
  y: viewState.y,
  scaleX: viewState.scale,
  scaleY: viewState.scale,
  draggable: isPanning.value
}));

// 圆形配置
const circleConfig = computed(() => ({
  x: stageSize.width / 2,
  y: stageSize.height / 2,
  radius: 50,
  fill: 'green',
  stroke: 'black',
  strokeWidth: 2
}));

// 滚轮缩放处理
const handleWheel = (e: any) => {
  e.evt.preventDefault();
  
  const stage = stageRef.value.getStage();
  const oldScale = viewState.scale;
  const pointer = stage.getPointerPosition();
  
  if (!pointer) return;
  
  // 计算鼠标指向的点在当前缩放下的坐标
  const mousePointTo = {
    x: (pointer.x - viewState.x) / oldScale,
    y: (pointer.y - viewState.y) / oldScale
  };
  
  // 根据滚轮方向确定缩放方向
  const scaleBy = 1.1;
  const newScale = e.evt.deltaY > 0 
    ? oldScale / scaleBy 
    : oldScale * scaleBy;
  
  // 限制缩放范围，避免过度缩放
  viewState.scale = Math.max(0.1, Math.min(10, newScale));
  
  // 更新舞台位置，保持鼠标指向的点不变
  viewState.x = pointer.x - mousePointTo.x * viewState.scale;
  viewState.y = pointer.y - mousePointTo.y * viewState.scale;
  
  // 强制刷新层
  if (layerRef.value) {
    layerRef.value.getNode().batchDraw();
  }
};

// 鼠标按下处理 - 开始平移
const handleMouseDown = (e: any) => {
  // 确保是鼠标左键
  if (e.evt.button !== 0) return;
  
  isPanning.value = true;
  
  // 更新鼠标样式
  const stage = stageRef.value.getStage();
  stage.container().style.cursor = 'grabbing';
  
  // 记录当前鼠标位置
  const pos = stage.getPointerPosition();
  if (pos) {
    lastPointerPosition.value = pos;
  }
  
  // 阻止默认行为和事件冒泡
  e.evt.preventDefault();
  e.evt.stopPropagation();
};

// 鼠标抬起处理 - 结束平移
const handleMouseUp = (e: any) => {
  isPanning.value = false;
  
  // 恢复鼠标样式
  const stage = stageRef.value.getStage();
  stage.container().style.cursor = 'grab';
  
  // 阻止默认行为和事件冒泡
  e.evt.preventDefault();
  e.evt.stopPropagation();
};

// 鼠标移动处理 - 平移场景
const handleMouseMove = (e: any) => {
  if (!isPanning.value) return;
  
  const stage = stageRef.value.getStage();
  const pos = stage.getPointerPosition();
  
  if (pos && lastPointerPosition.value) {
    // 计算移动差值
    const dx = pos.x - lastPointerPosition.value.x;
    const dy = pos.y - lastPointerPosition.value.y;
    
    // 更新视图位置
    viewState.x += dx;
    viewState.y += dy;
    
    // 更新最后位置
    lastPointerPosition.value = pos;
    
    // 强制刷新
    if (layerRef.value) {
      layerRef.value.getNode().batchDraw();
    }
  }
};

// 触摸开始处理
const handleTouchStart = (e: any) => {
  const touches = e.evt.touches;
  
  // 处理多指触摸
  if (touches.length === 2) {
    e.evt.preventDefault();
    
    // 计算两指中心点
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    const center = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
    
    // 计算两指距离
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
    
    lastTouchCenter.value = center;
    lastTouchDistance.value = distance;
  } else if (touches.length === 1) {
    // 单指触摸 - 平移
    isPanning.value = true;
    
    const stage = stageRef.value.getStage();
    const pos = {
      x: touches[0].clientX,
      y: touches[0].clientY
    };
    
    lastPointerPosition.value = pos;
  }
};

// 触摸移动处理
const handleTouchMove = (e: any) => {
  const touches = e.evt.touches;
  
  // 多指触摸 - 缩放
  if (touches.length === 2) {
    e.evt.preventDefault();
    
    const stage = stageRef.value.getStage();
    
    // 计算两指中心点
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    const center = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
    
    // 计算两指距离
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
    
    // 如果有上一次数据，计算缩放比例
    if (lastTouchDistance.value > 0) {
      const oldScale = viewState.scale;
      
      // 计算触摸中心点相对于舞台的坐标
      const mousePointTo = {
        x: (center.x - viewState.x) / oldScale,
        y: (center.y - viewState.y) / oldScale
      };
      
      // 计算新缩放比例
      const scaleFactor = distance / lastTouchDistance.value;
      const newScale = oldScale * scaleFactor;
      
      // 限制缩放范围
      viewState.scale = Math.max(0.1, Math.min(10, newScale));
      
      // 更新舞台位置
      viewState.x = center.x - mousePointTo.x * viewState.scale;
      viewState.y = center.y - mousePointTo.y * viewState.scale;
      
      // 强制刷新
      if (layerRef.value) {
        layerRef.value.getNode().batchDraw();
      }
    }
    
    // 更新记录
    lastTouchCenter.value = center;
    lastTouchDistance.value = distance;
  } else if (touches.length === 1 && isPanning.value) {
    // 单指触摸 - 平移
    const pos = {
      x: touches[0].clientX,
      y: touches[0].clientY
    };
    
    if (lastPointerPosition.value) {
      // 计算移动差值
      const dx = pos.x - lastPointerPosition.value.x;
      const dy = pos.y - lastPointerPosition.value.y;
      
      // 更新视图位置
      viewState.x += dx;
      viewState.y += dy;
      
      // 更新最后位置
      lastPointerPosition.value = pos;
      
      // 强制刷新
      if (layerRef.value) {
        layerRef.value.getNode().batchDraw();
      }
    }
  }
};

// 触摸结束处理
const handleTouchEnd = (e: any) => {
  // 重置触摸状态
  if (e.evt.touches.length < 2) {
    lastTouchDistance.value = 0;
  }
  
  // 结束平移
  if (e.evt.touches.length === 0) {
    isPanning.value = false;
  }
};

// 调整舞台大小
const resizeStage = () => {
  if (!containerRef.value) return;
  
  // 获取容器尺寸
  const containerWidth = containerRef.value.clientWidth;
  const containerHeight = containerRef.value.clientHeight;
  
  // 更新舞台尺寸
  stageSize.width = containerWidth;
  stageSize.height = containerHeight;
  
  // 强制刷新
  if (layerRef.value) {
    layerRef.value.getNode().batchDraw();
  }
};

// 重置视图
const resetView = () => {
  viewState.scale = 1;
  viewState.x = 0;
  viewState.y = 0;
  
  // 强制刷新
  if (layerRef.value) {
    layerRef.value.getNode().batchDraw();
  }
};

// 生命周期钩子
onMounted(() => {
  // 调整舞台大小
  resizeStage();
  
  // 监听窗口大小变化
  window.addEventListener('resize', resizeStage);
  
  // 初始化鼠标样式
  if (stageRef.value) {
    const stage = stageRef.value.getStage();
    stage.container().style.cursor = 'grab';
  }
});

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('resize', resizeStage);
});
</script>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background-color: #f0f0f0;
  touch-action: none; /* 防止触摸设备上的默认行为 */
}
</style> 