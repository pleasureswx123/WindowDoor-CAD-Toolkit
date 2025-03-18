<template>
  <v-group>
    <!-- 水平元素上边距标注 -->
    <template v-if="isHorizontal">
      <!-- 上边距标注线 -->
      <v-line :config="{
        points: [0, 0, 0, element.y, element.width, element.y],
        stroke: lineColor,
        strokeWidth: lineWidth,
        dash: [4, 2],
        listening: false
      }" />
      <!-- 上边距尺寸文本 -->
      <v-text :config="{
        x: 5,
        y: element.y / 2 - 10,
        text: `${Math.round(element.y)}mm`,
        fontSize: fontSize,
        fill: textColor,
        align: 'left',
        listening: false,
        rotation: 90,
        shadowColor: 'white',
        shadowBlur: 3,
        shadowOffset: { x: 1, y: 1 },
        shadowOpacity: 0.9
      }" />
      
      <!-- 上边距标注箭头 -->
      <v-arrow :config="{
        points: [4, 0, 4, element.y],
        pointerLength: 6,
        pointerWidth: 6,
        fill: arrowColor,
        stroke: arrowColor,
        strokeWidth: lineWidth,
        listening: false
      }" />
    </template>
    
    <!-- 垂直元素左边距标注 -->
    <template v-else>
      <!-- 左边距标注线 -->
      <v-line :config="{
        points: [0, 0, element.x, 0, element.x, element.height],
        stroke: lineColor,
        strokeWidth: lineWidth,
        dash: [4, 2],
        listening: false
      }" />
      <!-- 左边距尺寸文本 -->
      <v-text :config="{
        x: element.x / 2 - 10,
        y: 5,
        text: `${Math.round(element.x)}mm`,
        fontSize: fontSize,
        fill: textColor,
        align: 'center',
        listening: false,
        shadowColor: 'white',
        shadowBlur: 3,
        shadowOffset: { x: 1, y: 1 },
        shadowOpacity: 0.9
      }" />
      
      <!-- 左边距标注箭头 -->
      <v-arrow :config="{
        points: [0, 4, element.x, 4],
        pointerLength: 6,
        pointerWidth: 6,
        fill: arrowColor,
        stroke: arrowColor,
        strokeWidth: lineWidth,
        listening: false
      }" />
    </template>
  </v-group>
</template>

<script setup lang="ts">
import { defineProps, withDefaults } from 'vue';

interface Element {
  x: number;
  y: number;
  width: number;
  height: number;
  direction?: string;
}

interface Props {
  element: Element;
  isHorizontal: boolean;
  lineColor?: string;
  textColor?: string;
  arrowColor?: string;
  lineWidth?: number;
  fontSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  lineColor: '#3498db',
  textColor: '#3498db',
  arrowColor: '#3498db',
  lineWidth: 1.5,
  fontSize: 16
});
</script> 