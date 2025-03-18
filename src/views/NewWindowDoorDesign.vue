<!-- 新版门窗设计工具 -->
<!-- 结合利用 @vue-konva.min.js 、 @RootWindow.ts，
 在当前文件实现 @RootWindow.ts 中提到的所有功能， 
 实现完善 @NewWindowDoorDesign.vue 实现高保真页面及交互功能，
 擅于利用 vue3 的 computed、watch、watchEffect、ref、reactive 等特性
 实现 @rootWindowStore.ts 数据管理，组件都提取到 @ src/components/new-window-door 文件夹中去，优化 @RootWindow.ts  -->

<template>
  <div class="window-door-design">
    <DesignToolbar class="design-toolbar" />
    <div class="design-workspace">
      <WindowCanvas class="design-canvas" />
      <div class="design-status-bar">
        <div v-if="selectedElementInfo">
          {{ selectedElementInfo }}
        </div>
        <div v-else>
          未选中元素
        </div>
        <div class="scale-controls">
          <button @click="zoomIn">+</button>
          <span>{{ Math.round(scale * 100) }}%</span>
          <button @click="zoomOut">-</button>
        </div>
      </div>
    </div>
    <SettingPanel class="design-setting-panel" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import DesignToolbar from '../components/new-window-door/DesignToolbar.vue';
import WindowCanvas from '../components/new-window-door/WindowCanvas.vue';
import { useRootWindowStore } from '../stores/rootWindowStore';
import SettingPanel from '../components/new-window-door/SettingPanel.vue';

const windowStore = useRootWindowStore();

// 视图缩放比例
const scale = ref(1);

// 显示选中元素的信息
const selectedElementInfo = computed(() => {
  if (windowStore.selectedArea) {
    return `选中区域: ${windowStore.selectedArea}`;
  } else if (windowStore.selectedMuntin) {
    return `选中中挺: ${windowStore.selectedMuntin}`;
  } else if (windowStore.selectedSash) {
    return `选中窗扇: ${windowStore.selectedSash}`;
  }
  return null;
});

// 缩放控制
function zoomIn() {
  scale.value = Math.min(scale.value + 0.1, 2);
}

function zoomOut() {
  scale.value = Math.max(scale.value - 0.1, 0.3);
}
</script>

<style scoped>
.window-door-design {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.design-toolbar {
  width: 250px;
  flex-shrink: 0;
}

.design-setting-panel {
  width: 250px;
  flex-shrink: 0;
}

.design-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.design-canvas {
  flex: 1;
  overflow: hidden;
}

.design-status-bar {
  height: 30px;
  background: #f0f0f0;
  border-top: 1px solid #ddd;
  display: flex;
  align-items: center;
  padding: 0 15px;
  justify-content: space-between;
}

.scale-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.scale-controls button {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: white;
  border: 1px solid #ccc;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>