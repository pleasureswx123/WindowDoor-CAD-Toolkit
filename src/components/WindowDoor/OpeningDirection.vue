<script setup lang="ts">
// 开窗方向组件 - 对应React版本中的OpeningDirection.jsx
import { computed } from 'vue';

const props = defineProps<{
  width: number;
  height: number;
  type: string;
  padding: number;
}>();

// 计算是否显示左开线条
const showLeftLine = computed(() => props.type.indexOf('left') >= 0);

// 计算是否显示右开线条
const showRightLine = computed(() => props.type.indexOf('right') >= 0);

// 计算是否显示倾斜线条
const showTiltLine = computed(() => props.type.indexOf('tilt') >= 0);

// 左开线条的点
const leftLinePoints = computed(() => [
  props.padding, props.padding, 
  props.width - props.padding, props.height / 2, 
  0, props.height
]);

// 右开线条的点
const rightLinePoints = computed(() => [
  props.width - props.padding, props.padding,
  props.padding, props.height / 2,
  props.width - props.padding, props.height - props.padding
]);

// 倾斜线条的点
const tiltLinePoints = computed(() => [
  props.padding, props.height - props.padding,
  props.width / 2, props.padding,
  props.width - props.padding, props.height - props.padding
]);

// 共享的线条属性
const lineProps = {
  stroke: 'black',
  strokeWidth: 1,
  listening: true // 确保线条可以接收点击事件
};
</script>

<template>
  <v-group name="opening-direction" v-if="type !== 'none'">
    <v-line
      v-if="showLeftLine"
      :points="leftLinePoints"
      v-bind="lineProps"
    />
    <v-line
      v-if="showRightLine"
      :points="rightLinePoints"
      v-bind="lineProps"
    />
    <v-line
      v-if="showTiltLine"
      :points="tiltLinePoints"
      v-bind="lineProps"
    />
  </v-group>
</template> 