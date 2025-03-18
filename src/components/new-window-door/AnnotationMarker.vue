<template>
  <v-group>
    <!-- 水平中挺标注(从中挺上边沿中心点向窗框上边沿) -->
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

    </template>

    <!-- 垂直中挺标注(从中挺左边沿中心点向窗框左边沿) -->
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
        x: -element.x / 2 - 6,
        y: element.height / 2 - 10,

        fill: '#fff',

        shadowBlur: 3,
        align: 'center',
        width: 90,
        height: 25,
        cornerRadius: 4,
      }" />
      <v-text :config="{
        x: -element.x / 2,
        y: element.height / 2 - 8,
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

    </template>
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
}

interface ParentElement {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  element: Element;
  isHorizontal: boolean;
  parentElement?: ParentElement | null; // 添加父元素属性
  lineColor?: string;
  textColor?: string;
  arrowColor?: string;
  lineWidth?: number;
  fontSize?: number;
  showParentRelative?: boolean; // 是否显示相对于父元素的标注
}

const props = withDefaults(defineProps<Props>(), {
  lineColor: '#ff3333', // 更明显的红色
  textColor: '#ff3333',
  arrowColor: '#ff3333',
  lineWidth: 2, // 更粗的线条
  fontSize: 18, // 更大的字体
  parentElement: null,
  showParentRelative: true
});

// 打印元素和父元素信息
onMounted(() => {
  console.log("【标注组件】元素位置:", props.element.x, props.element.y);
  console.log("【标注组件】元素尺寸:", props.element.width, props.element.height);
  console.log("【标注组件】是否水平:", props.isHorizontal);
});

// 监听元素属性变化
watch(() => props.element, (newVal) => {
  console.log("【标注组件】元素变化:", newVal);
}, { deep: true });

// 计算要显示的距离
// 对于水平中挺，显示y值（上边距）
// 对于垂直中挺，显示x值（左边距）
const relativePosition = computed(() => {
  if (props.isHorizontal) {
    const value = props.element.y;
    console.log(`【标注组件】上边距: ${value}mm`);
    return value;
  } else {
    const value = props.element.x;
    console.log(`【标注组件】左边距: ${value}mm`);
    return value;
  }
});

// 计算标注文本
const annotationText = computed(() => {
  const value = Math.round(relativePosition.value);
  return `${value}mm`;
});
</script>