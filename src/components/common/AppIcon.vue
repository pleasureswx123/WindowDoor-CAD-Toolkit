<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  /**
   * 图标名称 - 支持以下格式:
   * 1. Element Plus图标: ep:plus, ep:minus
   * 2. Material Design图标: mdi:home
   * 3. Carbon图标: carbon:add
   * 4. Ant Design图标: ant-design:plus-outlined
   */
  name: string;
  
  /** 图标大小 */
  size?: number | string;
  
  /** 图标颜色 */
  color?: string;
  
  /** 是否旋转 */
  spin?: boolean;
  
  /** 旋转速度 (s) */
  spinSpeed?: number;
}

const props = withDefaults(defineProps<Props>(), {
  size: 16,
  color: 'currentColor',
  spin: false,
  spinSpeed: 2
});

// 解析图标集和名称
const iconInfo = computed(() => {
  // 默认为Element Plus图标集
  let collection = 'ep';
  let iconName = props.name;

  // 如果包含冒号，则解析为"集合:名称"格式
  if (props.name.includes(':')) {
    const parts = props.name.split(':');
    collection = parts[0];
    iconName = parts[1];
  }

  return { collection, iconName };
});

// 计算完整的图标组件名称
const fullIconName = computed(() => {
  const { collection, iconName } = iconInfo.value;
  // 根据图标集构建组件名称
  // 例如 'mdi:home' 变为 'i-mdi-home'
  return `i-${collection}-${iconName}`;
});

// 计算样式
const iconStyle = computed(() => {
  return {
    fontSize: typeof props.size === 'number' ? `${props.size}px` : props.size,
    color: props.color,
    animation: props.spin ? `spin ${props.spinSpeed}s linear infinite` : '',
    display: 'inline-flex',
    verticalAlign: 'middle'
  };
});
</script>

<template>
  <component :is="fullIconName" :style="iconStyle" />
</template>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 