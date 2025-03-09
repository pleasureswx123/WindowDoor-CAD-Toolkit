<script setup lang="ts">
// 把手组件 - 对应React版本中的Handle.jsx
import { computed, ref } from 'vue';

const props = defineProps<{
  width: number;
  height: number;
  type: string;
  padding: number;
}>();

const isHovered = ref(false);

// 计算把手的位置
const handlePosition = computed(() => {
  if (props.type === 'none') {
    return null;
  }

  let x, y;

  if (props.type.indexOf('left') >= 0) {
    x = props.width - props.padding / 2;
    y = props.height / 2;
  } else if (props.type.indexOf('right') >= 0) {
    x = props.padding / 2;
    y = props.height / 2;
  } else {
    console.error('未知的把手类型');
    return null;
  }

  return { x, y };
});

// 把手的绘制函数
const handleSceneFunc = (ctx: any, shape: any) => {
  // 绘制把手底座
  ctx.beginPath();
  ctx.rect(-20, -20, 40, 50);
  // 绘制把手手柄
  ctx.rect(-14, -5, 28, 80);
  ctx.fillStrokeShape(shape);
};

// 处理鼠标悬停事件
const handleMouseEnter = () => {
  isHovered.value = true;
  document.body.style.cursor = 'pointer';
};

const handleMouseLeave = () => {
  isHovered.value = false;
  document.body.style.cursor = 'default';
};

// 共享属性
const shapeProps = computed(() => ({
  x: handlePosition.value?.x,
  y: handlePosition.value?.y,
  fill: isHovered.value ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)',
  sceneFunc: handleSceneFunc,
  stroke: 'black',
  strokeWidth: 1.5,
  name: 'handle',
  listening: true, // 确保可以接收点击事件
  opacity: 1 // 确保完全不透明
}));
</script>

<template>
  <!-- 使用v-group来代替直接设置zIndex -->
  <v-group>
    <v-shape
      v-if="handlePosition"
      v-bind="shapeProps"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    />
  </v-group>
</template> 