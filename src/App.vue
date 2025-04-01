<script setup lang="ts">
import Sidebar from './components/Sidebar.vue';
import { ref } from 'vue';

const sidebarCollapsed = ref(false);

// 处理侧边栏折叠状态变化
const handleCollapseChange = (value: boolean) => {
  sidebarCollapsed.value = value;
};
</script>

<template>
  <div class="app-container">
    <Sidebar @collapse-change="handleCollapseChange" />
    <div class="main-content" :class="{ 'expanded': sidebarCollapsed }">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  transition: margin-left 0.3s ease;
  margin-left: 220px;
  min-height: 100vh;
  overflow-x: hidden;
  background-color: #1e1e1e;
}

.main-content.expanded {
  margin-left: 64px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }
}
</style>
