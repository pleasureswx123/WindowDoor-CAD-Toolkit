<script setup lang="ts">
// 门窗设计工具入口组件 - 对应React版本中的App.jsx
import { ref, onMounted } from 'vue';
import RootFrame from './RootFrame.vue';
import SectionEdit from './SectionEdit.vue';
import SizeControlPanel from './SizeControlPanel.vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const store = useWindowDoorStore();

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
</script>

<template>
  <div class="window-door-app">
    <div class="edit-panel">
      <h3>窗户设计控制面板</h3>
      
      <!-- 添加尺寸控制面板 -->
      <div class="panel-section">
        <h4>窗户尺寸</h4>
        <SizeControlPanel />
      </div>
      
      <!-- 现有的区域编辑面板 -->
      <div class="panel-section">
        <h4>区域属性</h4>
        <SectionEdit />
      </div>
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

.panel-section {
  margin-bottom: 20px;
}

.panel-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
  font-size: 14px;
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