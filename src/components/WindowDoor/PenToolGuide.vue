<script setup lang="ts">
import { computed } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const store = useWindowDoorStore();

// 计算当前引导消息
const guideMessage = computed(() => {
  switch (store.penToolMode) {
    case 'idle':
      return '点击窗户区域开始绘制中挺';
    case 'drawing':
      // 根据方向给出更具体的引导
      if (store.penDirection === 'horizontal') {
        return '移动鼠标确定水平中挺位置，点击确认位置（横向）';
      } else if (store.penDirection === 'vertical') {
        return '移动鼠标确定垂直中挺位置，点击确认位置（纵向）';
      } else {
        return '移动鼠标确定方向和位置，点击确认中挺终点';
      }
    case 'confirming':
      return '点击确认创建中挺，或按ESC取消';
    default:
      return '使用钢笔工具创建中挺';
  }
});

// 根据方向提供额外的提示
const directionTip = computed(() => {
  if (store.penToolMode !== 'drawing' || !store.penDirection) return '';
  
  if (store.penDirection === 'horizontal') {
    return '按住Shift键可切换为垂直中挺';
  } else {
    return '按住Shift键可切换为水平中挺';
  }
});

// 是否显示提示
const showGuide = computed(() => store.isPenToolActive);
</script>

<template>
  <div v-if="showGuide" class="pen-tool-guide">
    <div class="guide-content">
      <div class="icon">
        <icon-lucide-pen-tool />
      </div>
      <div class="message">
        <div class="primary-message">{{ guideMessage }}</div>
        <div v-if="directionTip" class="secondary-message">{{ directionTip }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pen-tool-guide {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(33, 150, 243, 0.9);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  font-size: 14px;
  max-width: 90%;
  backdrop-filter: blur(4px);
}

.guide-content {
  display: flex;
  align-items: center;
}

.icon {
  margin-right: 10px;
  font-size: 20px;
}

.message {
  display: flex;
  flex-direction: column;
}

.primary-message {
  font-weight: 500;
}

.secondary-message {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}
</style> 