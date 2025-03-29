<template>
  <div class="window-door-design" :class="{ 'compact-mode': isCompactMode }">
    <el-header class="app-header" height="40px">
      <div class="header-left">
        <el-button-group>
          <el-button :icon="Delete" size="small" title="删除选中元素" @click="deleteSelected" />
          <el-button :icon="DeleteFilled" size="small" title="清空设计" @click="confirmClear" />
        </el-button-group>
        <el-divider direction="vertical" />
        <el-button-group>
          <el-button :icon="Plus" size="small" @click="showNewDesignDialog = true">新建</el-button>
          <el-button :icon="FolderOpened" size="small" @click="openHistoryDesigns">历史</el-button>
          <el-button :icon="Message" size="small" @click="saveDesign">保存</el-button>
        </el-button-group>
      </div>
      <div class="header-title">
        <span>{{ windowStore.currentDesignName || '未命名设计' }}</span>
      </div>
      <div class="header-right">
        <el-tooltip content="切换紧凑模式" placement="bottom">
          <el-button :icon="isCompactMode ? ExpandIcon : FoldIcon" size="small" circle @click="toggleCompactMode" />
        </el-tooltip>
        <el-tooltip content="设置" placement="bottom">
          <el-button :icon="SettingIcon" size="small" circle @click="showSettings = true" />
        </el-tooltip>
      </div>
    </el-header>

    <div class="main-content">
      <el-container>
        <el-aside :width="isCompactMode ? '60px' : '75px'" class="design-toolbar-container">
          <DesignToolbar class="design-toolbar" :is-compact="isCompactMode" @toggle-preview="togglePreview"
            @show-material-stats="showMaterialStats" @show-3d-view="show3DView" />
        </el-aside>

        <el-main class="design-workspace">
          <div class="canvas-wrapper">
            <WindowCanvas class="design-canvas" :show-preview="showPreview" />
          </div>

          <div class="design-status-bar">
            <div class="status-info">
              <div v-if="selectedElementInfo">
                <el-tag size="small" :type="elementTagType" effect="dark">{{ selectedElementInfo }}</el-tag>
              </div>
              <div v-else>
                <el-tag size="small" type="info" effect="dark">未选中元素</el-tag>
              </div>
            </div>
            <div class="scale-controls">
              <el-button-group>
                <el-button :icon="ZoomOut" size="small" @click="zoomOut" title="缩小" />
                <el-button size="small">{{ Math.round(scale * 100) }}%</el-button>
                <el-button :icon="ZoomIn" size="small" @click="zoomIn" title="放大" />
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
    <el-dialog v-model="showSettings" title="设置" width="650px" destroy-on-close>
      <el-tabs>
        <el-tab-pane label="显示设置">
          <div class="setting-panel">
            <WindowBaseProperties col="5"  />
          </div>
        </el-tab-pane>
        <el-tab-pane label="材料统计">
          <MaterialStatsTable />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSettings = false">关闭</el-button>
          <el-button type="primary" @click="applySettings">应用设置</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 材料统计对话框 -->
    <el-dialog v-model="showMaterialStatsDialog" title="材料用量统计" width="800px" destroy-on-close>
      <MaterialStatsTable />
    </el-dialog>

    <!-- 移动设备侧边栏设置面板 -->
    <el-drawer v-model="showSettingDrawer" direction="rtl" title="设置面板" size="80%">
      <SettingPanel />
    </el-drawer>

    <!-- 确认清空对话框 -->
    <el-dialog v-model="showClearConfirmDialog" title="确认清空" width="300px" :close-on-click-modal="false">
      <span>确定要清空当前设计吗？此操作可以撤销。</span>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showClearConfirmDialog = false">取消</el-button>
          <el-button type="danger" @click="clearDesign">确定清空</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 新建窗户设计对话框 -->
    <el-dialog v-model="showNewDesignDialog" title="新建窗户设计" width="400px" :close-on-click-modal="false">
      <el-form :model="newDesignForm" label-position="top">
        <el-form-item label="设计名称">
          <el-input v-model="newDesignForm.name" placeholder="请输入设计名称" />
        </el-form-item>
        <el-form-item label="窗户宽度 (mm)">
          <el-input-number v-model="newDesignForm.width" :min="500" :max="10000" :step="50" />
        </el-form-item>
        <el-form-item label="窗户高度 (mm)">
          <el-input-number v-model="newDesignForm.height" :min="500" :max="10000" :step="50" />
        </el-form-item>
        <el-form-item label="窗框尺寸 (mm)">
          <el-input-number v-model="newDesignForm.frameSize" :min="30" :max="200" :step="5" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showNewDesignDialog = false">取消</el-button>
          <el-button type="primary" @click="createNewDesign">创建</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 保存设计对话框 -->
    <el-dialog v-model="showSaveDesignDialog" title="保存窗户设计" width="400px" :close-on-click-modal="false">
      <el-form :model="saveDesignForm">
        <el-form-item label="设计名称">
          <el-input v-model="saveDesignForm.name" placeholder="请输入设计名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showSaveDesignDialog = false">取消</el-button>
          <el-button type="primary" @click="saveDesignToIndexedDB">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 历史窗户设计列表对话框 -->
    <el-dialog v-model="showHistoryDesignDialog" title="历史窗户设计" width="800px" :close-on-click-modal="false"
      destroy-on-close>
      <div v-if="windowStore.isLoading" class="loading-container">
        <el-icon class="is-loading">
          <LoadingIcon />
        </el-icon>
        <span>加载中...</span>
      </div>
      <div v-else-if="windowStore.windowDesignList.length === 0" class="empty-designs">
        <el-icon>
          <CirclePlusIcon />
        </el-icon>
        <p>没有历史设计，点击新建创建一个新的窗户设计</p>
      </div>
      <el-scrollbar v-else height="500px">
        <div class="design-list">
          <div v-for="design in windowStore.windowDesignList" :key="design.id" class="design-item">
            <div class="design-thumbnail" @click="loadDesign(design.id)">
              <img v-if="design.thumbnail" :src="design.thumbnail" alt="设计缩略图" />
              <div v-else class="no-thumbnail">
                <span>暂无预览</span>
              </div>
            </div>
            <div class="design-info">
              <h3>{{ design.name }}</h3>
              <p>尺寸: {{ design.width }} × {{ design.height }} mm</p>
              <p>创建时间: {{ formatDate(design.createdAt) }}</p>
              <p>更新时间: {{ formatDate(design.updatedAt) }}</p>
            </div>
            <div class="design-actions">
              <el-button-group>
                <el-button type="primary" size="small" @click="loadDesign(design.id)">打开</el-button>
                <el-button type="danger" size="small" @click="confirmDeleteDesign(design)">删除</el-button>
              </el-button-group>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </el-dialog>

    <!-- 确认删除设计对话框 -->
    <el-dialog v-model="showDeleteDesignConfirmDialog" title="确认删除" width="300px" :close-on-click-modal="false">
      <span>确定要删除设计 "{{ designToDelete?.name || '' }}" 吗？此操作不可恢复。</span>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showDeleteDesignConfirmDialog = false">取消</el-button>
          <el-button type="danger" @click="deleteDesign">确定删除</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 3D视图对话框 -->
    <el-dialog v-model="show3DViewDialog" title="3D窗户视图" width="90%" :close-on-click-modal="true"
      :fullscreen="true" destroy-on-close>
      <div class="three-js-container">
        <ThreeJsWindow 
          ref="threeJsWindowRef" 
          :width="threeJsWidth" 
          :height="threeJsHeight" 
          :window-structure="windowStore.windowStructure || undefined"
          :window-config="windowStore.windowConfig" />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="show3DViewDialog = false">关闭</el-button>
          <el-button type="primary" @click="toggleWindowOpen">
            {{ isWindowOpen ? '关闭窗户' : '打开窗户' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, h, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Icon } from '@iconify/vue';
import DesignToolbar from '../components/DesignToolbar.vue';
import WindowCanvas from '../components/WindowCanvas.vue';
import { useRootWindowStore } from '../stores/rootWindowStore';
import SettingPanel from '../components/SettingPanel.vue';
import MaterialStatsTable from '../components/MaterialStatsTable.vue';
import type { WindowDesign } from '../utils/IndexedDBService';
import WindowBaseProperties from '@/components/WindowBaseProperties.vue';
import ThreeJsWindow from '@/components/ThreeJsWindow.vue';

// 导入 Iconify 图标 - 创建组件而不是使用 markRaw
const RefreshRight = () => h(Icon, { icon: 'tabler:arrow-back-up' });
const RefreshLeft = () => h(Icon, { icon: 'tabler:arrow-forward-up' });
const Message = () => h(Icon, { icon: 'tabler:device-floppy' });
const ZoomIn = () => h(Icon, { icon: 'tabler:zoom-in' });
const ZoomOut = () => h(Icon, { icon: 'tabler:zoom-out' });
const FoldIcon = () => h(Icon, { icon: 'tabler:layout-sidebar-right-collapse' });
const ExpandIcon = () => h(Icon, { icon: 'tabler:layout-sidebar-right-expand' });
const Delete = () => h(Icon, { icon: 'tabler:trash' });
const DeleteFilled = () => h(Icon, { icon: 'tabler:trash-filled' });
const Plus = () => h(Icon, { icon: 'tabler:plus' });
const FolderOpened = () => h(Icon, { icon: 'tabler:folder' });
const SettingIcon = () => h(Icon, { icon: 'tabler:settings' });
const LoadingIcon = () => h(Icon, { icon: 'tabler:loader' });
const CirclePlusIcon = () => h(Icon, { icon: 'tabler:circle-plus' });

// store
const windowStore = useRootWindowStore();

// 视图缩放比例
const scale = computed(() => windowStore.viewState.scale);

// 界面模式相关
const isCompactMode = ref(false);
const showPreview = ref(true);
const showSettings = ref(false);
const showMaterialStatsDialog = ref(false);
const showSettingDrawer = ref(false);
const showGrid = ref(true);
const showDimensions = ref(true);
const units = ref('mm');
const showClearConfirmDialog = ref(false);

// 新建设计相关
const showNewDesignDialog = ref(false);
const newDesignForm = ref({
  name: '新窗户设计',
  width: 1000,
  height: 1000,
  frameSize: 50
});

// 保存设计相关
const showSaveDesignDialog = ref(false);
const saveDesignForm = ref({
  name: ''
});

// 历史设计相关
const showHistoryDesignDialog = ref(false);
const showDeleteDesignConfirmDialog = ref(false);
const designToDelete = ref<WindowDesign | null>(null);

// Canvas引用
const canvasRef = ref<typeof WindowCanvas | null>(null);

// 3D视图相关
const show3DViewDialog = ref(false);
const threeJsWindowRef = ref<InstanceType<typeof ThreeJsWindow> | null>(null);
const isWindowOpen = ref(false);
const threeJsWidth = ref(800);
const threeJsHeight = ref(600);
const isMobile = ref(false);

// 判断选中的元素类型
const selectedElementInfo = computed(() => {
  if (!windowStore.selectedElement) return '无选中元素';

  // 根据元素类型返回对应的中文名称
  const elementType = windowStore.selectedElement.ele || '未知元素';
  
  // 将技术类型名称映射为用户友好的中文描述
  const typeNameMap: Record<string, string> = {
    'window-frame': '窗框',
    'window-muntin': '中挺',
    'window-sash': '窗扇',
    'window-sash-fixed': '固定窗扇',
    'window-sash-left': '左开窗扇',
    'window-sash-right': '右开窗扇',
    'window-sash-tilt-left': '左倾斜窗扇',
    'window-sash-tilt-right': '右倾斜窗扇',
    'window-empty-area': '空白区域',
    'window-glazing': '玻璃面板'
  };
  
  // 返回友好的中文名称，如果没有映射则返回原始类型名称
  return `当前选中：${typeNameMap[elementType] || elementType}`;
});

// 根据元素类型确定标签样式
const elementTagType = computed(() => {
  if (!windowStore.selectedElement) return 'info';
  
  const elementType = windowStore.selectedElement.ele || '';
  
  // 根据元素类型返回不同的标签类型
  if (elementType.includes('window-frame')) {
    return 'warning'; // 窗框使用橙色警告标签
  } else if (elementType.includes('window-muntin')) {
    return 'primary'; // 中挺使用蓝色主要标签
  } else if (elementType.includes('window-sash')) {
    return 'success'; // 窗扇使用绿色成功标签
  } else if (elementType.includes('window-empty-area')) {
    return 'info'; // 空白区域使用灰色信息标签
  } else if (elementType.includes('window-glazing')) {
    return 'danger'; // 玻璃面板使用红色危险标签
  }
  
  return 'info'; // 默认使用信息标签
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

// 格式化日期
function formatDate(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// 创建新窗户设计
function createNewDesign() {
  windowStore.createNewWindow(
    newDesignForm.value.width,
    newDesignForm.value.height,
    newDesignForm.value.frameSize,
    newDesignForm.value.name
  );
  
  showNewDesignDialog.value = false;
}

// 保存设计
function saveDesign() {
  saveDesignForm.value.name = windowStore.currentDesignName;
  showSaveDesignDialog.value = true;
}

// 保存设计到IndexedDB
async function saveDesignToIndexedDB() {
  // 获取窗口Canvas组件引用，以便生成缩略图
  const canvasElement = document.querySelector('.design-canvas canvas') as HTMLCanvasElement | null;
  
  // 保存到IndexedDB
  const getThumbnail = () => {
    if (canvasElement) {
      try {
        return canvasElement.toDataURL('image/png');
      } catch (e) {
        console.error('生成缩略图失败:', e);
      }
    }
    return '';
  };
  
  const savedId = await windowStore.saveWindowDesignToDB(saveDesignForm.value.name, getThumbnail);
  
  if (savedId) {
    // 显示成功消息
    ElMessage({
      message: '设计保存成功',
      type: 'success'
    });
  } else {
    // 显示错误消息
    ElMessage({
      message: '设计保存失败',
      type: 'error'
    });
  }
  
  showSaveDesignDialog.value = false;
}

// 打开历史窗户设计列表
async function openHistoryDesigns() {
  // 加载历史设计列表
  await windowStore.loadWindowDesignList();
  showHistoryDesignDialog.value = true;
}

// 加载指定ID的设计
async function loadDesign(id: string) {
  const success = await windowStore.loadWindowDesign(id);
  
  if (success) {
    showHistoryDesignDialog.value = false;
    // 显示成功消息
    ElMessage({
      message: '设计加载成功',
      type: 'success'
    });
  } else {
    // 显示错误消息
    ElMessage({
      message: '设计加载失败',
      type: 'error'
    });
  }
}

// 确认删除设计
function confirmDeleteDesign(design: WindowDesign) {
  designToDelete.value = design;
  showDeleteDesignConfirmDialog.value = true;
}

// 删除设计
async function deleteDesign() {
  if (!designToDelete.value) return;
  
  const success = await windowStore.deleteWindowDesignFromDB(designToDelete.value.id);
  
  if (success) {
    // 显示成功消息
    ElMessage({
      message: '设计删除成功',
      type: 'success'
    });
  } else {
    // 显示错误消息
    ElMessage({
      message: '设计删除失败',
      type: 'error'
    });
  }
  
  showDeleteDesignConfirmDialog.value = false;
  designToDelete.value = null;
}

// 显示材料统计对话框
function showMaterialStats() {
  showMaterialStatsDialog.value = true;
}

// 删除选中元素
function deleteSelected() {
  windowStore.deleteSelectedElement();
}

// 确认清空设计
function confirmClear() {
  showClearConfirmDialog.value = true;
}

// 执行清空设计
function clearDesign() {
  windowStore.clearDesign();
  showClearConfirmDialog.value = false;
}

// 打开3D视图
const show3DView = () => {
  show3DViewDialog.value = true;
  // 重新计算3D视图大小
  nextTick(() => {
    updateThreeJsContainerSize();
  });
};

// 更新3D视图容器大小
const updateThreeJsContainerSize = () => {
  const container = document.querySelector('.three-js-container');
  if (container) {
    threeJsWidth.value = container.clientWidth;
    threeJsHeight.value = Math.min(container.clientWidth * 0.75, window.innerHeight * 0.8);
  }
};

// 切换窗户开关状态
const toggleWindowOpen = () => {
  isWindowOpen.value = !isWindowOpen.value;
  if (threeJsWindowRef.value) {
    threeJsWindowRef.value.toggleWindowOpen();
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  handleResize();
  
  // 初始化窗户设计
  if (!windowStore.windowStructure) {
    windowStore.initializeWindow();
  }

  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth <= 768;
    // 如果3D视图对话框打开，则更新容器大小
    if (show3DViewDialog.value) {
      updateThreeJsContainerSize();
    }
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('resize', () => {});
});

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
</script>

<style scoped>
.setting-panel {
  background-color: #252525;
  padding: 10px;
}
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

.status-info .el-tag {
  border-radius: 4px;
  padding: 0 10px;
  height: 24px;
  line-height: 24px;
  font-weight: 500;
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

/* 添加历史设计列表样式 */
.design-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 10px;
}

.design-item {
  border: 1px solid #3e3e3e;
  border-radius: 8px;
  overflow: hidden;
  background-color: #252525;
  display: flex;
  flex-direction: column;
}

.design-thumbnail {
  height: 200px;
  background-color: #1e1e1e;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.design-thumbnail img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.no-thumbnail {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #777;
  font-size: 14px;
}

.design-info {
  padding: 10px;
  flex: 1;
}

.design-info h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #fff;
}

.design-info p {
  margin: 5px 0;
  font-size: 12px;
  color: #bbb;
}

.design-actions {
  padding: 10px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #3e3e3e;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  flex-direction: column;
  gap: 10px;
}

.loading-container .el-icon {
  font-size: 30px;
}

.empty-designs {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #777;
}

.empty-designs .el-icon {
  font-size: 40px;
  margin-bottom: 20px;
}

.three-js-container {
  width: 100%;
  height: 80vh;
  min-height: 400px;
}

@media (max-width: 768px) {
  .three-js-container {
    height: calc(100vh - 120px);
  }
}
</style>