<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import WindowDoorApp from '@/components/WindowDoor/WindowDoorApp.vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

// 确保Pinia store被初始化
const store = useWindowDoorStore();
const router = useRouter();

// 初始化窗户尺寸
onMounted(() => {
  // 获取浏览器窗口尺寸，用于计算合适的初始窗户尺寸
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  // 根据浏览器尺寸调整窗户大小，确保适合屏幕
  // 如果尚未设置过尺寸或尺寸不合适，则进行调整
  const initialWidth = Math.min(1000, screenWidth * 0.6);
  const initialHeight = Math.min(2000, screenHeight * 0.7);
  
  // 更新窗户尺寸
  store.updateWindowSize(initialWidth, initialHeight);
});

// 页面标题
const pageTitle = '门窗设计工具';
</script>

<template>
  <div class="window-door-design-page">
    <div class="page-header">
      <h1>{{ pageTitle }}</h1>
      <div class="actions">
        <button class="primary-button" @click="$router.back()">返回</button>
        <button class="primary-button save-button">保存设计</button>
      </div>
    </div>
    
    <div class="design-container">
      <WindowDoorApp />
    </div>
  </div>
</template>

<style scoped>
.window-door-design-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.actions {
  display: flex;
  gap: 10px;
}

.primary-button {
  padding: 8px 16px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.primary-button:hover {
  background-color: #3a80d2;
}

.save-button {
  background-color: #42b983;
}

.save-button:hover {
  background-color: #3aa876;
}

.design-container {
  flex: 1;
  overflow: hidden;
}
</style> 