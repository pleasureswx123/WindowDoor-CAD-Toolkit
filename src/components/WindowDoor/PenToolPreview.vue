<script setup lang="ts">
import { computed, ref } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const store = useWindowDoorStore();
const DEVIDER_SIZE = 40; // 中挺厚度

// 特殊吸附点百分比列表（25%、50%、75%）
const snapPercentages = [25, 50, 75];

// 是否处于吸附状态
const isSnapping = ref(false);
const snapPosition = ref<number | null>(null);

// 预览线的配置
const previewLineConfig = computed(() => {
  if (!store.penStartPoint || !store.penEndPoint || !targetSection.value || !store.penDirection) {
    return {
      points: [0, 0, 0, 0],
      stroke: '#2196F3',
      strokeWidth: 2,
      dash: [5, 5],
      visible: false
    };
  }
  
  console.log("绘制预览线 - 方向:", store.penDirection);
  console.log("起点:", store.penStartPoint, "终点:", store.penEndPoint);
  
  // 根据方向约束终点
  const start = store.penStartPoint;
  const end = store.penEndPoint;
  let constrainedEnd = { ...end };
  
  // 确保严格水平或垂直
  if (store.penDirection === 'vertical') {
    // 垂直中挺 (竖线) - 固定X坐标，允许Y变化
    constrainedEnd.x = start.x;
  } else {
    // 水平中挺 (横线) - 固定Y坐标，允许X变化
    constrainedEnd.y = start.y;
  }
  
  // 计算中挺位置
  const section = targetSection.value;
  let position = 50; // 默认50%
  
  // 获取窗户有效区域
  const rootFrame = rootFrameInfo.value;
  const frameSize = rootFrame.frameSize;
  
  // 计算有效区域（从窗框内侧开始）
  const effectiveX = frameSize;
  const effectiveY = frameSize;
  const effectiveWidth = rootFrame.width - frameSize * 2;
  const effectiveHeight = rootFrame.height - frameSize * 2;
  
  // 计算相对于目标区域的位置，如果没有目标区域，则使用有效区域
  let referenceX = section ? section.x : effectiveX;
  let referenceY = section ? section.y : effectiveY;
  let referenceWidth = section ? section.width : effectiveWidth;
  let referenceHeight = section ? section.height : effectiveHeight;
  
  // 添加窗框宽度偏移
  referenceX += frameSize;
  // 添加窗框高度偏移（确保垂直方向也考虑偏移）
  referenceY += frameSize;
  
  // 根据方向计算位置百分比和中轴线坐标
  let axisX = start.x;
  let axisY = start.y;
  
  if (store.penDirection === 'vertical') {
    // 垂直中挺 - 计算X位置百分比
    position = ((constrainedEnd.x - referenceX) / referenceWidth) * 100;
    // 限制在有效范围内
    position = Math.max(10, Math.min(90, position));
    // 计算中挺的中心X坐标
    axisX = referenceX + (referenceWidth * (position / 100));
  } else {
    // 水平中挺 - 计算Y位置百分比
    position = ((constrainedEnd.y - referenceY) / referenceHeight) * 100;
    // 限制在有效范围内
    position = Math.max(10, Math.min(90, position));
    // 计算中挺的中心Y坐标
    axisY = referenceY + (referenceHeight * (position / 100));
  }
  
  console.log("约束后位置:", position, "%, 中轴线:", axisX, axisY);
  
  // 根据方向设置线的两个端点
  let points = [];
  if (store.penDirection === 'vertical') {
    // 垂直线 - 固定X坐标为中轴线
    points = [
      axisX, referenceY, // 起点 - 区域顶部的中轴线位置
      axisX, referenceY + referenceHeight // 终点 - 区域底部的中轴线位置
    ];
  } else {
    // 水平线 - 固定Y坐标为中轴线
    points = [
      referenceX, axisY, // 起点 - 区域左侧的中轴线位置
      referenceX + referenceWidth, axisY // 终点 - 区域右侧的中轴线位置
    ];
  }
  
  return {
    points: points,
    stroke: '#2196F3',
    strokeWidth: 2,
    dash: [5, 5],
    visible: true
  };
});

// 是否显示预览
const showPreview = computed(() => 
  store.isPenToolActive && 
  store.penStartPoint !== null && 
  (store.penToolMode === 'drawing' || store.penToolMode === 'confirming')
);

// 当前目标区域
const targetSection = computed(() => {
  if (!store.penStartPoint || !store.penEndPoint) return null;
  
  // 计算中点
  const midPoint = {
    x: (store.penStartPoint.x + store.penEndPoint.x) / 2,
    y: (store.penStartPoint.y + store.penEndPoint.y) / 2
  };
  
  return store.findSectionByPoint(midPoint);
});

// 获取根窗框尺寸和位置 - 用于定位预览
const rootFrameInfo = computed(() => {
  // 根窗框位置固定为0,0，大小为root的width和height
  return {
    x: 0,
    y: 0,
    width: store.root.width,
    height: store.root.height,
    frameSize: store.root.frameSize
  };
});

// 计算吸附辅助线
const snapGuideConfig = computed(() => {
  if (!store.isSnapping || !store.snapPercentage || !targetSection.value) {
    return {
      points: [0, 0, 0, 0],
      stroke: '#FF9800',
      strokeWidth: 1,
      dash: [2, 2],
      visible: false
    };
  }
  
  // 获取窗户有效区域
  const rootFrame = rootFrameInfo.value;
  const frameSize = rootFrame.frameSize;
  
  // 计算有效区域（从窗框内侧开始）
  const effectiveX = frameSize;
  const effectiveY = frameSize;
  const effectiveWidth = rootFrame.width - frameSize * 2;
  const effectiveHeight = rootFrame.height - frameSize * 2;
  
  // 优先使用找到的目标区域，如果没有则使用有效区域
  const section = targetSection.value;
  
  // 计算相对于目标区域的位置，如果没有目标区域，则使用有效区域
  let referenceX = section ? section.x : effectiveX;
  let referenceY = section ? section.y : effectiveY;
  let referenceWidth = section ? section.width : effectiveWidth;
  let referenceHeight = section ? section.height : effectiveHeight;
  
  // 添加窗框宽度偏移
  referenceX += frameSize;
  
  // 根据方向创建吸附指示线
  if (store.penDirection === 'vertical') {
    // 垂直中挺 - 创建垂直指示线
    const x = referenceX + (referenceWidth * (store.snapPercentage / 100));
    return {
      points: [x, referenceY, x, referenceY + referenceHeight],
      stroke: '#FF9800',
      strokeWidth: 1,
      dash: [2, 2],
      visible: true
    };
  } else {
    // 水平中挺 - 创建水平指示线
    const y = referenceY + (referenceHeight * (store.snapPercentage / 100));
    return {
      points: [referenceX, y, referenceX + referenceWidth, y],
      stroke: '#FF9800',
      strokeWidth: 1,
      dash: [2, 2],
      visible: true
    };
  }
});

// 计算分割预览区域
const previewSections = computed(() => {
  if (!targetSection.value || !store.penDirection || !store.penStartPoint || !store.penEndPoint) {
    return [];
  }
  
  // 使用窗户有效内部区域作为预览的容器
  const rootFrame = rootFrameInfo.value;
  const frameSize = rootFrame.frameSize;
  const section = targetSection.value;
  
  // 计算有效区域（去掉外框）
  const effectiveX = frameSize;
  const effectiveY = frameSize;
  const effectiveWidth = rootFrame.width - frameSize * 2;
  const effectiveHeight = rootFrame.height - frameSize * 2;
  
  // 计算分割位置 - 使用约束后的线的位置
  let position = 50; // 默认50%
  
  // 约束终点（与previewLineConfig中的计算方式保持一致）
  let constrainedEnd = { ...store.penEndPoint };
  if (store.penDirection === 'vertical') {
    // 垂直中挺(竖线) - 固定X坐标
    constrainedEnd.x = store.penStartPoint.x;
  } else {
    // 水平中挺(横线) - 固定Y坐标
    constrainedEnd.y = store.penStartPoint.y;
  }
  
  // 计算相对于目标区域的位置，如果没有目标区域，则使用有效区域
  let referenceX = section ? section.x : effectiveX;
  let referenceY = section ? section.y : effectiveY;
  let referenceWidth = section ? section.width : effectiveWidth;
  let referenceHeight = section ? section.height : effectiveHeight;
  
  // 添加窗框宽度偏移
  referenceX += frameSize;
  // 添加窗框高度偏移
  referenceY += frameSize;
  
  if (store.penDirection === 'vertical') {
    // 垂直中挺 - 计算X位置百分比
    position = ((constrainedEnd.x - referenceX) / referenceWidth) * 100;
  } else {
    // 水平中挺 - 计算Y位置百分比
    position = ((constrainedEnd.y - referenceY) / referenceHeight) * 100;
  }
  
  // 限制在有效范围内
  position = Math.max(10, Math.min(90, position));
  
  console.log("预览中挺位置:", position, "%, 方向:", store.penDirection);
  
  const HALF_DEVIDER_SIZE = DEVIDER_SIZE / 2;
  
  if (store.penDirection === 'vertical') {
    // 垂直中挺(竖线) - 分割左右区域
    // 计算分割线相对于有效区域的位置
    const relativePosition = (position / 100) * referenceWidth;
    const splitX = referenceX + relativePosition;
    
    return [
      // 整个窗户的有效区域半透明背景
      {
        x: referenceX,
        y: referenceY,
        width: referenceWidth,
        height: referenceHeight,
        fill: 'rgba(33, 150, 243, 0.03)', // 极淡的蓝色背景
        stroke: 'none',
        strokeWidth: 0
      },
      // 左侧区域
      {
        x: referenceX,
        y: referenceY,
        width: relativePosition - HALF_DEVIDER_SIZE,
        height: referenceHeight,
        fill: 'rgba(33, 150, 243, 0.1)', // 浅蓝色
        stroke: '#2196F3',
        strokeWidth: 0.5
      },
      // 中挺区域 - 垂直中挺从顶到底
      {
        x: splitX - HALF_DEVIDER_SIZE,
        y: referenceY,
        width: DEVIDER_SIZE,
        height: referenceHeight,
        fill: 'rgba(150, 150, 150, 0.3)',
        stroke: '#2196F3',
        strokeWidth: 1
      },
      // 右侧区域
      {
        x: splitX + HALF_DEVIDER_SIZE,
        y: referenceY,
        width: referenceWidth - relativePosition - HALF_DEVIDER_SIZE,
        height: referenceHeight,
        fill: 'rgba(33, 150, 243, 0.1)', // 浅蓝色
        stroke: '#2196F3',
        strokeWidth: 0.5
      }
    ];
  } else {
    // 水平中挺(横线) - 分割上下区域
    // 计算分割线相对于有效区域的位置
    const relativePosition = (position / 100) * referenceHeight;
    const splitY = referenceY + relativePosition;
    
    // 使中挺的中心和虚线完全重合
    return [
      // 整个窗户的有效区域半透明背景
      {
        x: referenceX,
        y: referenceY,
        width: referenceWidth,
        height: referenceHeight,
        fill: 'rgba(33, 150, 243, 0.03)', // 极淡的蓝色背景
        stroke: 'none',
        strokeWidth: 0
      },
      // 上方区域
      {
        x: referenceX,
        y: referenceY,
        width: referenceWidth,
        height: relativePosition - HALF_DEVIDER_SIZE,
        fill: 'rgba(33, 150, 243, 0.1)', // 浅蓝色
        stroke: '#2196F3',
        strokeWidth: 0.5
      },
      // 中挺区域 - 水平中挺从左到右
      {
        x: referenceX,
        y: splitY - HALF_DEVIDER_SIZE,
        width: referenceWidth,
        height: DEVIDER_SIZE,
        fill: 'rgba(150, 150, 150, 0.3)',
        stroke: '#2196F3',
        strokeWidth: 1
      },
      // 下方区域
      {
        x: referenceX,
        y: splitY + HALF_DEVIDER_SIZE,
        width: referenceWidth,
        height: referenceHeight - relativePosition - HALF_DEVIDER_SIZE,
        fill: 'rgba(33, 150, 243, 0.1)', // 浅蓝色
        stroke: '#2196F3',
        strokeWidth: 0.5
      }
    ];
  }
});

// 更新预览并应用吸附
function updatePreviewWithSnapping(point: {x: number, y: number}) {
  // 直接设置终点，预览计算属性会自动应用约束
  if (!store.penStartPoint) return;
  
  // 直接更新终点 - 由previewLineConfig计算属性处理约束
  store.penEndPoint = point;
}

// 导出给父组件使用
defineExpose({
  updatePreviewWithSnapping
});

// 起点配置
const startPointConfig = computed(() => {
  if (!store.penStartPoint || !targetSection.value || !store.penDirection) 
    return { x: 0, y: 0, radius: 5, fill: '#0D47A1', visible: false };
  
  // 获取窗户有效区域
  const rootFrame = rootFrameInfo.value;
  const frameSize = rootFrame.frameSize;
  
  // 计算有效区域（从窗框内侧开始）
  const effectiveX = frameSize;
  const effectiveY = frameSize;
  const effectiveWidth = rootFrame.width - frameSize * 2;
  const effectiveHeight = rootFrame.height - frameSize * 2;
  
  // 优先使用找到的目标区域，如果没有则使用有效区域
  const section = targetSection.value;
  const start = store.penStartPoint;
  
  // 计算相对于目标区域的位置，如果没有目标区域，则使用有效区域
  let referenceX = section ? section.x : effectiveX;
  let referenceY = section ? section.y : effectiveY;
  let referenceWidth = section ? section.width : effectiveWidth;
  let referenceHeight = section ? section.height : effectiveHeight;
  
  // 添加窗框宽度偏移
  referenceX += frameSize;
  // 添加窗框高度偏移
  referenceY += frameSize;
  
  // 根据方向计算中轴线坐标
  let axisX = start.x;
  let axisY = start.y;
  
  if (store.penDirection === 'vertical') {
    // 垂直中挺 - 计算X位置百分比
    const position = ((start.x - referenceX) / referenceWidth) * 100;
    // 限制在有效范围内
    const validPosition = Math.max(10, Math.min(90, position));
    // 计算中挺的中心X坐标
    axisX = referenceX + (referenceWidth * (validPosition / 100));
    
    // 使用参考区域的Y坐标为该点的Y坐标
    axisY = store.penDirection === 'vertical' ? 
      (store.penEndPoint && store.penEndPoint.y < referenceY + referenceHeight / 2 ? 
        referenceY : referenceY + referenceHeight) : 
      start.y;
  } else {
    // 水平中挺 - 计算Y位置百分比
    const position = ((start.y - referenceY) / referenceHeight) * 100;
    // 限制在有效范围内
    const validPosition = Math.max(10, Math.min(90, position));
    // 计算中挺的中心Y坐标
    axisY = referenceY + (referenceHeight * (validPosition / 100));
    
    // 使用参考区域的X坐标为该点的X坐标
    axisX = store.penDirection === 'horizontal' ? 
      (store.penEndPoint && store.penEndPoint.x < referenceX + referenceWidth / 2 ? 
        referenceX : referenceX + referenceWidth) : 
      start.x;
  }
  
  return {
    x: axisX,
    y: axisY,
    radius: 6,
    fill: '#0D47A1',
    stroke: '#FFFFFF',
    strokeWidth: 1,
    visible: true
  };
});

// 终点配置
const endPointConfig = computed(() => {
  if (!store.penStartPoint || !store.penEndPoint || !targetSection.value || !store.penDirection) 
    return { x: 0, y: 0, radius: 5, fill: '#D32F2F', visible: false };
  
  // 获取窗户有效区域
  const rootFrame = rootFrameInfo.value;
  const frameSize = rootFrame.frameSize;
  
  // 计算有效区域（从窗框内侧开始）
  const effectiveX = frameSize;
  const effectiveY = frameSize;
  const effectiveWidth = rootFrame.width - frameSize * 2;
  const effectiveHeight = rootFrame.height - frameSize * 2;
  
  // 优先使用找到的目标区域，如果没有则使用有效区域
  const section = targetSection.value;
  const end = store.penEndPoint;
  
  // 计算相对于目标区域的位置，如果没有目标区域，则使用有效区域
  let referenceX = section ? section.x : effectiveX;
  let referenceY = section ? section.y : effectiveY;
  let referenceWidth = section ? section.width : effectiveWidth;
  let referenceHeight = section ? section.height : effectiveHeight;
  
  // 添加窗框宽度偏移
  referenceX += frameSize;
  // 添加窗框高度偏移
  referenceY += frameSize;
  
  let constrainedEnd = { ...end };
  
  // 根据方向约束终点
  if (store.penDirection === 'vertical') {
    // 垂直中挺 - 固定X坐标，调整Y坐标
    constrainedEnd.x = store.penStartPoint.x;
  } else {
    // 水平中挺 - 固定Y坐标，调整X坐标
    constrainedEnd.y = store.penStartPoint.y;
  }
  
  // 根据方向计算中轴线坐标
  let axisX = constrainedEnd.x;
  let axisY = constrainedEnd.y;
  
  if (store.penDirection === 'vertical') {
    // 垂直中挺 - 计算X位置百分比
    const position = ((constrainedEnd.x - referenceX) / referenceWidth) * 100;
    // 限制在有效范围内
    const validPosition = Math.max(10, Math.min(90, position));
    // 计算中挺的中心X坐标
    axisX = referenceX + (referenceWidth * (validPosition / 100));
    
    // 使用参考区域的Y坐标为该点的Y坐标 (与起点相反)
    axisY = store.penDirection === 'vertical' ? 
      (store.penEndPoint.y < referenceY + referenceHeight / 2 ? 
        referenceY + referenceHeight : referenceY) : 
      constrainedEnd.y;
  } else {
    // 水平中挺 - 计算Y位置百分比
    const position = ((constrainedEnd.y - referenceY) / referenceHeight) * 100;
    // 限制在有效范围内
    const validPosition = Math.max(10, Math.min(90, position));
    // 计算中挺的中心Y坐标
    axisY = referenceY + (referenceHeight * (validPosition / 100));
    
    // 使用参考区域的X坐标为该点的X坐标 (与起点相反)
    axisX = store.penDirection === 'horizontal' ? 
      (store.penEndPoint.x < referenceX + referenceWidth / 2 ? 
        referenceX + referenceWidth : referenceX) : 
      constrainedEnd.x;
  }
  
  return {
    x: axisX,
    y: axisY,
    radius: 6,
    fill: '#D32F2F',
    stroke: '#FFFFFF',
    strokeWidth: 1,
    visible: true
  };
});
</script>

<template>
  <v-group :config="{ visible: store.isPenToolActive }">
    <!-- 预览线 -->
    <v-line :config="previewLineConfig" />
    
    <!-- 起点标记 -->
    <v-circle :config="startPointConfig" />
    
    <!-- 终点标记 -->
    <v-circle :config="endPointConfig" />
    
    <!-- 吸附指示线 -->
    <v-line :config="snapGuideConfig" />
    
    <!-- 预览区域 -->
    <template v-if="showPreview">
      <v-rect
        v-for="(section, index) in previewSections"
        :key="'preview-section-' + index"
        :config="section"
      />
    </template>
  </v-group>
</template> 