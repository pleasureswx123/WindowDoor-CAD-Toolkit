<script setup lang="ts">
// 窗框组件 - 对应React版本中的Sash.jsx
import { computed } from 'vue';

const props = defineProps<{
  width: number;
  height: number;
  size: number;
}>();

// 通用的线条属性
const lineProps = {
  closed: true,
  stroke: 'black',
  strokeWidth: 1,
  fill: 'white',
  listening: true // 确保能接收点击事件
};

// 上框线条点
const topLinePoints = computed(() => [
  0, 0, 
  props.width, 0, 
  props.width - props.size, props.size, 
  props.size, props.size
]);

// 左框线条点
const leftLinePoints = computed(() => [
  0, 0, 
  props.size, props.size, 
  props.size, props.height - props.size, 
  0, props.height
]);

// 下框线条点
const bottomLinePoints = computed(() => [
  0, props.height,
  props.size, props.height - props.size,
  props.width - props.size, props.height - props.size,
  props.width, props.height
]);

// 右框线条点
const rightLinePoints = computed(() => [
  props.width, 0,
  props.width, props.height,
  props.width - props.size, props.height - props.size,
  props.width - props.size, props.size
]);
</script>

<template>
  <v-group name="sash">
    <v-line v-bind="lineProps" :points="topLinePoints" />
    <v-line v-bind="lineProps" :points="leftLinePoints" />
    <v-line v-bind="lineProps" :points="bottomLinePoints" />
    <v-line v-bind="lineProps" :points="rightLinePoints" />
  </v-group>
</template> 