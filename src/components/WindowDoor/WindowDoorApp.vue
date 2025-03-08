<script setup lang="ts">
// 门窗设计工具入口组件 - 对应React版本中的App.jsx
import RootFrame from './RootFrame.vue';
import SectionEdit from './SectionEdit.vue';
</script>

<template>
  <div class="window-door-app">
    <div class="edit-panel">
      <h3>窗户设计控制面板</h3>
      <SectionEdit />
    </div>
    <div class="canvas-container">
      <RootFrame />
    </div>
  </div>
</template>

<style scoped>
.window-door-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.edit-panel {
  padding: 15px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.canvas-container {
  flex: 1;
  min-height: 400px;
  overflow: auto;
}

@media (min-width: 768px) {
  .window-door-app {
    flex-direction: row;
  }
  
  .edit-panel {
    width: 300px;
    border-right: 1px solid #ddd;
    border-bottom: none;
  }
  
  .canvas-container {
    flex: 1;
  }
}
</style> 