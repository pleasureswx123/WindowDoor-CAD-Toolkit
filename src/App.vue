<script setup lang="ts">
import Sidebar from './components/Sidebar.vue';
import { ref, onMounted, onUnmounted } from 'vue';
import { useUserStore } from './stores/userStore';

const sidebarCollapsed = ref(false);
const userStore = useUserStore();
let tokenCheckTimer: number | null = null;

// 处理侧边栏折叠状态变化
const handleCollapseChange = (value: boolean) => {
  sidebarCollapsed.value = value;
};

// 检查token状态
const checkTokenStatus = () => {
  userStore.checkLogin();
};

// 组件挂载时设置定时器
onMounted(() => {
  // 初始检查
  checkTokenStatus();
  
  // 设置定时器，每30秒检查一次token状态
  tokenCheckTimer = window.setInterval(checkTokenStatus, 30000);
});

// 组件卸载时清除定时器
onUnmounted(() => {
  if (tokenCheckTimer !== null) {
    clearInterval(tokenCheckTimer);
    tokenCheckTimer = null;
  }
});
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
