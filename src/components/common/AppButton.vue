<script setup lang="ts">
import { computed, useSlots } from 'vue';
import AppIcon from './AppIcon.vue';

interface Props {
  /** 按钮类型 */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default' | 'text';
  
  /** 按钮尺寸 */
  size?: 'large' | 'default' | 'small';
  
  /** 是否为圆形按钮 */
  circle?: boolean;

  /** 是否为圆角按钮 */
  round?: boolean;
  
  /** 是否为朴素按钮 */
  plain?: boolean;
  
  /** 是否禁用 */
  disabled?: boolean;
  
  /** 按钮前图标 */
  icon?: string;
  
  /** 图标大小 */
  iconSize?: number;
  
  /** 图标颜色（默认使用按钮文字颜色） */
  iconColor?: string;
  
  /** 是否为图标旋转 */
  iconSpin?: boolean;
  
  /** 自定义类名 */
  customClass?: string;
  
  /** 是否为文本按钮 */
  text?: boolean;
  
  /** 是否为链接按钮 */
  link?: boolean;
  
  /** 加载状态 */
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  size: 'default',
  circle: false,
  round: false,
  plain: false,
  disabled: false,
  iconSize: 16,
  iconSpin: false,
  customClass: '',
  text: false,
  link: false,
  loading: false
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const slots = useSlots();

// 处理点击事件
const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};

// 计算内部样式
const iconOnlyStyle = computed(() => {
  if (props.icon && !props.circle) {
    return {
      marginRight: !slots.default ? '0' : '4px'
    };
  }
  return {};
});
</script>

<template>
  <el-button
    :type="type"
    :size="size"
    :disabled="disabled"
    :circle="circle"
    :round="round"
    :plain="plain"
    :text="text"
    :link="link"
    :loading="loading"
    :class="customClass"
    @click="handleClick"
  >
    <app-icon
      v-if="icon"
      :name="icon"
      :size="iconSize"
      :color="iconColor"
      :spin="iconSpin || loading"
      :style="iconOnlyStyle"
    />
    <slot />
  </el-button>
</template>

<style scoped>
/* 可以添加自定义样式覆盖Element Plus按钮样式 */
</style> 