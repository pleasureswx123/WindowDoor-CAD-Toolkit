<script setup lang="ts">
import Sidebar from './components/Sidebar.vue';
import LandscapeNotice from './components/LandscapeNotice.vue';
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useUserStore } from './stores/userStore';
import { Icon } from '@iconify/vue';

const sidebarCollapsed = ref(false);
const isMobile = ref(false);
const userStore = useUserStore();
let tokenCheckTimer: number | null = null;
let resizeObserver: number | null = null;

// 处理侧边栏折叠状态变化
const handleCollapseChange = (value: boolean) => {
  sidebarCollapsed.value = value;
};

// 检测屏幕宽度
const checkScreenWidth = () => {
  isMobile.value = window.innerWidth <= 768;
  if (isMobile.value && !sidebarCollapsed.value) {
    sidebarCollapsed.value = true;
  }
};

// 锁定屏幕方向为横屏（如果设备支持）
const lockLandscapeOrientation = () => {
  // 仅在移动设备上尝试锁定方向
  if (isMobile.value) {
    try {
      // 使用更安全的类型检查方式
      const screenOrientation = window.screen?.orientation as any;
      if (screenOrientation && typeof screenOrientation.lock === 'function') {
        // 现代浏览器 Screen Orientation API
        screenOrientation.lock('landscape').catch((e: Error) => {
          console.log('无法锁定屏幕方向，使用备用提示', e);
        });
      }
    } catch (error) {
      console.log('锁定屏幕方向失败', error);
    }
  }
};

// 检查token状态
const checkTokenStatus = () => {
  userStore.checkLogin();
};

// 组件挂载时设置定时器和监听窗口大小变化
onMounted(() => {
  // 初始检查
  checkTokenStatus();
  checkScreenWidth();
  lockLandscapeOrientation();
  
  // 设置定时器，每30秒检查一次token状态
  tokenCheckTimer = window.setInterval(checkTokenStatus, 30000);
  
  // 监听窗口大小变化
  window.addEventListener('resize', checkScreenWidth);
});

// 组件卸载时清除定时器和事件监听
onUnmounted(() => {
  if (tokenCheckTimer !== null) {
    clearInterval(tokenCheckTimer);
    tokenCheckTimer = null;
  }
  
  window.removeEventListener('resize', checkScreenWidth);
});
</script>

<template>
  <div class="app-container">
    <!-- 横屏提示组件 -->
    <LandscapeNotice />
    
    <Sidebar 
      v-show="!isMobile || !sidebarCollapsed" 
      @collapse-change="handleCollapseChange" 
      :is-mobile="isMobile"
    />
    <div class="main-content" :class="{ 'expanded': sidebarCollapsed }">
      <div v-if="isMobile" class="mobile-menu-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
        <Icon icon="tabler:menu-2" />
      </div>
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
  position: relative;
}

.main-content.expanded {
  margin-left: 64px;
}

.mobile-menu-toggle {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 100;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  cursor: pointer;
  color: white;
  font-size: 24px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }
  
  .main-content.expanded {
    margin-left: 0;
  }
}
</style>
