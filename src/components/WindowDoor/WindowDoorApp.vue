<script setup lang="ts">
// 门窗设计工具入口组件
import { ref, onMounted } from 'vue';
import RootFrame from './RootFrame.vue';
import SectionEdit from './SectionEdit.vue';
import SizeControlPanel from './SizeControlPanel.vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const store = useWindowDoorStore();
// 定义正确的类型，包含暴露的方法
const rootFrameRef = ref<{
  toggleGrid: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
} | null>(null);

// 检查窗户中是否存在空区域
const hasEmptySection = () => {
  // 递归检查节点
  const checkSection = (section: any): boolean => {
    // 如果当前节点是空区域，返回true
    if (section.type === 'empty') return true;
    
    // 如果有子节点，递归检查
    if (section.sections && section.sections.length > 0) {
      for (const childSection of section.sections) {
        if (childSection.nodeType === 'section' && checkSection(childSection)) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  // 从根窗户开始检查
  if (store.root && store.root.sections && store.root.sections[0]) {
    return checkSection(store.root.sections[0]);
  }
  
  return false;
};

// 初始化时检查空区域
onMounted(() => {
  // 延迟一下，确保窗户完全初始化
  setTimeout(() => {
    hasEmptySection(); // 只检查，不再显示引导
  }, 500);
});

// 工具选择状态
const currentTool = ref('select');

// 可用工具列表
const tools = [
  { id: 'select', name: '选择', icon: 'i-lucide-mouse-pointer' },
  { id: 'splitVertical', name: '垂直分割', icon: 'i-lucide-square-split-horizontal' },
  { id: 'splitHorizontal', name: '水平分割', icon: 'i-lucide-square-split-vertical' },
  { id: 'fixed', name: '固定窗', icon: 'i-lucide-square' },
  { id: 'leftOpen', name: '左开窗', icon: 'i-lucide-panel-left-open' },
  { id: 'rightOpen', name: '右开窗', icon: 'i-lucide-panel-right-open' },
  { id: 'tiltLeft', name: '倾斜左开', icon: 'i-mdi-rotate-left-variant' },
  { id: 'tiltRight', name: '倾斜右开', icon: 'i-mdi-rotate-right-variant' },
];

// 视图控制工具
const viewTools = [
  { id: 'toggleMetrics', name: '标尺', icon: 'i-tabler-ruler-measure', active: true },
  { id: 'toggleGrid', name: '网格', icon: 'i-mdi-grid', active: false },
  { id: 'zoomIn', name: '放大', icon: 'ep:zoom-in' },
  { id: 'zoomOut', name: '缩小', icon: 'ep:zoom-out' },
  { id: 'resetZoom', name: '重置缩放', icon: 'i-lucide-focus' },
];

// 处理工具选择
const selectTool = (toolId: string) => {
  currentTool.value = toolId;
  
  // 根据工具执行相应操作
  switch (toolId) {
    case 'splitVertical':
      if (store.selectedSection) {
        store.splitCurrentSection('vertical');
        // 完成后切回选择工具
        currentTool.value = 'select';
      }
      break;
    case 'splitHorizontal':
      if (store.selectedSection) {
        store.splitCurrentSection('horizontal');
        // 完成后切回选择工具
        currentTool.value = 'select';
      }
      break;
    case 'fixed':
    case 'leftOpen':
    case 'rightOpen':
    case 'tiltLeft':
    case 'tiltRight':
      const typeMap: Record<string, string> = {
        fixed: 'none',
        leftOpen: 'left',
        rightOpen: 'right',
        tiltLeft: 'tilt,left',
        tiltRight: 'tilt,right'
      };
      
      if (store.selectedSection && typeMap[toolId]) {
        store.setSectionType(typeMap[toolId]);
        // 完成后切回选择工具
        currentTool.value = 'select';
      }
      break;
  }
};

// 处理视图工具操作
const handleViewTool = (toolId: string) => {
  switch (toolId) {
    case 'toggleMetrics':
      store.toggleMetricsVisibility();
      // 更新激活状态
      const metricsToolIndex = viewTools.findIndex(t => t.id === 'toggleMetrics');
      if (metricsToolIndex >= 0) {
        viewTools[metricsToolIndex].active = store.isMetricsVisible();
      }
      break;
    case 'toggleGrid':
      // 切换网格显示状态
      const gridToolIndex = viewTools.findIndex(t => t.id === 'toggleGrid');
      if (gridToolIndex >= 0) {
        viewTools[gridToolIndex].active = !viewTools[gridToolIndex].active;
        // 调用根框架的网格切换方法
        if (rootFrameRef.value) {
          rootFrameRef.value.toggleGrid();
        }
      }
      break;
    case 'zoomIn':
      // 调用根框架的放大方法
      if (rootFrameRef.value) {
        rootFrameRef.value.zoomIn();
      }
      break;
    case 'zoomOut':
      // 调用根框架的缩小方法
      if (rootFrameRef.value) {
        rootFrameRef.value.zoomOut();
      }
      break;
    case 'resetZoom':
      // 调用根框架的重置缩放方法
      if (rootFrameRef.value) {
        rootFrameRef.value.resetZoom();
      }
      break;
  }
};
</script>

<template>
  <div class="window-door-app">
    <!-- 左侧工具面板 -->
    <div class="tools-panel">
      <div class="tools-group">
        <div v-for="tool in tools" :key="tool.id" :class="['tool-item']"
          @click="selectTool(tool.id)" :title="tool.name">
          <el-tooltip :content="tool.name" placement="right">
            <div class="tool-button">
              <icon-lucide-mouse-pointer v-if="tool.icon === 'i-lucide-mouse-pointer'" />
              <icon-lucide-square-split-horizontal v-else-if="tool.icon === 'i-lucide-square-split-horizontal'" />
              <icon-lucide-square-split-vertical v-else-if="tool.icon === 'i-lucide-square-split-vertical'" />
              <icon-lucide-square v-else-if="tool.icon === 'i-lucide-square'" />
              <icon-lucide-panel-left-open v-else-if="tool.icon === 'i-lucide-panel-left-open'" />
              <icon-lucide-panel-right-open v-else-if="tool.icon === 'i-lucide-panel-right-open'" />
              <icon-mdi-rotate-left-variant v-else-if="tool.icon === 'i-mdi-rotate-left-variant'" />
              <icon-mdi-rotate-right-variant v-else-if="tool.icon === 'i-mdi-rotate-right-variant'" />
            </div>
          </el-tooltip>
        </div>
      </div>

      <div class="tools-separator"></div>

      <div class="tools-group">
        <div v-for="tool in viewTools" :key="tool.id" :class="['tool-item']"
          @click="handleViewTool(tool.id)" :title="tool.name">
          <el-tooltip :content="tool.name" placement="right">
            <div class="tool-button">
              <icon-tabler-ruler-measure v-if="tool.icon === 'i-tabler-ruler-measure'" />
              <icon-mdi-grid v-else-if="tool.icon === 'i-mdi-grid'" />
              <icon-ep:zoom-in v-else-if="tool.icon === 'ep:zoom-in'" />
              <icon-ep:zoom-out v-else-if="tool.icon === 'ep:zoom-out'" />
              <icon-lucide-focus v-else-if="tool.icon === 'i-lucide-focus'" />
            </div>
          </el-tooltip>
        </div>
      </div>
    </div>

    <!-- 中央画布区域 -->
    <div class="canvas-container">
      <RootFrame ref="rootFrameRef" />
    </div>

    <!-- 右侧属性面板 -->
    <div class="properties-panel">
      <el-tabs type="border-card">
        <el-tab-pane label="窗框设置">
          <div class="panel-section">
            <h4>窗户尺寸</h4>
            <SizeControlPanel />
          </div>
        </el-tab-pane>

        <el-tab-pane label="区域设置">
          <div class="panel-section">
            <SectionEdit />
          </div>
        </el-tab-pane>

        <el-tab-pane label="中挺设置">
          <div class="panel-section">
            <el-empty description="选择一个中挺以编辑" :image-size="100" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 状态提示 -->
    <div class="status-bar">
      <div v-if="store.selectedSection" class="status-info">
        当前选中：区域 #{{ store.selectedSection.id }}
        <span v-if="store.selectedSection.type">- 类型：{{ store.selectedSection.type }}</span>
      </div>
      <div v-else class="status-info">
        未选中区域 - 点击选择一个区域进行编辑
      </div>
    </div>
  </div>
</template>

<style scoped>
.window-door-app {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
}

/* 左侧工具面板 */
.tools-panel {
  width: 60px;
  background-color: #2c2c2c;
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.tools-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 5px;
}

.tools-separator {
  height: 1px;
  background-color: #444;
  margin: 10px 5px;
}

.tool-item {
  cursor: pointer;
  border-radius: 4px;
  padding: 6px;
  color: #e0e0e0;
  transition: all 0.2s;
}

.tool-item:hover {
  background-color: #3a3a3a;
}

.tool-item.active {
  background-color: #4a90e2;
  color: white;
}

.tool-button {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
}

/* 中间画布区域 */
.canvas-container {
  flex: 1;
  overflow: hidden;
  background-color: #f0f0f0;
  position: relative;
}

/* 右侧属性面板 */
.properties-panel {
  width: 300px;
  background-color: #f5f5f5;
  border-left: 1px solid #ddd;
  overflow-y: auto;
}

.panel-section {
  padding: 10px;
}

.panel-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
  font-size: 14px;
}

/* 状态栏 */
.status-bar {
  position: absolute;
  bottom: 0;
  left: 60px; /* 左侧工具栏宽度 */
  right: 300px; /* 右侧属性面板宽度 */
  height: 24px;
  background-color: #f0f0f0;
  border-top: 1px solid #ddd;
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 12px;
  color: #666;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .properties-panel {
    width: 280px;
  }
  
  .status-bar {
    right: 280px;
  }
}

@media (max-width: 768px) {
  .window-door-app {
    flex-direction: column;
  }
  
  .tools-panel {
    width: 100%;
    height: 50px;
    flex-direction: row;
    justify-content: space-between;
    padding: 0 10px;
  }
  
  .tools-group {
    flex-direction: row;
  }
  
  .tools-separator {
    width: 1px;
    height: auto;
    margin: 0 10px;
  }
  
  .properties-panel {
    width: 100%;
    height: 300px;
    border-left: none;
    border-top: 1px solid #ddd;
  }
  
  .status-bar {
    left: 0;
    right: 0;
    bottom: 300px;
  }
}
</style> 