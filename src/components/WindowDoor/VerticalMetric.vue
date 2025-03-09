<script setup lang="ts">
// 垂直度量组件
import { computed, watch, ref } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import PopupInput from './utils/PopupInput.vue';
import { useMetricLabel } from './composables/useMetricLabel';

const props = defineProps<{
  x: number;
  y: number;
  height: number;
  sectionId: number | string;
  isFrameMetric?: boolean;
  nodeType?: string;
}>();

const store = useWindowDoorStore();
const METRIC_SIZE = 100;

// 使用ref跟踪当前高度，确保组件内部状态与props同步
const currentHeight = ref(props.height);

// 监听props变化
watch(() => props.height, (newHeight) => {
  if (newHeight !== currentHeight.value) {
    console.log(`垂直标注高度更新: ${currentHeight.value} -> ${newHeight}`);
    currentHeight.value = newHeight;
  }
});

// 使用度量标签composable，传递节点类型和当前高度引用
const {
  showPopup,
  popupPosition,
  popupSize,
  isHovered,
  handleLabelClick,
  handleMouseEnter,
  handleMouseLeave,
  updateValue: updateHeight,
  closePopup,
  sizeConstraints,
  isDevider
} = useMetricLabel(props.sectionId, 'height', currentHeight.value, props.nodeType);

// 计算箭头和线条的点
const arrowPoints = computed(() => {
  // 如果是框架度量标记，使用更长的箭头
  const arrowLength = props.isFrameMetric ? 150 : METRIC_SIZE / 2;
  return [arrowLength, 0, arrowLength, currentHeight.value];
});

// 计算顶部和底部线条的点
const topLinePoints = computed(() => {
  const lineWidth = props.isFrameMetric ? 150 : METRIC_SIZE;
  return [0, 0, lineWidth, 0];
});

const bottomLinePoints = computed(() => {
  const lineWidth = props.isFrameMetric ? 150 : METRIC_SIZE;
  return [0, currentHeight.value, lineWidth, currentHeight.value];
});

// 标签位置和文本
const labelX = computed(() => props.isFrameMetric ? 130 : METRIC_SIZE / 2 - 50);
const labelY = computed(() => currentHeight.value / 2);
const metricText = computed(() => `${currentHeight.value} mm`);

// 标签样式
const tagStyle = computed(() => {
  // 基础样式
  const style = { 
    fill: isHovered.value ? '#e8f0fe' : 'white', 
    stroke: 'black',
    strokeWidth: 1,
    cornerRadius: 4
  };
  
  // 框架度量使用更明显的样式
  if (props.isFrameMetric) {
    style.fill = isHovered.value ? '#e1f3d8' : '#f2f6fc';
    style.stroke = '#409eff';
    style.strokeWidth = 2;
    style.cornerRadius = 6;
  }
  
  // 分隔条使用特殊样式
  if (isDevider.value) {
    style.fill = isHovered.value ? '#fef0f0' : '#fdf5e6';
    style.stroke = '#e6a23c';
    style.strokeWidth = 1.5;
  }
  
  return style;
});

// 文本样式
const textStyle = computed(() => {
  // 基础样式
  const style = { 
    fontStyle: 'normal',
    fill: '#606266',
    fontSize: 12,
    fontFamily: 'Arial, sans-serif'
  };
  
  // 框架度量使用更明显的样式
  if (props.isFrameMetric) {
    style.fontStyle = 'bold';
    style.fill = '#409eff';
    style.fontSize = 14;
  }
  
  // 分隔条使用特殊样式
  if (isDevider.value) {
    style.fontStyle = 'italic';
    style.fill = '#e6a23c';
  }
  
  return style;
});

// 箭头和线条样式
const lineStyle = computed(() => {
  // 基础样式
  const style = { 
    stroke: 'black',
    strokeWidth: 1
  };
  
  // 框架度量使用更明显的样式
  if (props.isFrameMetric) {
    style.stroke = '#409eff';
    style.strokeWidth = 2;
  }
  
  // 分隔条使用特殊样式
  if (isDevider.value) {
    style.stroke = '#e6a23c';
    style.strokeWidth = 1.5;
  }
  
  return style;
});
</script>

<template>
  <v-group :x="x" :y="y">
    <v-arrow
      :points="arrowPoints"
      :stroke="lineStyle.stroke"
      :fill="lineStyle.stroke"
      :strokeWidth="lineStyle.strokeWidth"
      :pointerAtBeginning="true"
      :pointerAtEnding="true"
      :pointerWidth="8"
      :pointerLength="8"
    />
    <v-line :points="topLinePoints" :stroke="lineStyle.stroke" :strokeWidth="lineStyle.strokeWidth" />
    <v-line :points="bottomLinePoints" :stroke="lineStyle.stroke" :strokeWidth="lineStyle.strokeWidth" />
    <v-label 
      :x="labelX" 
      :y="labelY"
      @click="handleLabelClick"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <v-tag :fill="tagStyle.fill" :stroke="tagStyle.stroke" />
      <v-text 
        :text="metricText" 
        :padding="10" 
        :fontStyle="textStyle.fontStyle"
        :fill="textStyle.fill"
      />
    </v-label>
  </v-group>
  
  <!-- 弹出输入框 -->
  <teleport to="body" v-if="showPopup">
    <PopupInput
      :initialValue="currentHeight"
      :position="popupPosition"
      :size="popupSize"
      :title="sizeConstraints.title"
      :min="sizeConstraints.min"
      :max="sizeConstraints.max"
      :step="isDevider ? 2 : 10"
      @update="updateHeight"
      @close="closePopup"
    />
  </teleport>
</template>

<style scoped>
/* 添加一些鼠标悬停样式，提示可点击 */
:deep(.konvajs-content) {
  cursor: pointer;
}
</style> 