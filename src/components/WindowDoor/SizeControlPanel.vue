<script setup lang="ts">
import { computed } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const store = useWindowDoorStore();

// 最小和最大尺寸限制
const minSize = 300; // 最小300mm
const maxSize = 3000; // 最大3000mm

// 框架厚度限制
const minFrameSize = 30; // 最小30mm
const maxFrameSize = 150; // 最大150mm

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

// 外框厚度双向绑定
const frameSize = computed({
  get: () => store.root.frameSize,
  set: (newFrameSize) => {
    if (isValidFrameSize(newFrameSize)) {
      store.updateFrameSize(newFrameSize, 'root');
    }
  }
});

// 验证尺寸是否在有效范围内
function isValidSize(size: number): boolean {
  return !isNaN(size) && size >= minSize && size <= maxSize;
}

// 验证框架厚度是否在有效范围内
function isValidFrameSize(size: number): boolean {
  return !isNaN(size) && size >= minFrameSize && size <= maxFrameSize;
}

// 优化: 尺寸变更前的格式化和验证
function formatSizeInput(value: string): number {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return 0;
  
  // 限制最大最小值
  return Math.min(Math.max(parsed, minSize), maxSize);
}

// 框架厚度格式化
function formatFrameSizeInput(value: string): number {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return 0;
  
  // 限制最大最小值
  return Math.min(Math.max(parsed, minFrameSize), maxFrameSize);
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
    
    <!-- 外框厚度设置 -->
    <div class="control-item">
      <label for="frame-size-input">外框厚度 (mm):</label>
      <el-input-number
        id="frame-size-input"
        v-model="frameSize"
        :min="minFrameSize"
        :max="maxFrameSize"
        :step="5"
        :precision="0"
        size="small"
        :formatter="(val: number) => `${val}`"
        :parser="(val: string) => formatFrameSizeInput(val)"
        controls-position="right"
      >
        <template #suffix>
          <el-tooltip content="窗框外部边框的厚度" placement="top">
            <icon-tabler-info-circle class="info-icon" />
          </el-tooltip>
        </template>
      </el-input-number>
    </div>
  </div>
</template>

<style scoped>
.size-control-panel {
  display: flex;
  flex-direction: column;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 10px;
  gap: 12px; /* 增加垂直间距 */
}

.control-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

label {
  margin-right: 8px;
  font-weight: 500;
  color: #333;
  white-space: nowrap; /* 防止标签换行 */
}

.info-icon {
  font-size: 16px;
  color: #909399;
  margin-left: 4px;
  cursor: help;
}

/* 自定义element-plus组件样式 */
:deep(.el-input-number) {
  width: 120px; /* 调整宽度 */
}

:deep(.el-input-number .el-input__wrapper) {
  padding-right: 5px; /* 调整内部间距 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); /* 增加立体感 */
}

:deep(.el-input-number:focus-within .el-input__wrapper) {
  box-shadow: 0 0 0 1px #4a90e2 inset; /* 聚焦时的样式 */
}

/* 兼容移动设备 */
@media (max-width: 576px) {
  .control-item {
    width: 100%;
  }
}
</style> 