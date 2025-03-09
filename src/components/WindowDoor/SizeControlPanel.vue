<script setup lang="ts">
import { computed } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const store = useWindowDoorStore();

// 最小和最大尺寸限制
const minSize = 300; // 最小300mm
const maxSize = 3000; // 最大3000mm

// 使用computed的getter/setter实现双向绑定
const width = computed({
  get: () => store.root.width,
  set: (newWidth) => {
    if (isValidSize(newWidth)) {
      store.updateWindowSize(newWidth, height.value);
    }
  }
});

const height = computed({
  get: () => store.root.height,
  set: (newHeight) => {
    if (isValidSize(newHeight)) {
      store.updateWindowSize(width.value, newHeight);
    }
  }
});

// 验证尺寸是否在有效范围内
function isValidSize(size: number): boolean {
  return !isNaN(size) && size >= minSize && size <= maxSize;
}

// 优化: 尺寸变更前的格式化和验证
function formatSizeInput(value: string): number {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return 0;
  
  // 限制最大最小值
  return Math.min(Math.max(parsed, minSize), maxSize);
}
</script>

<template>
  <div class="size-control-panel">
    <div class="control-item">
      <label for="width-input">宽度 (mm):</label>
      <el-input-number
        id="width-input"
        v-model="width"
        :min="minSize"
        :max="maxSize"
        :step="10"
        :precision="0"
        size="small"
        :formatter="(val: number) => `${val}`"
        :parser="(val: string) => formatSizeInput(val)"
        controls-position="right"
      />
    </div>
    <div class="control-item">
      <label for="height-input">高度 (mm):</label>
      <el-input-number
        id="height-input"
        v-model="height"
        :min="minSize"
        :max="maxSize"
        :step="10"
        :precision="0"
        size="small"
        :formatter="(val: number) => `${val}`"
        :parser="(val: string) => formatSizeInput(val)"
        controls-position="right"
      />
    </div>
  </div>
</template>

<style scoped>
.size-control-panel {
  display: flex;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 10px;
  flex-wrap: wrap; /* 增加响应式支持 */
  gap: 10px; /* 增加间距 */
}

.control-item {
  display: flex;
  align-items: center;
}

label {
  margin-right: 8px;
  font-weight: bold;
  white-space: nowrap; /* 防止标签换行 */
}

/* 自定义element-plus组件样式 */
:deep(.el-input-number) {
  width: 120px; /* 调整宽度 */
}

:deep(.el-input-number .el-input__wrapper) {
  padding-right: 5px; /* 调整内部间距 */
}

/* 兼容移动设备 */
@media (max-width: 576px) {
  .size-control-panel {
    flex-direction: column;
  }
  
  .control-item {
    width: 100%;
  }
}
</style> 