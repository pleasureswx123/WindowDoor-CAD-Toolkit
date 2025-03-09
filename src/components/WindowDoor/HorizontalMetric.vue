<script setup lang="ts">
// 水平度量组件
import { computed, watch, ref } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import PopupInput from './utils/PopupInput.vue';
import { useMetricLabel } from './composables/useMetricLabel';

const props = defineProps<{
  x: number;
  y: number;
  width: number;
  sectionId: number | string;
  isFrameMetric?: boolean;
  nodeType?: string;
}>();

const store = useWindowDoorStore();
const METRIC_SIZE = 100;

// 使用ref跟踪当前宽度，确保组件内部状态与props同步
const currentWidth = ref(props.width);

// 监听props变化
watch(() => props.width, (newWidth) => {
  if (newWidth !== currentWidth.value) {
    console.log(`水平标注宽度更新: ${currentWidth.value} -> ${newWidth}`);
    currentWidth.value = newWidth;
  }
});

// 使用度量标签composable，传递节点类型和当前宽度引用
const {
  showPopup,
  popupPosition,
  popupSize,
  isHovered,
  handleLabelClick,
  handleMouseEnter,
  handleMouseLeave,
  updateValue: updateWidth,
  closePopup,
  sizeConstraints,
  isDevider
} = useMetricLabel(props.sectionId, 'width', currentWidth.value, props.nodeType);

// 计算箭头和线条的点
const arrowPoints = computed(() => {
  // 如果是框架度量标记，使用更长的箭头
  const arrowLength = props.isFrameMetric ? 150 : METRIC_SIZE / 2;
  return [0, arrowLength, currentWidth.value, arrowLength];
});

// 计算左右线条的点
const leftLinePoints = computed(() => {
  const lineHeight = props.isFrameMetric ? 150 : METRIC_SIZE;
  return [0, 0, 0, lineHeight];
});

const rightLinePoints = computed(() => {
  const lineHeight = props.isFrameMetric ? 150 : METRIC_SIZE;
  return [currentWidth.value, 0, currentWidth.value, lineHeight];
});

// 标签位置和文本
const labelX = computed(() => currentWidth.value / 2);
const labelY = computed(() => props.isFrameMetric ? 130 : METRIC_SIZE / 2);
const metricText = computed(() => `${currentWidth.value} mm`);

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
    <v-line :points="leftLinePoints" :stroke="lineStyle.stroke" :strokeWidth="lineStyle.strokeWidth" />
    <v-line :points="rightLinePoints" :stroke="lineStyle.stroke" :strokeWidth="lineStyle.strokeWidth" />
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
      :initialValue="currentWidth"
      :position="popupPosition"
      :size="popupSize"
      :title="sizeConstraints.title"
      :min="sizeConstraints.min"
      :max="sizeConstraints.max"
      :step="isDevider ? 2 : 10"
      @update="updateWidth"
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