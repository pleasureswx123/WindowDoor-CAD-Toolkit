<script setup lang="ts">
// 分隔线组件 - 对应React版本中的Devider.jsx
import { computed } from 'vue';

const props = defineProps<{
  x: number;
  y: number;
  width: number;
  height: number;
}>();

// 计算分隔线的配置
const rectConfig = computed(() => ({
  x: props.x,
  y: props.y,
  width: props.width,
  height: props.height,
  fill: 'white',
  stroke: 'black',
  strokeWidth: 1
}));
</script>

<template>
  <v-rect v-bind="rectConfig" />
</template> 