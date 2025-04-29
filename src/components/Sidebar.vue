<script setup lang="ts">
import { ref, computed, onMounted, h, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Icon } from '@iconify/vue';

const props = defineProps({
  isMobile: {
    type: Boolean,
    default: false
  }
});

const router = useRouter();
const route = useRoute();
const emit = defineEmits(['collapse-change']);

const isMobile = ref(props.isMobile);
const isCollapsed = ref(false);

// 监听折叠状态变化并发射事件
watch(isCollapsed, (value) => {
  emit('collapse-change', value);
});

// 监听props中的isMobile变化
watch(() => props.isMobile, (newVal) => {
  isMobile.value = newVal;
  if (newVal && !isCollapsed.value) {
    isCollapsed.value = true;
  }
});

// 响应式计算当前路由
const activeIndex = computed(() => route.path);

// 导航菜单项
const menuItems = [
  { 
    path: '/', 
    title: '首页', 
    icon: () => h(Icon, { icon: 'tabler:home' }) 
  },
  { 
    path: '/design', 
    title: '门窗设计', 
    icon: () => h(Icon, { icon: 'tabler:window' }) 
  },
  { 
    path: '/glass', 
    title: '玻璃切割', 
    icon: () => h(Icon, { icon: 'tabler:glass-full' }) 
  },
  { 
    path: '/plastic-steel', 
    title: '型材切割',
    icon: () => h(Icon, { icon: 'tabler:ruler' })
  }
];

// 切换侧边栏折叠状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// 导航到指定路由
const navigateTo = (path: string) => {
  router.push(path);
  if (isMobile.value) {
    isCollapsed.value = true; // 移动端点击导航项后自动折叠
  }
};

// 只在组件内部检测屏幕大小变化，如果外部没有提供isMobile值
onMounted(() => {
  // 如果父组件已经处理了移动端检测，则不需要在这里再次检测
  if (!props.isMobile) {
    const checkScreenSize = () => {
      isMobile.value = window.innerWidth < 768;
      isCollapsed.value = isMobile.value;
    };
    
    // 初始检查
    checkScreenSize();
    
    // 监听窗口大小变化
    window.addEventListener('resize', checkScreenSize);
    
    // 组件卸载时移除事件监听
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  } else {
    // 使用父组件传入的值初始化
    isCollapsed.value = isMobile.value;
  }
});
</script>

<template>
  <div class="sidebar-container" :class="{ 'collapsed': isCollapsed, 'mobile': isMobile }">
    <!-- 顶部标题和折叠按钮 -->
    <div class="sidebar-header">
      <div class="sidebar-title" v-if="!isCollapsed">门窗设计工具</div>
      <el-button class="collapse-btn" circle @click="toggleCollapse">
        <Icon icon="tabler:menu-2" />
      </el-button>
    </div>

    <!-- 导航菜单 -->
    <el-menu :default-active="activeIndex" class="sidebar-menu" :collapse="isCollapsed" :collapse-transition="false"
      @select="navigateTo">
      <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path" @click="navigateTo(item.path)">
        <el-icon>
          <component :is="item.icon" />
        </el-icon>
        <template #title>{{ item.title }}</template>
      </el-menu-item>
    </el-menu>

    <!-- 底部设置按钮 -->
    <div class="sidebar-footer">
      <el-tooltip :content="isCollapsed ? '反馈' : ''" placement="right" :disabled="!isCollapsed">
        <el-button class="feedback-btn" circle @click="navigateTo('/feedback')">
          <Icon icon="tabler:brand-feedly" />
        </el-button>
      </el-tooltip>
      <div class="version" v-if="!isCollapsed">Version 1.0</div>
    </div>

    <!-- 移动端遮罩层 -->
    <div v-if="isMobile && !isCollapsed" class="sidebar-overlay" @click="toggleCollapse"></div>
  </div>
</template>

<style scoped>
.sidebar-container {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  background-color: #252525;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #3e3e3e;
  transition: all 0.3s ease;
  z-index: 1000;
  width: 220px;
}

.sidebar-container.collapsed {
  width: 64px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  height: 60px;
  border-bottom: 1px solid #3e3e3e;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 500;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collapse-btn {
  padding: 6px;
  color: #e0e0e0;
  background-color: transparent;
  border: none;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  background-color: transparent;
}

.sidebar-menu :deep(.el-menu-item) {
  color: #e0e0e0;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: #3e3e3e;
  color: #fff;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: #2d2d2d;
}

.sidebar-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  height: 60px;
  border-top: 1px solid #3e3e3e;
}

.version {
  font-size: 12px;
  color: #8c8c8c;
}

.feedback-btn {
  padding: 6px;
  color: #e0e0e0;
  background-color: transparent;
  border: none;
}

/* 移动端样式 */
.sidebar-container.mobile {
  transform: translateX(-100%);
  box-shadow: none;
}

.sidebar-container.mobile:not(.collapsed) {
  transform: translateX(0);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* 暗黑主题适配 */
:deep(.el-menu) {
  --el-menu-bg-color: transparent;
  --el-menu-text-color: #e0e0e0;
  --el-menu-hover-bg-color: #2d2d2d;
  --el-menu-active-color: #ffffff;
  --el-menu-item-height: 50px;
}

:deep(.el-menu-item) {
  display: flex;
  align-items: center;
}

:deep(.el-tooltip__trigger) {
  display: flex;
  justify-content: center;
}
</style> 