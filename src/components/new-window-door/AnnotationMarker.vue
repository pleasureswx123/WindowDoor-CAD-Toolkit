<template>
  <v-group>
    <!-- 水平中挺标注 -->
    <template v-if="isHorizontal">
      <!-- 上边距标注箭头 -->
      <v-arrow :config="{
        points: [element.width / 2, -2, element.width / 2, -element.y],
        pointerLength: 6,
        pointerWidth: 6,
        dash: [4, 4],
        fill: arrowColor,
        stroke: arrowColor,
        strokeWidth: lineWidth,
        listening: false
      }" />
      
      <!-- 上边距尺寸文本 -->
      <v-rect :config="{
        x: element.width / 2 - 30,
        y: -element.y / 2 - 13,
        fill: '#fff',
        shadowBlur: 3,
        align: 'center',
        width: 90,
        height: 25,
        cornerRadius: 4,
      }" />
      <v-text :config="{
        x: element.width / 2 - 20,
        y: -element.y / 2 - 10,
        text: annotationText,
        fontSize: fontSize,
        fill: textColor,
        align: 'center',
        listening: false,
        shadowColor: 'white',
        shadowBlur: 3,
        shadowOffset: { x: 1, y: 1 },
        shadowOpacity: 0.9
      }" />
      
      <!-- 下边距标注箭头 -->
      <v-arrow :config="{
        points: [element.width / 2, element.height + 2, element.width / 2, element.height + bottomDistance],
        pointerLength: 6,
        pointerWidth: 6,
        dash: [4, 4],
        fill: arrowColor,
        stroke: arrowColor,
        strokeWidth: lineWidth,
        listening: false
      }" />
      
      <!-- 下边距尺寸文本 -->
      <v-rect :config="{
        x: element.width / 2 - 30,
        y: element.height + bottomDistance / 2 - 13,
        fill: '#fff',
        shadowBlur: 3,
        align: 'center',
        width: 90,
        height: 25,
        cornerRadius: 4,
      }" />
      <v-text :config="{
        x: element.width / 2 - 20,
        y: element.height + bottomDistance / 2 - 10,
        text: bottomDistanceText,
        fontSize: fontSize,
        fill: textColor,
        align: 'center',
        listening: false,
        shadowColor: 'white',
        shadowBlur: 3,
        shadowOffset: { x: 1, y: 1 },
        shadowOpacity: 0.9
      }" />
      
      <!-- 位置百分比标注 -->
      <v-rect :config="{
        x: element.width + 5,
        y: element.height / 2 - 13,
        fill: '#e6f7ff',
        shadowBlur: 3,
        align: 'center',
        width: 70,
        height: 25,
        cornerRadius: 4,
      }" />
      <v-text :config="{
        x: element.width + 10,
        y: element.height / 2 - 10,
        text: positionPercentText,
        fontSize: fontSize,
        fill: '#0066cc',
        align: 'center',
        listening: false,
        shadowColor: 'white',
        shadowBlur: 3,
        shadowOffset: { x: 1, y: 1 },
        shadowOpacity: 0.9
      }" />
    </template>

    <!-- 垂直中挺标注 -->
    <template v-else>
      <!-- 左边距标注箭头 -->
      <v-arrow :config="{
        points: [-2, element.height / 2, -element.x, element.height / 2],
        pointerLength: 6,
        pointerWidth: 6,
        dash: [4, 4],
        fill: arrowColor,
        stroke: arrowColor,
        strokeWidth: lineWidth,
        listening: false
      }" />
      
      <!-- 左边距尺寸文本 -->
      <v-rect :config="{
        x: -element.x / 2 - 30,
        y: element.height / 2 - 13,
        fill: '#fff',
        shadowBlur: 3,
        align: 'center',
        width: 90,
        height: 25,
        cornerRadius: 4,
      }" />
      <v-text :config="{
        x: -element.x / 2 - 20,
        y: element.height / 2 - 10,
        text: annotationText,
        fontSize: fontSize,
        fill: textColor,
        align: 'center',
        listening: false,
        shadowColor: 'white',
        shadowBlur: 3,
        shadowOffset: { x: 1, y: 1 },
        shadowOpacity: 0.9
      }" />
      
      <!-- 右边距标注箭头 -->
      <v-arrow :config="{
        points: [element.width + 2, element.height / 2, element.width + rightDistance, element.height / 2],
        pointerLength: 6,
        pointerWidth: 6,
        dash: [4, 4],
        fill: arrowColor,
        stroke: arrowColor,
        strokeWidth: lineWidth,
        listening: false
      }" />
      
      <!-- 右边距尺寸文本 -->
      <v-rect :config="{
        x: element.width + rightDistance / 2 - 30,
        y: element.height / 2 - 13,
        fill: '#fff',
        shadowBlur: 3,
        align: 'center',
        width: 90,
        height: 25,
        cornerRadius: 4,
      }" />
      <v-text :config="{
        x: element.width + rightDistance / 2 - 20,
        y: element.height / 2 - 10,
        text: rightDistanceText,
        fontSize: fontSize,
        fill: textColor,
        align: 'center',
        listening: false,
        shadowColor: 'white',
        shadowBlur: 3,
        shadowOffset: { x: 1, y: 1 },
        shadowOpacity: 0.9
      }" />
      
      <!-- 位置百分比标注 -->
      <v-rect :config="{
        x: element.width / 2 - 25,
        y: -25,
        fill: '#e6f7ff',
        shadowBlur: 3,
        align: 'center',
        width: 70,
        height: 25,
        cornerRadius: 4,
      }" />
      <v-text :config="{
        x: element.width / 2 - 20,
        y: -23,
        text: positionPercentText,
        fontSize: fontSize,
        fill: '#0066cc',
        align: 'center',
        listening: false,
        shadowColor: 'white',
        shadowBlur: 3,
        shadowOffset: { x: 1, y: 1 },
        shadowOpacity: 0.9
      }" />
    </template>
    
    <!-- 中挺厚度标注 -->
    <v-rect :config="{
      x: element.width / 2 - 35,
      y: element.height / 2 - 13,
      fill: '#fff8e1',
      shadowBlur: 3,
      align: 'center',
      width: 70,
      height: 25,
      cornerRadius: 4,
    }" />
    <v-text :config="{
      x: element.width / 2 - 30,
      y: element.height / 2 - 10,
      text: thicknessText,
      fontSize: fontSize,
      fill: '#d68c28',
      align: 'center',
      listening: false,
      shadowColor: 'white',
      shadowBlur: 3,
      shadowOffset: { x: 1, y: 1 },
      shadowOpacity: 0.9
    }" />
  </v-group>
</template>

<script setup lang="ts">
import { defineProps, withDefaults, computed, onMounted, watch } from 'vue';

interface Element {
  x: number;
  y: number;
  width: number;
  height: number;
  direction?: string;
  parentId?: string; // 父元素ID
  thickness?: number; // 中挺厚度
}

interface ParentElement {
  x: number;
  y: number;
  width: number;
  height: number;
  frameSize?: number;
}

interface Props {
  element: Element;
  isHorizontal: boolean;
  parentElement?: ParentElement | null;
  lineColor?: string;
  textColor?: string;
  arrowColor?: string;
  lineWidth?: number;
  fontSize?: number;
  showParentRelative?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  lineColor: '#ff3333',
  textColor: '#ff3333',
  arrowColor: '#ff3333',
  lineWidth: 2,
  fontSize: 18,
  parentElement: null,
  showParentRelative: true
});

// 计算要显示的距离
const relativePosition = computed(() => {
  if (props.isHorizontal) {
    return props.element.y;
  } else {
    return props.element.x;
  }
});

// 计算标注文本
const annotationText = computed(() => {
  const value = Math.round(relativePosition.value);
  return `${value}mm`;
});

// 计算中挺厚度文本
const thicknessText = computed(() => {
  const thickness = props.element.thickness || 40;
  return `${thickness}mm`;
});

// 计算底部距离（水平中挺）
const bottomDistance = computed(() => {
  if (!props.parentElement) return 50;
  return props.parentElement.height - props.element.y - props.element.height;
});

// 计算底部距离文本
const bottomDistanceText = computed(() => {
  const value = Math.round(bottomDistance.value);
  return `${value}mm`;
});

// 计算右侧距离（垂直中挺）
const rightDistance = computed(() => {
  if (!props.parentElement) return 50;
  return props.parentElement.width - props.element.x - props.element.width;
});

// 计算右侧距离文本
const rightDistanceText = computed(() => {
  const value = Math.round(rightDistance.value);
  return `${value}mm`;
});

// 计算位置百分比
const positionPercent = computed(() => {
  if (!props.parentElement) return 50;
  
  if (props.isHorizontal) {
    // 计算中挺中心点在窗户高度上的百分比位置
    const centerY = props.element.y + props.element.height / 2;
    const parentHeight = props.parentElement.height;
    return (centerY / parentHeight) * 100;
  } else {
    // 计算中挺中心点在窗户宽度上的百分比位置
    const centerX = props.element.x + props.element.width / 2;
    const parentWidth = props.parentElement.width;
    return (centerX / parentWidth) * 100;
  }
});

// 位置百分比文本
const positionPercentText = computed(() => {
  const value = Math.round(positionPercent.value);
  return `${value}%`;
});

// 打印元素和父元素信息
onMounted(() => {
  console.log("【标注组件】元素位置:", props.element.x, props.element.y);
  console.log("【标注组件】元素尺寸:", props.element.width, props.element.height);
  console.log("【标注组件】是否水平:", props.isHorizontal);
  if (props.parentElement) {
    console.log("【标注组件】父元素尺寸:", props.parentElement.width, props.parentElement.height);
  }
});

// 监听元素属性变化
watch(() => props.element, (newVal) => {
  console.log("【标注组件】元素变化:", newVal);
}, { deep: true });
</script>