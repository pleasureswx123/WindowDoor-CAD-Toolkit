<template>
  <div class="design-toolbar">
    <div class="toolbar-section">
      <h3>工具</h3>
      <div class="tool-buttons">
        <button @click="selectTool('select')" :class="{ active: activeTool === 'select' }">
          选择
        </button>
        <button @click="selectTool('split')" :class="{ active: activeTool === 'split' }">
          分割
        </button>
        <button @click="selectTool('sash')" :class="{ active: activeTool === 'sash' }">
          窗扇
        </button>
      </div>
    </div>

    <div class="toolbar-section" v-if="activeTool === 'split'">
      <h3>分割方向</h3>
      <div class="direction-buttons">
        <button @click="setSplitDirection('vertical')" :class="{ active: splitDirection === 'vertical' }">
          垂直分割
        </button>
        <button @click="setSplitDirection('horizontal')" :class="{ active: splitDirection === 'horizontal' }">
          水平分割
        </button>
      </div>
    </div>

    <div class="toolbar-section" v-if="activeTool === 'sash'">
      <h3>窗扇类型</h3>
      <div class="sash-buttons">
        <button @click="setSashType('fixed')" :class="{ active: sashType === 'fixed' }">
          固定窗
        </button>
        <button @click="setSashType('left')" :class="{ active: sashType === 'left' }">
          左开
        </button>
        <button @click="setSashType('right')" :class="{ active: sashType === 'right' }">
          右开
        </button>
        <button @click="setSashType('tiltLeft')" :class="{ active: sashType === 'tiltLeft' }">
          倾斜左开
        </button>
        <button @click="setSashType('tiltRight')" :class="{ active: sashType === 'tiltRight' }">
          倾斜右开
        </button>
      </div>
    </div>

    <!-- 场景控制工具 -->
    <div class="toolbar-section">
      <h3>场景控制</h3>
      <div class="tool-buttons">
        <button @click="selectTool('pan')" :class="{ active: activeTool === 'pan' }">
          <span class="tool-icon">↔</span> 平移
        </button>
        <button @click="selectTool('zoomIn')" :class="{ active: activeTool === 'zoomIn' }">
          <span class="tool-icon">+</span> 放大
        </button>
        <button @click="selectTool('zoomOut')" :class="{ active: activeTool === 'zoomOut' }">
          <span class="tool-icon">-</span> 缩小
        </button>
        <button @click="resetView">
          <span class="tool-icon">⟳</span> 重置视图
        </button>
      </div>
    </div>

    <div class="toolbar-section">
      <h3>操作</h3>
      <div class="action-buttons">
        <button @click="resetWindow">重置</button>
        <el-dropdown>
          <el-button type="primary" class="export-button">
            导出<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="exportWindowImage">导出图片</el-dropdown-item>
              <el-dropdown-item @click="exportWindowConfig">导出配置</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <button @click="importWindow">导入</button>
      </div>
      
      <!-- 导出图片弹出层 -->
      <el-dialog
        v-model="showExportDialog"
        title="导出图片"
        width="500px"
        center
        destroy-on-close
      >
        <div class="export-options">
          <div class="export-option">
            <label>格式:</label>
            <el-select v-model="exportFormat" class="export-format-select">
              <el-option value="png" label="PNG (透明背景)" />
              <el-option value="jpeg" label="JPEG (高压缩率)" />
              <el-option value="webp" label="WebP (最佳质量/大小比)" />
            </el-select>
          </div>
          <div class="export-option">
            <label>质量:</label>
            <el-slider 
              v-model="exportQuality" 
              :min="0.1" 
              :max="1" 
              :step="0.1" 
              show-tooltip
              :format-tooltip="(value: number) => `${Math.round(value * 100)}%`"
            />
          </div>
          <div class="export-option">
            <label>像素比例:</label>
            <el-radio-group v-model="exportPixelRatio">
              <el-radio label="1">1x (标准)</el-radio>
              <el-radio label="2">2x (高清)</el-radio>
              <el-radio label="3">3x (超高清)</el-radio>
            </el-radio-group>
          </div>
          <div class="export-option">
            <label>保留背景:</label>
            <el-switch v-model="exportWithBackground" />
          </div>
        </div>
        
        <div class="export-preview">
          <el-image 
            v-if="exportPreviewUrl" 
            :src="exportPreviewUrl"
            fit="contain"
            style="max-height: 250px;"
          />
          <div v-else class="export-preview-placeholder">
            生成预览图...
          </div>
        </div>
        
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="cancelExport">取消</el-button>
            <el-button type="primary" @click="confirmExport">
              导出图片
            </el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRootWindowStore } from '../../stores/rootWindowStore';
import { 
  ElDropdown, 
  ElDropdownMenu, 
  ElDropdownItem, 
  ElButton,
  ElDialog,
  ElSelect,
  ElOption,
  ElImage,
  ElSlider,
  ElRadioGroup,
  ElRadio,
  ElSwitch,
  ElIcon 
} from 'element-plus';
import { 
  ArrowDown 
} from '@element-plus/icons-vue';

const windowStore = useRootWindowStore();

// 从store获取数据
const width = ref(windowStore.windowConfig.width);
const height = ref(windowStore.windowConfig.height);
const frameSize = ref(windowStore.windowConfig.frameSize);
const activeTool = ref('select');
const splitDirection = ref('vertical');
const sashType = ref('fixed');

// 导出图片相关状态
const showExportDialog = ref(false);
const exportFormat = ref('png');
const exportQuality = ref(0.9);
const exportPixelRatio = ref('2');
const exportWithBackground = ref(true);
const exportPreviewUrl = ref('');

// 更新尺寸
function updateSize() {
  windowStore.updateWindowSize(width.value, height.value);
}

// 更新框架厚度
function updateFrameSize() {
  windowStore.updateFrameSize(frameSize.value);
}

// 选择工具
function selectTool(tool: 'select' | 'split' | 'sash' | 'pan' | 'zoomIn' | 'zoomOut') {
  if(tool === 'select') {
    windowStore.selectedElement = null;
  }
  activeTool.value = tool;
  windowStore.activeTool = tool;
}

// 设置分割方向
function setSplitDirection(direction: 'horizontal' | 'vertical') {
  splitDirection.value = direction;
  windowStore.splitDirection = direction;
}

// 设置窗扇类型
function setSashType(type: 'fixed' | 'left' | 'right' | 'tiltLeft' | 'tiltRight') {
  sashType.value = type;
  windowStore.sashType = type;
}

// 重置窗户
function resetWindow() {
  width.value = 1000;
  height.value = 2000;
  frameSize.value = 50;
  windowStore.updateWindowSize(width.value, height.value);
  windowStore.updateFrameSize(frameSize.value);
}

// 导出窗户配置
function exportWindowConfig() {
  const config = windowStore.exportWindowConfig();
  if (config) {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'window-config.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
}

// 导出窗户图片
function exportWindowImage() {
  showExportDialog.value = true;
  // 生成预览图
  generateExportPreview();
}

// 生成导出预览图
function generateExportPreview() {
  try {
    // 使用自定义事件通信，请求WindowCanvas组件导出图片
    window.dispatchEvent(new CustomEvent('export-canvas-image', {
      detail: {
        mimeType: `image/${exportFormat.value}`,
        quality: exportQuality.value,
        pixelRatio: Number(exportPixelRatio.value),
        backgroundColor: exportWithBackground.value ? '#e0e0e0' : undefined
      }
    }));
  } catch (error) {
    console.error('请求导出图片失败:', error);
  }
}

// 取消导出
function cancelExport() {
  showExportDialog.value = false;
  exportPreviewUrl.value = '';
}

// 确认导出图片
function confirmExport() {
  if (!exportPreviewUrl.value) {
    generateExportPreview();
    
    // 如果仍然没有预览图，则返回
    if (!exportPreviewUrl.value) {
      alert('导出失败，请重试');
      return;
    }
  }
  
  // 创建下载链接
  const link = document.createElement('a');
  link.download = `窗户设计_${new Date().getTime()}.${exportFormat.value}`;
  link.href = exportPreviewUrl.value;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 关闭导出对话框
  showExportDialog.value = false;
}

// 修改导出参数时重新生成预览
function updateExportPreview() {
  if (showExportDialog.value) {
    generateExportPreview();
  }
}

// 监听导出参数变化
watch([exportFormat, exportQuality, exportPixelRatio, exportWithBackground], () => {
  updateExportPreview();
});

// 导入窗户配置
function importWindow() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          windowStore.importWindowConfig(config);
        } catch (error) {
          console.error('导入配置失败:', error);
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

// 重置视图
function resetView() {
  // 重置视图
  windowStore.viewState.resetRequested = true;
}

// 在onMounted中添加事件监听
onMounted(() => {
  // 监听WindowCanvas组件返回的图片数据
  window.addEventListener('canvas-image-ready', (e: any) => {
    if (e.detail && e.detail.dataURL) {
      exportPreviewUrl.value = e.detail.dataURL;
    }
  });
  
  // 监听导出图片错误
  window.addEventListener('canvas-image-error', (e: any) => {
    console.error('导出图片失败:', e.detail?.error);
    alert(`导出图片失败: ${e.detail?.error || '未知错误'}`);
  });
});

// 在onUnmounted中移除事件监听
onUnmounted(() => {
  window.removeEventListener('canvas-image-ready', () => {});
  window.removeEventListener('canvas-image-error', () => {});
});
</script>

<style scoped>
.design-toolbar {
  padding: 15px;
  background: #f5f5f5;
  border-right: 1px solid #ddd;
  width: 250px;
  height: 100%;
  overflow-y: auto;
}

.toolbar-section {
  margin-bottom: 20px;
}

h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  color: #333;
}

.input-group {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.input-group label {
  width: 80px;
  font-size: 14px;
}

.input-group input {
  width: 100px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.tool-buttons,
.direction-buttons,
.sash-buttons,
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

button {
  padding: 8px 12px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

button:hover {
  background: #f0f0f0;
}

button.active {
  background: #4a6bff;
  color: white;
  border-color: #3351d8;
}

/* 导出对话框样式 */
.export-options {
  margin-bottom: 20px;
}

.export-option {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
}

.export-option label {
  width: 90px;
  font-size: 14px;
  color: #555;
}

.export-format-select {
  width: 100%;
}

.export-preview {
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  min-height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}

.export-preview-placeholder {
  padding: 30px;
  color: #999;
  font-size: 14px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.export-preview-placeholder .el-icon {
  font-size: 24px;
  color: #4285f4;
}

/* Element Plus 样式覆盖 */
.export-button {
  margin: 0 8px; /* 保持与其他按钮一致的间距 */
}

/* 确保下拉菜单样式与应用整体风格一致 */
:deep(.el-dropdown-menu) {
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.el-dropdown-item) {
  font-size: 14px;
  padding: 8px 12px;
}

:deep(.el-dialog) {
  border-radius: 8px;
}

:deep(.el-radio) {
  margin-right: 15px;
}
</style>