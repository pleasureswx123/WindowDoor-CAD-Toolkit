<!-- 新版门窗设计工具 -->
<!-- 结合利用 @vue-konva.min.js 、 @RootWindow.ts，
 在当前文件实现 @RootWindow.ts 中提到的所有功能， 
 实现完善 @NewWindowDoorDesign.vue 实现高保真页面及交互功能，
 擅于利用 vue3 的 computed、watch、watchEffect、ref、reactive 等特性
 实现 @rootWindowStore.ts 数据管理，组件都提取到 @ src/components/new-window-door 文件夹中去，优化 @RootWindow.ts  -->

<template>
  <div class="window-door-design" :class="{ 'compact-mode': isCompactMode }">
    <el-header class="app-header" height="40px">
      <div class="header-left">
        <el-button-group>
          <el-button :icon="RefreshRight" size="small" title="撤销" @click="undo"/>
          <el-button :icon="RefreshLeft" size="small" title="重做" @click="redo"/>
        </el-button-group>
        <el-divider direction="vertical" />
        <el-button :icon="Message" size="small" @click="saveDesign">保存设计</el-button>
      </div>
      <div class="header-title">
        <span>门窗设计工具</span>
      </div>
      <div class="header-right">
        <el-tooltip content="切换紧凑模式" placement="bottom">
          <el-button :icon="isCompactMode ? ExpandIcon : FoldIcon" size="small" circle @click="toggleCompactMode" />
        </el-tooltip>
        <el-tooltip content="设置" placement="bottom">
          <el-button :icon="Setting" size="small" circle @click="showSettings = true" />
        </el-tooltip>
      </div>
    </el-header>
    
    <div class="main-content">
      <el-container>
        <el-aside :width="isCompactMode ? '60px' : '75px'" class="design-toolbar-container">
          <DesignToolbar 
            class="design-toolbar" 
            :is-compact="isCompactMode" 
            @toggle-preview="togglePreview" 
          />
        </el-aside>
        
        <el-main class="design-workspace">
          <div class="canvas-wrapper">
            <WindowCanvas class="design-canvas" :show-preview="showPreview" />
          </div>
          
          <div class="design-status-bar">
            <div class="status-info">
              <div v-if="selectedElementInfo">
                <el-tag size="small">{{ selectedElementInfo }}</el-tag>
              </div>
              <div v-else>
                <el-tag size="small" type="info">未选中元素</el-tag>
              </div>
            </div>
            <div class="scale-controls">
              <el-button-group>
                <el-button :icon="ZoomOut" size="small" @click="zoomOut" title="缩小"/>
                <el-button size="small">{{ Math.round(scale * 100) }}%</el-button>
                <el-button :icon="ZoomIn" size="small" @click="zoomIn" title="放大"/>
              </el-button-group>
            </div>
          </div>
        </el-main>
        
        <el-aside :width="isCompactMode ? '0' : '250px'" class="design-setting-panel-container">
          <SettingPanel class="design-setting-panel" v-show="!isCompactMode" />
        </el-aside>
      </el-container>
    </div>
    
    <!-- 设置对话框 -->
    <el-dialog
      v-model="showSettings"
      title="设置"
      width="500px"
      destroy-on-close
    >
      <div class="settings-content">
        <h3>显示选项</h3>
        <el-form label-position="left" label-width="120px">
          <el-form-item label="显示预览">
            <el-switch v-model="showPreview" />
          </el-form-item>
          <el-form-item label="显示网格">
            <el-switch v-model="showGrid" />
          </el-form-item>
          <el-form-item label="显示尺寸标注">
            <el-switch v-model="showDimensions" />
          </el-form-item>
        </el-form>
        
        <h3>单位设置</h3>
        <el-radio-group v-model="units">
          <el-radio-button label="mm">毫米</el-radio-button>
          <el-radio-button label="cm">厘米</el-radio-button>
          <el-radio-button label="inch">英寸</el-radio-button>
        </el-radio-group>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSettings = false">取消</el-button>
          <el-button type="primary" @click="applySettings">应用设置</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 移动设备侧边栏设置面板 -->
    <el-drawer
      v-model="showSettingDrawer"
      direction="rtl"
      title="设置面板"
      size="80%"
    >
      <SettingPanel />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, h } from 'vue';
import { Icon } from '@iconify/vue';
import { Setting } from '@element-plus/icons-vue';
import DesignToolbar from '../components/new-window-door/DesignToolbar.vue';
import WindowCanvas from '../components/new-window-door/WindowCanvas.vue';
import { useRootWindowStore } from '../stores/rootWindowStore';
import SettingPanel from '../components/new-window-door/SettingPanel.vue';

// 导入 Iconify 图标 - 创建组件而不是使用 markRaw
const RefreshRight = () => h(Icon, { icon: 'tabler:arrow-back-up' });
const RefreshLeft = () => h(Icon, { icon: 'tabler:arrow-forward-up' });
const Message = () => h(Icon, { icon: 'tabler:device-floppy' });
const ZoomIn = () => h(Icon, { icon: 'tabler:zoom-in' });
const ZoomOut = () => h(Icon, { icon: 'tabler:zoom-out' });
const FoldIcon = () => h(Icon, { icon: 'tabler:layout-sidebar-right-collapse' });
const ExpandIcon = () => h(Icon, { icon: 'tabler:layout-sidebar-right-expand' });

// store
const windowStore = useRootWindowStore();

// 视图缩放比例
const scale = computed(() => windowStore.viewState.scale);

// 界面模式相关
const isCompactMode = ref(false);
const showPreview = ref(true);
const showSettings = ref(false);
const showSettingDrawer = ref(false);
const showGrid = ref(true);
const showDimensions = ref(true);
const units = ref('mm');

// 记录是否为移动设备
const isMobile = ref(window.innerWidth < 768);

// 显示选中元素的信息
// const selectedElementInfo = computed(() => {
//   if (windowStore.selectedArea) {
//     return `选中区域: ${windowStore.selectedArea}`;
//   } else if (windowStore.selectedMuntin) {
//     return `选中中挺: ${windowStore.selectedMuntin}`;
//   } else if (windowStore.selectedSash) {
//     return `选中窗扇: ${windowStore.selectedSash}`;
//   }
//   return null;
// });


// 判断选中的元素类型
const selectedElementInfo = computed(() => {
  if (!windowStore.selectedElement) return '无';

  // 根据元素类型返回对应的名称
  const elementType = windowStore.selectedElement.ele || '未知元素';
  return elementType;
});

// 切换紧凑模式
function toggleCompactMode() {
  isCompactMode.value = !isCompactMode.value;
}

// 切换预览显示
function togglePreview() {
  showPreview.value = !showPreview.value;
}

// 缩放控制
function zoomIn() {
  if (windowStore.viewState.scale < 2) {
    windowStore.viewState.scale = Math.min(windowStore.viewState.scale + 0.1, 2);
  }
}

function zoomOut() {
  if (windowStore.viewState.scale > 0.3) {
    windowStore.viewState.scale = Math.max(windowStore.viewState.scale - 0.1, 0.3);
  }
}

// 应用设置
function applySettings() {
  windowStore.updateSettings({
    showGrid: showGrid.value,
    showDimensions: showDimensions.value,
    units: units.value
  });
  showSettings.value = false;
}

// 撤销/重做
function undo() {
  windowStore.undo();
}

function redo() {
  windowStore.redo();
}

// 保存设计
function saveDesign() {
  windowStore.exportWindowConfig();
}

// 响应窗口大小变化
function handleResize() {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) {
    isCompactMode.value = true;
  }
}

// 监听移动设备状态，自动打开侧边栏
watch(isCompactMode, (newValue) => {
  if (newValue && isMobile.value) {
    // 在紧凑模式下，如果有选中元素，自动打开设置抽屉
    if (windowStore.selectedElement) {
      showSettingDrawer.value = true;
    }
  }
});

// 监听元素选择状态，在紧凑模式下自动打开设置抽屉
watch(() => windowStore.selectedElement, (newValue) => {
  if (newValue && isCompactMode.value && isMobile.value) {
    showSettingDrawer.value = true;
  }
});

onMounted(() => {
  window.addEventListener('resize', handleResize);
  handleResize();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.window-door-design {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #1e1e1e;
  color: #e0e0e0;
  overflow: hidden;
}

.app-header {
  background-color: #2d2d2d;
  border-bottom: 1px solid #3e3e3e;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-size: 14px;
  font-weight: 500;
}

.main-content {
  flex: 1;
  overflow: hidden;
}

.el-container {
  height: 100%;
}

.design-toolbar-container {
  border-right: 1px solid #3e3e3e;
  background-color: #252525;
  transition: width 0.3s;
  overflow-x: hidden;
}

.design-setting-panel-container {
  border-left: 1px solid #3e3e3e;
  background-color: #252525;
  transition: width 0.3s;
  overflow-x: hidden;
}

.design-workspace {
  display: flex;
  flex-direction: column;
  padding: 0;
  background-color: #2d2d2d;
}

.canvas-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.design-canvas {
  height: 100%;
}

.design-status-bar {
  height: 30px;
  background-color: #252525;
  border-top: 1px solid #3e3e3e;
  display: flex;
  align-items: center;
  padding: 0 15px;
  justify-content: space-between;
}

.status-info {
  font-size: 12px;
}

.scale-controls {
  display: flex;
  align-items: center;
}

/* 紧凑模式样式 */
.compact-mode .design-toolbar-container {
  width: 60px !important;
}

.compact-mode .design-setting-panel-container {
  width: 0 !important;
}

/* 设置对话框样式 */
.settings-content h3 {
  margin-top: 16px;
  margin-bottom: 12px;
  font-size: 16px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 8px;
}

.settings-content .el-form {
  margin-bottom: 20px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .design-toolbar-container {
    width: 60px !important;
  }
  
  .design-setting-panel-container {
    width: 0 !important;
  }
  
  .app-header {
    padding: 0 5px;
  }
  
  .header-title {
    font-size: 12px;
  }
}
</style>