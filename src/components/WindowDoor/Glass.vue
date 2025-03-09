<script setup lang="ts">
// 玻璃组件 - 对应React版本中的Glass.jsx
import { computed } from 'vue';

const props = defineProps<{
  padding: number;
  width: number;
  height: number;
  type?: string; // 添加类型属性
}>();

// 判断是否为空区域
const isEmpty = computed(() => props.type === 'empty');

// 判断是否为已分割的空区域
const isSplitEmpty = computed(() => props.type === 'split-empty');

// 计算玻璃区域的配置
const glassConfig = computed(() => {
  // 基础配置
  const config: {
    x: number;
    y: number;
    width: number;
    height: number;
    hitStrokeWidth: number;
    listening: boolean;
    fill?: string;
    dash?: number[];
    stroke?: string;
    strokeWidth?: number;
  } = {
    x: props.padding,
    y: props.padding,
    width: props.width - props.padding * 2,
    height: props.height - props.padding * 2,
    hitStrokeWidth: 0, // 确保点击区域准确
    listening: true // 确保能接收事件
  };
  
  // 根据类型调整样式
  if (isEmpty.value) {
    // 空区域使用浅灰色半透明
    config.fill = 'rgba(240, 240, 240, 0.5)';
    config.dash = [5, 5]; // 虚线边框
    config.stroke = '#cccccc';
    config.strokeWidth = 1;
  } else if (isSplitEmpty.value) {
    // 已分割的空区域使用透明背景，无边框
    config.fill = 'transparent';
    // 无边框
    config.stroke = undefined;
    config.strokeWidth = 0;
  } else if (props.type === 'none') {
    // 固定窗使用浅蓝色
    config.fill = 'rgba(173, 216, 230, 0.7)';
  } else {
    // 可开启窗使用更透明的蓝色
    config.fill = 'rgba(173, 216, 230, 0.5)';
  }
  
  return config;
});

// 空区域提示文本配置
const emptyTextConfig = computed(() => ({
  x: props.width / 2 - props.padding,
  y: props.height / 2 - props.padding,
  text: '未配置',
  fontSize: 14,
  fontStyle: 'italic',
  fill: '#999999',
  align: 'center',
  width: props.width - props.padding * 2
}));
</script>

<template>
  <v-group name="glass-group">
    <v-rect v-bind="glassConfig" name="glass" />
    
    <!-- 空区域提示文本 - 已移到Section中集中显示 -->
    <!-- <v-text v-if="isEmpty" v-bind="emptyTextConfig" /> -->
  </v-group>
</template> 