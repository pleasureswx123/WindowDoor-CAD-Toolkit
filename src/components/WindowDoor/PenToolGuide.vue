<script setup lang="ts">
import { computed } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const store = useWindowDoorStore();

// 根据当前模式计算指南消息
const guideMessage = computed(() => {
  if (!store.isPenToolActive) return '';
  
  switch (store.penToolMode) {
    case 'idle':
      return '点击选择起点开始绘制中挺';
    case 'drawing':
      return '移动鼠标确定方向，点击设置终点 (按Shift切换方向，按ESC取消)';
    case 'confirming':
      return '点击确认创建中挺，或按ESC取消';
    default:
      return '';
  }
});
</script>

<template>
  <div v-if="store.isPenToolActive" class="pen-tool-guide">
    <div class="guide-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
        <path d="M2 2l7.586 7.586"></path>
        <circle cx="11" cy="11" r="2"></circle>
      </svg>
    </div>
    <div class="guide-message">{{ guideMessage }}</div>
  </div>
</template>

<style scoped>
.pen-tool-guide {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(33, 150, 243, 0.9);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  font-size: 14px;
  max-width: 90%;
  pointer-events: none;
}

.guide-icon {
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.guide-message {
  white-space: nowrap;
}

@media (max-width: 600px) {
  .pen-tool-guide {
    font-size: 12px;
    padding: 6px 12px;
  }
  
  .guide-icon {
    display: none;
  }
}
</style> 