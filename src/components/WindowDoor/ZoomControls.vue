<script setup lang="ts">
import { ref } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import { Plus, Minus, RefreshLeft } from '@element-plus/icons-vue';

const store = useWindowDoorStore();

// 缩放步长
const SCALE_STEP = 50; // mm

// 放大操作
const zoomIn = () => {
  const newWidth = store.root.width + SCALE_STEP;
  const newHeight = store.root.height + SCALE_STEP;
  store.updateWindowSize(newWidth, newHeight);
};

// 缩小操作
const zoomOut = () => {
  // 确保尺寸不小于最小值
  const minSize = 300;
  const newWidth = Math.max(minSize, store.root.width - SCALE_STEP);
  const newHeight = Math.max(minSize, store.root.height - SCALE_STEP);
  store.updateWindowSize(newWidth, newHeight);
};

// 重置为默认尺寸
const resetSize = () => {
  store.updateWindowSize(1000, 2000);
};
</script>

<template>
  <div class="zoom-controls">
    <el-tooltip content="放大" placement="left" :effect="'light'">
      <el-button 
        type="primary" 
        circle 
        @click="zoomIn"
        :icon="Plus"
        class="zoom-button"
      />
    </el-tooltip>
    
    <el-tooltip content="缩小" placement="left" :effect="'light'">
      <el-button 
        type="primary" 
        circle 
        @click="zoomOut"
        :icon="Minus" 
        class="zoom-button"
      />
    </el-tooltip>
    
    <el-tooltip content="重置尺寸" placement="left" :effect="'light'">
      <el-button 
        type="info" 
        circle 
        @click="resetSize"
        :icon="RefreshLeft"
        class="zoom-button reset"
      />
    </el-tooltip>
  </div>
</template>

<style scoped>
.zoom-controls {
  position: absolute;
  right: 20px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 100;
}

.zoom-button {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.reset {
  background-color: #909399;
}
</style> 