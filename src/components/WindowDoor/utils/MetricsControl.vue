<script setup lang="ts">
// 标注尺寸显示控制组件
import { ref, computed, nextTick } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const store = useWindowDoorStore();

// 通过计算属性来获取和设置标注显示状态
const isMetricsVisible = computed(() => store.isMetricsVisible());

// 切换标注尺寸显示
const toggleMetricsVisibility = () => {
  store.toggleMetricsVisibility();
  
  // 等待DOM更新完成，防止状态切换过快导致错误
  nextTick(() => {
    // 切换完成后可能需要执行的操作
  });
};

// 按钮类型和提示文本
const buttonType = computed(() => isMetricsVisible.value ? 'danger' : 'success');
const buttonText = computed(() => isMetricsVisible.value ? '隐藏尺寸' : '显示尺寸');
</script>

<template>
  <div class="metrics-control">
    <el-button 
      :type="buttonType" 
      size="small"
      @click="toggleMetricsVisibility"
      class="metrics-button"
    >
      {{ buttonText }}
    </el-button>
  </div>
</template>

<style scoped>
.metrics-control {
  position: absolute;
  right: 20px;
  bottom: 90px; /* 放在缩放控制上方 */
  z-index: 100;
}

.metrics-button {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style> 