<script setup lang="ts">
// 玻璃组件 - 对应React版本中的Glass.jsx
import { computed } from 'vue';

const props = defineProps<{
  padding: number;
  width: number;
  height: number;
}>();

// 计算玻璃区域的配置
const glassConfig = computed(() => ({
  x: props.padding,
  y: props.padding,
  width: props.width - props.padding * 2,
  height: props.height - props.padding * 2,
  fill: 'lightblue',
  hitStrokeWidth: 0, // 确保点击区域准确
  listening: true // 确保能接收事件
}));
</script>

<template>
  <v-group name="glass-group">
    <v-rect v-bind="glassConfig" name="glass" />
  </v-group>
</template> 