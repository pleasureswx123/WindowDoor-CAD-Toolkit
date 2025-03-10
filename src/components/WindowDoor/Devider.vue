<script setup lang="ts">
// 分隔线组件 - 对应React版本中的Devider.jsx
import { computed } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const store = useWindowDoorStore();

const props = defineProps<{
  x: number;
  y: number;
  width: number;
  height: number;
  id: number;
}>();

// 计算分隔线的配置
const rectConfig = computed(() => ({
  x: props.x,
  y: props.y,
  width: props.width,
  height: props.height,
  fill: '#e8e8e8', // 更好看的填充色
  stroke: props.id === store.selectedDeviderId ? '#4a90e2' : '#999',
  strokeWidth: props.id === store.selectedDeviderId ? 2 : 1,
  name: `devider-${props.id}`,
  // 当鼠标悬停时显示手型指针
  listening: true
}));

// 处理点击事件
function handleClick(e: any) {
  e.cancelBubble = true; // 阻止事件冒泡
  store.selectedDeviderId = props.id;
  console.log(`选中中挺 #${props.id}, 尺寸: ${props.width}x${props.height}`);
}
</script>

<template>
  <v-group>
    <!-- 中挺主体 -->
    <v-rect v-bind="rectConfig" @click="handleClick" />
    
    <!-- 如果被选中，显示选中指示器 -->
    <v-circle v-if="store.selectedDeviderId === props.id" :config="{
      x: props.x + props.width / 2,
      y: props.y + props.height / 2,
      radius: 6,
      fill: '#4a90e2',
      stroke: 'white',
      strokeWidth: 1
    }" />
  </v-group>
</template> 