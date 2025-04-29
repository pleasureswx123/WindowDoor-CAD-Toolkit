<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// 是否处于横屏模式
const isLandscape = ref(true);

// 检查设备方向
const checkOrientation = () => {
  // 这里我们通过比较窗口的宽高比来判断是否为横屏
  isLandscape.value = window.innerWidth > window.innerHeight;
};

// 监听屏幕方向变化
onMounted(() => {
  // 初始检查
  checkOrientation();
  
  // 监听窗口大小变化事件
  window.addEventListener('resize', checkOrientation);
  
  // 监听方向变化事件 (部分移动端浏览器支持)
  try {
    const screenOrientation = window.screen?.orientation as any;
    if (screenOrientation && typeof screenOrientation.addEventListener === 'function') {
      screenOrientation.addEventListener('change', checkOrientation);
    } else if (typeof window.orientation !== 'undefined') {
      window.addEventListener('orientationchange', checkOrientation);
    }
  } catch (error) {
    console.log('注册方向变化事件监听器失败', error);
  }
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('resize', checkOrientation);
  
  try {
    const screenOrientation = window.screen?.orientation as any;
    if (screenOrientation && typeof screenOrientation.removeEventListener === 'function') {
      screenOrientation.removeEventListener('change', checkOrientation);
    } else if (typeof window.orientation !== 'undefined') {
      window.removeEventListener('orientationchange', checkOrientation);
    }
  } catch (error) {
    console.log('移除方向变化事件监听器失败', error);
  }
});
</script>

<template>
  <div v-if="!isLandscape" class="landscape-notice">
    <div class="notice-content">
      <div class="icon-rotate">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 2h3a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-3"></path>
          <path d="M9 22h9"></path>
          <path d="M9 2h9"></path>
          <rect x="3" y="8" width="12" height="8" rx="1"></rect>
          <path d="m13 12-2-2-2 2"></path>
        </svg>
      </div>
      <div class="notice-text">请横屏使用此应用</div>
      <div class="notice-subtext">为了获得最佳体验，请旋转您的设备</div>
    </div>
  </div>
</template>

<style scoped>
.landscape-notice {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #1e1e1e;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
}

.notice-content {
  padding: 24px;
  max-width: 80%;
}

.icon-rotate {
  color: #ffffff;
  margin-bottom: 24px;
  animation: rotate 2s infinite;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(90deg); }
  50% { transform: rotate(90deg); }
  75% { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
}

.notice-text {
  color: #ffffff;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 12px;
}

.notice-subtext {
  color: #a0a0a0;
  font-size: 16px;
}
</style> 