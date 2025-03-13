<script setup lang="ts">
// 窗框组件 - 对应React版本中的Sash.jsx
import { computed, ref } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const props = defineProps<{
  width: number;
  height: number;
  size: number;
  isRoot?: boolean; // 添加属性区分是根窗户框架还是窗扇框架
}>();

const store = useWindowDoorStore();
const isHovered = ref(false);

// 通用的线条属性
const lineProps = computed(() => ({
  closed: true,
  stroke: 'black',
  strokeWidth: 2,
  lineCap: 'square', // butt, round, or square
  lineJoin: 'round', // miter, round, or bevel
  // 解决遮挡问题：使用透明填充或完全去除填充
  fill: isHovered.value ? 'rgba(240,249,255,0.3)' : 'transparent',
  listening: true, // 确保能接收点击事件
  shadowBlur: isHovered.value ? 4 : 0,
  shadowColor: isHovered.value ? '#1890ff' : 'transparent'
}));

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
// 鼠标进入
const handleMouseEnter = () => {
  isHovered.value = true;
  document.body.style.cursor = 'pointer';
};

// 鼠标离开
const handleMouseLeave = () => {
  isHovered.value = false;
  document.body.style.cursor = 'default';
};

</script>

<template>
  <v-group 
    :name="isRoot ? 'root-sash' : 'section-sash'"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <v-line v-bind="lineProps" :points="topLinePoints" />
    <v-line v-bind="lineProps" :points="leftLinePoints" />
    <v-line v-bind="lineProps" :points="bottomLinePoints" />
    <v-line v-bind="lineProps" :points="rightLinePoints" />
  </v-group>
</template> 