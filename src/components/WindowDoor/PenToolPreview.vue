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
  if (!store.penStartPoint || !store.penEndPoint) {
    return {
      points: [0, 0, 0, 0],
      stroke: '#2196F3',
      strokeWidth: 2,
      dash: [5, 5],
      visible: false
    };
  }
  
  return {
    points: [
      store.penStartPoint.x, 
      store.penStartPoint.y, 
      store.penEndPoint.x, 
      store.penEndPoint.y
    ],
    stroke: '#2196F3',
    strokeWidth: 2,
    dash: [5, 5],
    visible: true
  };
});

// 是否显示预览
const showPreview = computed(() => {
  return store.isPenToolActive && 
    (store.penToolMode === 'drawing' || store.penToolMode === 'confirming') && 
    store.penStartPoint !== null;
});

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
  
  const section = targetSection.value;
  
  // 根据方向创建吸附指示线
  if (store.penDirection === 'vertical') {
    // 垂直中挺 - 创建垂直指示线
    const x = section.x + (section.width * (store.snapPercentage / 100));
    return {
      points: [x, section.y, x, section.y + section.height],
      stroke: '#FF9800',
      strokeWidth: 1,
      dash: [2, 2],
      visible: true
    };
  } else {
    // 水平中挺 - 创建水平指示线
    const y = section.y + (section.height * (store.snapPercentage / 100));
    return {
      points: [section.x, y, section.x + section.width, y],
      stroke: '#FF9800',
      strokeWidth: 1,
      dash: [2, 2],
      visible: true
    };
  }
});

// 计算分割预览区域
const previewSections = computed(() => {
  if (!targetSection.value || !store.penDirection || store.penToolMode !== 'confirming') {
    return [];
  }
  
  const section = targetSection.value;
  const position = store.snapPercentage || 50; // 默认50%
  
  if (store.penDirection === 'vertical') {
    // 垂直中挺 - 分割左右区域
    const splitX = section.x + (section.width * (position / 100));
    
    return [
      // 左侧区域
      {
        x: section.x,
        y: section.y,
        width: splitX - section.x,
        height: section.height,
        fill: 'rgba(33, 150, 243, 0.1)',
        stroke: '#2196F3',
        strokeWidth: 1
      },
      // 右侧区域
      {
        x: splitX,
        y: section.y,
        width: section.x + section.width - splitX,
        height: section.height,
        fill: 'rgba(33, 150, 243, 0.1)',
        stroke: '#2196F3',
        strokeWidth: 1
      }
    ];
  } else {
    // 水平中挺 - 分割上下区域
    const splitY = section.y + (section.height * (position / 100));
    
    return [
      // 上方区域
      {
        x: section.x,
        y: section.y,
        width: section.width,
        height: splitY - section.y,
        fill: 'rgba(33, 150, 243, 0.1)',
        stroke: '#2196F3',
        strokeWidth: 1
      },
      // 下方区域
      {
        x: section.x,
        y: splitY,
        width: section.width,
        height: section.y + section.height - splitY,
        fill: 'rgba(33, 150, 243, 0.1)',
        stroke: '#2196F3',
        strokeWidth: 1
      }
    ];
  }
});

// 更新预览并应用吸附
function updatePreviewWithSnapping(point: {x: number, y: number}) {
  if (!store.penStartPoint || !targetSection.value) return;
  
  // 应用吸附
  const { x, y, isSnapping, snapPercentage } = store.applySnapping(point, targetSection.value);
  
  // 更新终点
  store.penEndPoint = { x, y };
  
  // 更新吸附状态
  store.isSnapping = isSnapping;
  store.snapPercentage = snapPercentage;
}

// 导出给父组件使用
defineExpose({
  updatePreviewWithSnapping
});
</script>

<template>
  <v-layer>
    <template v-if="showPreview">
      <!-- 预览线 -->
      <v-line :config="previewLineConfig" />
      
      <!-- 起点标记 -->
      <v-circle
        v-if="store.penStartPoint"
        :config="{
          x: store.penStartPoint.x,
          y: store.penStartPoint.y,
          radius: 4,
          fill: '#2196F3',
          stroke: 'white',
          strokeWidth: 1
        }"
      />
      
      <!-- 终点标记 -->
      <v-circle
        v-if="store.penEndPoint"
        :config="{
          x: store.penEndPoint.x,
          y: store.penEndPoint.y,
          radius: 4,
          fill: '#2196F3',
          stroke: 'white',
          strokeWidth: 1
        }"
      />
      
      <!-- 吸附指示线 -->
      <v-line :config="snapGuideConfig" />
      
      <!-- 预览区域 -->
      <v-rect
        v-for="(section, index) in previewSections"
        :key="'preview-section-' + index"
        :config="section"
      />
    </template>
  </v-layer>
</template> 