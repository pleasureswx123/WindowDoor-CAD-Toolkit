<template>
  <div class="design-toolbar" :class="{ 'compact-mode': isCompact }">
    <!-- 工具栏折叠控制 -->
    <div class="toolbar-collapse">
      <Icon style="font-size: 10px; color: rgba(255,255,255,.3)" icon="tabler:grip-horizontal" class="collapse-icon" />
      <Icon style="font-size: 10px; color: rgba(255,255,255,.3)" icon="tabler:grip-horizontal" class="collapse-icon" />
      <Icon style="font-size: 10px; color: rgba(255,255,255,.3)" icon="tabler:grip-horizontal" class="collapse-icon" />
      <Icon style="font-size: 10px; color: rgba(255,255,255,.3)" icon="tabler:grip-horizontal" class="collapse-icon" />
    </div>


    <!-- 基础工具组 - 两列布局 -->
    <div class="toolbar-section">

      <div style="width: 100%; display: flex; justify-content: center; align-items: center;">
        <el-tooltip content="选择" placement="right" :disabled="activeTool === 'select'">
          <div class="tool-wrapper">
            <el-button class="tool-button" @click="selectTool('select')" @tap="selectTool('select')"
              :class="{ active: activeTool === 'select', 'active-tool': activeTool === 'select' }">
              <Icon icon="tabler:pointer" class="tool-icon" />
            </el-button>
          </div>
        </el-tooltip>
      </div>
      <div class="tool-column">
        <!-- <el-tooltip content="矩形选框" placement="right">
          <div class="tool-wrapper">
            <el-button class="tool-button" @click="selectTool('rectSelect')" @tap="selectTool('rectSelect')"
              :class="{ active: activeTool === 'rectSelect', 'active-tool': activeTool === 'rectSelect' }">
              <Icon icon="tabler:square-dashed" class="tool-icon" />
            </el-button>
          </div>
        </el-tooltip> -->

        <el-tooltip content="分割工具" placement="right" :disabled="activeTool === 'split'">
          <div class="tool-wrapper" ref="splitToolRef">
            <el-button class="tool-button" @click="selectTool('split')" @tap="selectTool('split')"
              :class="{ active: activeTool === 'split', 'active-tool': activeTool === 'split' }">
              <Icon :icon="getSplitDirectionIcon()" class="tool-icon" />
            </el-button>
            <div class="tool-indicator" v-if="true"></div>
          </div>
        </el-tooltip>

        <el-tooltip content="窗扇工具" placement="right" :disabled="activeTool === 'sash'">
          <div class="tool-wrapper" ref="sashToolRef">
            <el-button class="tool-button" @click="selectTool('sash')" @tap="selectTool('sash')"
              :class="{ active: activeTool === 'sash', 'active-tool': activeTool === 'sash' }">
              <Icon :icon="getSashTypeIcon()" class="tool-icon" />
            </el-button>
            <div class="tool-indicator" v-if="true"></div>
          </div>
        </el-tooltip>

        <!-- <el-tooltip content="旋转" placement="right">
          <div class="tool-wrapper">
            <el-button 
              class="tool-button"
              @click="selectTool('rotate')" 
              @tap="selectTool('rotate')"
              :class="{ active: activeTool === 'rotate', 'active-tool': activeTool === 'rotate' }"
            >
              <Icon icon="tabler:rotate" class="tool-icon" />
            </el-button>
          </div>
        </el-tooltip>

        <el-tooltip content="调整" placement="right">
          <div class="tool-wrapper">
            <el-button 
              class="tool-button"
              @click="selectTool('transform')" 
              @tap="selectTool('transform')"
              :class="{ active: activeTool === 'transform', 'active-tool': activeTool === 'transform' }"
            >
              <Icon icon="tabler:transform" class="tool-icon" />
            </el-button>
          </div>
        </el-tooltip> -->
      </div>
    </div>

    <!-- 分割方向弹出面板 -->
    <div class="tool-popup-panel" v-show="activeTool === 'split' && showPopupMenu"
      :style="getPopupPosition('split', forceRerender)">
      <div class="popup-item" @click="setSplitDirection('vertical')" @tap="setSplitDirection('vertical')"
        :class="{ active: splitDirection === 'vertical' }">
        <Icon icon="tabler:border-vertical" class="popup-item-icon" />
        <span>垂直分割</span>
        <span class="keyboard-shortcut">V</span>
      </div>
      <div class="popup-item" @click="setSplitDirection('horizontal')" @tap="setSplitDirection('horizontal')"
        :class="{ active: splitDirection === 'horizontal' }">
        <Icon icon="tabler:border-horizontal" class="popup-item-icon" />
        <span>水平分割</span>
        <span class="keyboard-shortcut">H</span>
      </div>
    </div>

    <!-- 窗扇类型弹出面板 -->
    <div class="tool-popup-panel sash-panel" v-show="activeTool === 'sash' && showPopupMenu"
      :style="getPopupPosition('sash', forceRerender)">
      <div class="popup-item" @click="setSashType('fixed')" @tap="setSashType('fixed')"
        :class="{ active: sashType === 'fixed' }">
        <Icon icon="tabler:dice" class="popup-item-icon" />
        <span>固定窗</span>
        <span class="keyboard-shortcut">F</span>
      </div>
      <div class="popup-item" @click="setSashType('left')" @tap="setSashType('left')"
        :class="{ active: sashType === 'left' }">
        <Icon icon="tabler:arrow-left" class="popup-item-icon" />
        <span>左开窗</span>
        <span class="keyboard-shortcut">L</span>
      </div>
      <div class="popup-item" @click="setSashType('right')" @tap="setSashType('right')"
        :class="{ active: sashType === 'right' }">
        <Icon icon="tabler:arrow-right" class="popup-item-icon" />
        <span>右开窗</span>
        <span class="keyboard-shortcut">R</span>
      </div>
      <div class="popup-item" @click="setSashType('tiltLeft')" @tap="setSashType('tiltLeft')"
        :class="{ active: sashType === 'tiltLeft' }">
        <Icon icon="tabler:arrow-bar-to-left" class="popup-item-icon" />
        <span>倾斜左开</span>
        <span class="keyboard-shortcut">Q</span>
      </div>
      <div class="popup-item" @click="setSashType('tiltRight')" @tap="setSashType('tiltRight')"
        :class="{ active: sashType === 'tiltRight' }">
        <Icon icon="tabler:arrow-bar-to-right" class="popup-item-icon" />
        <span>倾斜右开</span>
        <span class="keyboard-shortcut">W</span>
      </div>
    </div>

    <!-- 场景控制工具 -->
    <div class="toolbar-section">
      <div class="section-title">场景控制</div>
      <div class="tool-column">
        <el-tooltip content="平移" placement="right" :disabled="activeTool === 'pan'">
          <div class="tool-wrapper">
            <el-button class="tool-button" @click="selectTool('pan')" @tap="selectTool('pan')"
              :class="{ active: activeTool === 'pan', 'active-tool': activeTool === 'pan' }">
              <Icon icon="tabler:hand-move" class="tool-icon" />
            </el-button>
          </div>
        </el-tooltip>

        <el-tooltip content="放大" placement="right" :disabled="activeTool === 'zoomIn'">
          <div class="tool-wrapper">
            <el-button class="tool-button" @click="selectTool('zoomIn')" @tap="selectTool('zoomIn')"
              :class="{ active: activeTool === 'zoomIn', 'active-tool': activeTool === 'zoomIn' }">
              <Icon icon="tabler:zoom-in" class="tool-icon" />
            </el-button>
          </div>
        </el-tooltip>

        <el-tooltip content="缩小" placement="right" :disabled="activeTool === 'zoomOut'">
          <div class="tool-wrapper">
            <el-button class="tool-button" @click="selectTool('zoomOut')" @tap="selectTool('zoomOut')"
              :class="{ active: activeTool === 'zoomOut', 'active-tool': activeTool === 'zoomOut' }">
              <Icon icon="tabler:zoom-out" class="tool-icon" />
            </el-button>
          </div>
        </el-tooltip>

        <el-tooltip content="重置视图" placement="right">
          <div class="tool-wrapper">
            <el-button class="tool-button" @click="resetView" @tap="resetView">
              <Icon icon="tabler:refresh" class="tool-icon" />
            </el-button>
          </div>
        </el-tooltip>
      </div>
    </div>

    <!-- 操作工具 -->
    <div class="toolbar-section">
      <div class="section-title">操作</div>
      <div class="tool-column">
        <el-tooltip content="重置" placement="right">
          <div class="tool-wrapper">
            <el-button class="tool-button" @click="resetWindow" @tap="resetWindow">
              <Icon icon="tabler:trash" class="tool-icon" />
            </el-button>
          </div>
        </el-tooltip>

        <el-tooltip content="导出" placement="right">
          <div class="tool-wrapper">
            <el-button class="tool-button" @click="exportWindow" @tap="exportWindow">
              <Icon icon="tabler:file-export" class="tool-icon" />
            </el-button>
          </div>
        </el-tooltip>

        <el-tooltip content="导入" placement="right">
          <div class="tool-wrapper">
            <el-button class="tool-button" @click="importWindow" @tap="importWindow">
              <Icon icon="tabler:file-import" class="tool-icon" />
            </el-button>
          </div>
        </el-tooltip>

        <el-tooltip content="材料统计" placement="right">
          <div class="tool-wrapper">
            <el-button class="tool-button" @click="showMaterialStats" @tap="showMaterialStats">
              <Icon icon="tabler:table" class="tool-icon" />
            </el-button>
          </div>
        </el-tooltip>

        <el-tooltip content="切换预览" placement="right">
          <div class="tool-wrapper">
            <el-button class="tool-button" @click="togglePreview" @tap="togglePreview">
              <Icon icon="tabler:eye" class="tool-icon" />
            </el-button>
          </div>
        </el-tooltip>
        
        <el-tooltip content="查看快捷键" placement="right">
          <div class="tool-wrapper">
            <el-button class="tool-button" @click="showShortcutsDialog" @tap="showShortcutsDialog">
              <Icon icon="tabler:keyboard" class="tool-icon" />
            </el-button>
          </div>
        </el-tooltip>
      </div>
    </div>

    <!-- 底部颜色/图层面板区域 -->
    <!-- <div class="color-panel">
      <div class="color-box primary-box"></div>
      <div class="color-box secondary-box" style="background-color: #ff3030;"></div>
      <div class="layer-controls">
        <Icon icon="tabler:layers" class="layer-icon" />
        <Icon icon="tabler:layout-2" class="layer-icon" />
      </div>
    </div> -->

    <!-- 导出对话框 -->
    <el-dialog v-model="showExportDialog" title="导出图片" width="500px" destroy-on-close>
      <div class="export-options">
        <div class="export-option">
          <span>格式:</span>
          <el-select v-model="exportFormat" class="export-format-select">
            <el-option label="PNG图片" value="png" />
            <el-option label="JPEG图片" value="jpeg" />
          </el-select>
        </div>
        <div class="export-option" v-if="exportFormat === 'jpeg'">
          <span>质量:</span>
          <el-slider v-model="exportQuality" :min="0.1" :max="1" :step="0.1" :format-tooltip="qualityFormatter" />
        </div>
        <div class="export-option">
          <span>像素比:</span>
          <el-radio-group v-model="exportPixelRatio">
            <el-radio label="1">1x (标准)</el-radio>
            <el-radio label="2">2x (高清)</el-radio>
            <el-radio label="3">3x (超高清)</el-radio>
          </el-radio-group>
        </div>
        <div class="export-option">
          <span>保留背景:</span>
          <el-switch v-model="exportWithBackground" />
        </div>
      </div>

      <div class="export-preview">
        <el-image v-if="exportPreviewUrl" :src="exportPreviewUrl" fit="contain" style="max-height: 250px;" />
        <div v-else class="export-preview-placeholder">
          <Icon icon="tabler:loader-2" class="spin-icon" />
          生成预览图...
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelExport" @tap="cancelExport">取消</el-button>
          <el-button type="primary" @click="confirmExport" @tap="confirmExport">
            导出图片
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 快捷键对话框 -->
    <el-dialog v-model="showShortcuts" title="键盘快捷键" width="700px" custom-class="shortcut-dialog" destroy-on-close>
      <div class="shortcuts-grid">
        <div class="shortcut-section">
          <div class="section-title">基础工具</div>
          <div class="shortcut-list">
            <div class="shortcut-item">
              <div class="key">S</div>
              <div class="desc">选择工具</div>
            </div>
            <div class="shortcut-item">
              <div class="key">X</div>
              <div class="desc">分割工具</div>
            </div>
            <div class="shortcut-item">
              <div class="key">V</div>
              <div class="desc">垂直分割</div>
            </div>
            <div class="shortcut-item">
              <div class="key">H</div>
              <div class="desc">水平分割</div>
            </div>
            <div class="shortcut-item">
              <div class="key">A</div>
              <div class="desc">窗扇工具</div>
            </div>
          </div>
        </div>
        
        <div class="shortcut-section">
          <div class="section-title">窗扇类型</div>
          <div class="shortcut-list">
            <div class="shortcut-item">
              <div class="key">F</div>
              <div class="desc">固定窗</div>
            </div>
            <div class="shortcut-item">
              <div class="key">L</div>
              <div class="desc">左开窗</div>
            </div>
            <div class="shortcut-item">
              <div class="key">R</div>
              <div class="desc">右开窗</div>
            </div>
            <div class="shortcut-item">
              <div class="key">Q</div>
              <div class="desc">倾斜左开</div>
            </div>
            <div class="shortcut-item">
              <div class="key">W</div>
              <div class="desc">倾斜右开</div>
            </div>
          </div>
        </div>
        
        <div class="shortcut-section">
          <div class="section-title">视图控制</div>
          <div class="shortcut-list">
            <div class="shortcut-item">
              <div class="key">P</div>
              <div class="desc">平移工具</div>
            </div>
            <div class="shortcut-item">
              <div class="key">+</div>
              <div class="desc">放大</div>
            </div>
            <div class="shortcut-item">
              <div class="key">-</div>
              <div class="desc">缩小</div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRootWindowStore } from '../../stores/rootWindowStore';
import { Icon } from '@iconify/vue';
import { ArrowDown } from '@element-plus/icons-vue';
import { loadIcon } from '@iconify/vue';

const props = defineProps({
  isCompact: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['toggle-preview', 'show-material-stats']);

const windowStore = useRootWindowStore();

// 从store获取数据
const width = ref(windowStore.windowConfig.width);
const height = ref(windowStore.windowConfig.height);
const frameSize = ref(windowStore.windowConfig.frameSize);
const activeTool = ref<'select' | 'split' | 'sash' | 'pan' | 'zoomIn' | 'zoomOut' | 'rectSelect' | 'rotate' | 'transform'>('select');
const splitDirection = ref('vertical');
const sashType = ref('fixed');

// 导出图片相关状态
const showExportDialog = ref(false);
const exportFormat = ref('png');
const exportQuality = ref(0.9);
const exportPixelRatio = ref('2');
const exportWithBackground = ref(true);
const exportPreviewUrl = ref('');

// 定义DOM引用
const splitToolRef = ref<HTMLElement | null>(null);
const sashToolRef = ref<HTMLElement | null>(null);

// 标记弹出菜单是否显示
const showPopupMenu = ref(false);

// 计算属性监听活动工具变化
watch(activeTool, (newTool) => {
  // 延迟执行确保DOM更新
  setTimeout(() => {
    if (newTool === 'split' || newTool === 'sash') {
      // 强制更新子菜单位置
      forceRerender.value = !forceRerender.value;
    }
  }, 10);
});

// 用于强制重新渲染子菜单的标记
const forceRerender = ref(false);

// 窗扇类型更新后，确保图标立即更新
watch(sashType, (newType) => {
  // 强制重新渲染
  forceRerender.value = !forceRerender.value;
});

// 获取窗扇类型标签
function getSashTypeLabel(): string {
  const typeMap: Record<string, string> = {
    'fixed': '固定窗',
    'left': '左开窗',
    'right': '右开窗',
    'tiltLeft': '倾斜左开',
    'tiltRight': '倾斜右开'
  };
  return typeMap[sashType.value] || '固定窗';
}

// 格式化质量值
function qualityFormatter(val: number): string {
  return `${(val * 100).toFixed(0)}%`;
}

// 更新尺寸
function updateSize() {
  windowStore.updateWindowSize(width.value, height.value);
}

// 更新框架厚度
function updateFrameSize() {
  windowStore.updateFrameSize(frameSize.value);
}

// 选择工具
function selectTool(tool: 'select' | 'split' | 'sash' | 'pan' | 'zoomIn' | 'zoomOut' | 'rectSelect' | 'rotate' | 'transform'): void {
  if (tool === 'select') {
    windowStore.setSelectedElement('');
    windowStore.selectedElement = null;
  }
  // 如果点击的是当前激活的工具，则切换弹出菜单的显示/隐藏状态
  if (activeTool.value === tool && (tool === 'split' || tool === 'sash')) {
    showPopupMenu.value = !showPopupMenu.value;
  } else {
    activeTool.value = tool;
    debugger;
    windowStore.activeTool = tool;
    
    // 如果选择了带有子菜单的工具，则显示弹出菜单
    if (tool === 'split' || tool === 'sash') {
      showPopupMenu.value = true;
    } else {
      showPopupMenu.value = false;
    }
  }
}

// 设置分割方向
function setSplitDirection(direction: string): void {
  splitDirection.value = direction as 'vertical' | 'horizontal';
  windowStore.splitDirection = direction as 'vertical' | 'horizontal';
}

// 设置窗扇类型
function setSashType(type: string): void {
  console.log('设置窗扇类型:', type);
  sashType.value = type as 'fixed' | 'left' | 'right' | 'tiltLeft' | 'tiltRight';
  windowStore.sashType = type as 'fixed' | 'left' | 'right' | 'tiltLeft' | 'tiltRight';
  
  // 更新后关闭弹出菜单
  showPopupMenu.value = false;
}

// 缩放控制
function zoomIn() {
  windowStore.viewState.scale = Math.min(2, windowStore.viewState.scale + 0.1);
}

function zoomOut() {
  windowStore.viewState.scale = Math.max(0.1, windowStore.viewState.scale - 0.1);
}

// 重置窗户
function resetWindow(): void {
  if (confirm('确定要重置窗户设计吗？所有当前设计将丢失。')) {
    width.value = 1000;
    height.value = 2000;
    frameSize.value = 50;
    windowStore.updateWindowSize(width.value, height.value);
    windowStore.updateFrameSize(frameSize.value);
  }
}

// 导出窗户配置
function exportWindowConfig() {
  const config = windowStore.exportWindowConfig();
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'window-config.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 导出图片
function exportWindow(): void {
  showExportDialog.value = true;
  // 请求预览图
  // windowStore.requestExportImage(
  //   Number(exportPixelRatio.value), 
  //   exportFormat.value, 
  //   exportQuality.value,
  //   exportWithBackground.value
  // );
  
  // 使用自定义事件通信，请求WindowCanvas组件导出图片
  window.dispatchEvent(new CustomEvent('export-canvas-image', {
    detail: {
      mimeType: `image/${exportFormat.value}`,
      quality: exportQuality.value,
      pixelRatio: Number(exportPixelRatio.value),
      backgroundColor: exportWithBackground.value ? '#e0e0e0' : undefined
    }
  }));
}

// 确认导出
function confirmExport() {
  if (!exportPreviewUrl.value) {
    return;
  }
  
  // 下载图片
  const a = document.createElement('a');
  a.href = exportPreviewUrl.value;
  a.download = `window-design.${exportFormat.value}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // 关闭对话框
  showExportDialog.value = false;
}

// 取消导出
function cancelExport() {
  showExportDialog.value = false;
  exportPreviewUrl.value = '';
}

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

// 切换预览显示
function togglePreview() {
  emit('toggle-preview');
}

// 展示材料统计
function showMaterialStats() {
  // 触发自定义事件，让父组件显示材料统计
  emit('show-material-stats');
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
  
  // 添加全局点击事件，用于关闭弹出菜单
  document.addEventListener('click', handleDocumentClick);
  
  // 监听窗口调整大小
  window.addEventListener('resize', handleWindowResize);
  
  // 从store初始化状态
  if (windowStore.sashType) {
    sashType.value = windowStore.sashType;
  }
  
  if (windowStore.splitDirection) {
    splitDirection.value = windowStore.splitDirection;
  }

  // 添加键盘快捷键监听
  window.addEventListener('keydown', handleKeydown);
  
  // 预加载常用图标
  const sashIcons = [
    'tabler:window',
    'tabler:arrow-left',
    'tabler:arrow-right', 
    'tabler:arrow-bar-to-left',
    'tabler:arrow-bar-to-right'
  ];
  
  const splitIcons = [
    'tabler:layout-grid',
    'tabler:arrows-horizontal',
    'tabler:arrows-vertical'
  ];
  
  const panIcons = [
    'tabler:hand-move'
  ];
  
  // 预加载所有图标
  [...sashIcons, ...splitIcons, ...panIcons].forEach(icon => {
    loadIcon(icon).catch(err => console.error('图标加载失败:', icon, err));
  });
});

// 在onUnmounted中移除事件监听
onUnmounted(() => {
  window.removeEventListener('canvas-image-ready', () => {});
  window.removeEventListener('canvas-image-error', () => {});
  
  // 移除全局点击事件
  document.removeEventListener('click', handleDocumentClick);
  
  // 移除窗口调整大小事件
  window.removeEventListener('resize', handleWindowResize);
  
  // 移除键盘快捷键监听
  window.removeEventListener('keydown', handleKeydown);
});

// 处理全局点击事件，关闭弹出菜单
function handleDocumentClick(event: MouseEvent) {
  // 如果弹出菜单没有显示，直接返回
  if (!showPopupMenu.value) {
    return;
  }
  
  // 获取实际DOM元素
  const splitTool = splitToolRef.value;
  const sashTool = sashToolRef.value;
  
  // 获取弹出面板元素
  const splitPanel = document.querySelector('.tool-popup-panel[style*="display: block"]');
  const sashPanel = document.querySelector('.tool-popup-panel[style*="display: block"]');
  
  // 检查点击的目标是否在工具按钮或弹出面板内
  const target = event.target as Node;
  const isClickOutside = (
    (!splitTool || !splitTool.contains(target)) &&
    (!sashTool || !sashTool.contains(target)) &&
    (!splitPanel || !splitPanel.contains(target)) &&
    (!sashPanel || !sashPanel.contains(target))
  );
  
  // 如果点击在外部，则隐藏弹出菜单
  if (isClickOutside) {
    showPopupMenu.value = false;
  }
}

// 处理窗口调整大小
function handleWindowResize() {
  // 如果有显示弹出菜单，重新计算位置
  if (showPopupMenu.value) {
    forceRerender.value = !forceRerender.value;
  }
}

// 获取弹出面板位置
function getPopupPosition(tool: string, forceRerender: boolean): Record<string, string> {
  if (tool === 'split' && splitToolRef.value) {
    const rect = splitToolRef.value.getBoundingClientRect();
    return {
      top: `${rect.top}px`,
      left: `${rect.right}px`
    };
  } else if (tool === 'sash' && sashToolRef.value) {
    const rect = sashToolRef.value.getBoundingClientRect();
    return {
      top: `${rect.top}px`,
      left: `${rect.right}px`
    };
  }
  return {};
}

// 获取窗扇工具图标，确保图标加载完成
function getSashTypeIcon(): string {
  if (!sashType.value) return 'tabler:dice';
  
  const iconMap: Record<string, string> = {
    'fixed': 'tabler:dice',
    'left': 'tabler:arrow-left',
    'right': 'tabler:arrow-right',
    'tiltLeft': 'tabler:arrow-bar-to-left',
    'tiltRight': 'tabler:arrow-bar-to-right'
  };
  
  const icon = iconMap[sashType.value];
  console.log('窗扇图标:', sashType.value, '->', icon);
  return icon || 'tabler:dice';
}

// 获取分割方向图标
function getSplitDirectionIcon(): string {
  const iconMap: Record<string, string> = {
    'vertical': 'tabler:border-vertical',
    'horizontal': 'tabler:border-horizontal'
  };
  return iconMap[splitDirection.value] || 'tabler:layout-grid';
}

// 处理键盘快捷键
function handleKeydown(event: KeyboardEvent) {
  // 忽略在输入框中的按键事件
  if (event.target instanceof HTMLInputElement || 
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement) {
    return;
  }

  // 定义快捷键映射
  switch (event.key.toLowerCase()) {
    // 选择工具
    case 's':
      selectTool('select');
      break;
      
    // 分割工具
    case 'x':
      selectTool('split');
      break;
      
    // 垂直分割
    case 'v':
      if (activeTool.value === 'split') {
        setSplitDirection('vertical');
      } else {
        selectTool('split');
        setSplitDirection('vertical');
      }
      break;
      
    // 水平分割
    case 'h':
      if (activeTool.value === 'split') {
        setSplitDirection('horizontal');
      } else {
        selectTool('split');
        setSplitDirection('horizontal');
      }
      break;
      
    // 窗扇工具
    case 'a':
      selectTool('sash');
      break;
      
    // 固定窗
    case 'f':
      if (activeTool.value === 'sash') {
        setSashType('fixed');
      } else {
        selectTool('sash');
        setSashType('fixed');
      }
      break;
      
    // 左开窗
    case 'l':
      if (activeTool.value === 'sash') {
        setSashType('left');
      } else {
        selectTool('sash');
        setSashType('left');
      }
      break;
      
    // 右开窗
    case 'r':
      if (activeTool.value === 'sash') {
        setSashType('right');
      } else {
        selectTool('sash');
        setSashType('right');
      }
      break;
      
    // 倾斜左开
    case 'q':
      if (activeTool.value === 'sash') {
        setSashType('tiltLeft');
      } else {
        selectTool('sash');
        setSashType('tiltLeft');
      }
      break;
      
    // 倾斜右开
    case 'w':
      if (activeTool.value === 'sash') {
        setSashType('tiltRight');
      } else {
        selectTool('sash');
        setSashType('tiltRight');
      }
      break;

    // 平移工具
    case 'p':
      selectTool('pan');
      break;
      
    // 缩放工具
    case '+':
    case '=':
      selectTool('zoomIn');
      break;
      
    case '-':
      selectTool('zoomOut');
      break;
  }
}

// 在script部分，添加以下变量和函数
const showShortcuts = ref(false);

// 显示快捷键对话框
function showShortcutsDialog() {
  showShortcuts.value = true;
}
</script>

<style scoped>
.design-toolbar {
  background-color: #363636;
  width: 70px; /* 增加宽度从56px到70px */
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  color: #e0e0e0;
  padding: 0;
  user-select: none;
  position: relative;
}

.toolbar-collapse {
  height: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  background-color: #2a2a2a;
}

.collapse-icon {
  font-size: 14px;
  opacity: 0.7;
}

.tool-spacer {
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spacer-dots {
  font-size: 6px;
  color: #5a5a5a;
  letter-spacing: -1px;
}

.section-title {
  font-size: 10px;
  color: #999;
  text-align: center;
  padding: 2px 0;
  background-color: #2a2a2a;
}

.toolbar-section {
  margin-bottom: 0;
}

.tool-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
}

.tool-wrapper {
  position: relative;
  width: 34px; /* 从28px增加到34px */
  height: 34px; /* 从28px增加到34px */
  display: flex;
  justify-content: center;
  align-items: center;
}

.tool-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 0 7px 7px;
  border-color: transparent transparent #777 transparent;
}

.tool-button {
  width: 30px; /* 从24px增加到30px */
  height: 30px; /* 从24px增加到30px */
  padding: 5px;
  border: none;
  background-color: transparent;
  border-radius: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.15s;
  margin: 0;
}

.tool-button:hover {
  background-color: #474747;
}

.tool-button.active {
  background-color: #6056DB; /* 更加接近图像中的蓝紫色 */
  color: white;
}

.tool-icon {
  font-size: 18px; /* 从16px增加到18px */
}

/* 弹出面板样式 */
.tool-popup-panel {
  position: fixed;
  left: 70px; /* 调整为新的工具栏宽度 */
  top: 50px;
  background-color: #363636;
  border: 1px solid #222;
  width: 110px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 2000;
}

.popup-header {
  display: flex;
  align-items: center;
  padding: 10px;
  font-size: 14px;
  border-bottom: 1px solid #222;
  background-color: #2a2a2a;
  font-weight: 500;
}

.popup-icon {
  margin-right: 8px;
  font-size: 16px;
}

.popup-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.15s;
  position: relative;
}

.popup-item:hover {
  background-color: #474747;
}

.popup-item.active {
  background-color: #6056DB; /* 更加接近图像中的蓝紫色 */
  color: white;
}

/* 添加选中指示器 */
.popup-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background-color: #ffffff;
}

.popup-item-icon {
  margin-right: 8px;
  font-size: 16px;
}

.keyboard-shortcut {
  margin-left: auto;
  font-size: 12px;
  color: #999;
}

.popup-item.active .keyboard-shortcut {
  color: #ccc;
}

.tool-options {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2px 0;
  background-color: #2a2a2a;
  gap: 2px;
}

.option-button {
  width: 32px;
  height: 32px;
  padding: 4px;
  border: none;
  background-color: transparent;
  border-radius: 0;
  margin: 0;
}

.option-button:hover {
  background-color: #474747;
}

.option-button.active {
  background-color: #4842c5;
  color: white;
}

.option-icon {
  font-size: 16px;
}

/* 底部颜色面板 */
.color-panel {
  margin-top: auto;
  padding: 8px 4px;
  background-color: #2a2a2a;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.color-box {
  width: 32px;
  height: 32px;
  background-color: #ffffff;
  border: 1px solid #777;
}

.secondary-box {
  margin-top: -14px;
  margin-left: 14px;
}

.layer-controls {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.layer-icon {
  font-size: 18px;
  opacity: 0.8;
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

.export-option span {
  width: 90px;
  font-size: 14px;
  color: #e0e0e0;
}

.export-format-select {
  width: 100%;
}

.export-preview {
  margin-bottom: 20px;
  border: 1px solid #444;
  border-radius: 4px;
  overflow: hidden;
  min-height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #333;
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

.spin-icon {
  font-size: 24px;
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .design-toolbar {
    width: 50px;
  }
  
  .tool-wrapper {
    width: 25px;
    height: 25px;
  }
  
  .tool-button {
    width: 22px;
    height: 22px;
  }
  
  .tool-icon {
    font-size: 14px;
  }
}

/* 紧凑模式 */
.compact-mode {
  width: 56px; /* 从46px调整到56px */
}

.compact-mode .tool-wrapper {
  width: 28px; /* 从23px调整到28px */
  height: 28px; /* 从23px调整到28px */
}

.compact-mode .tool-button {
  width: 24px; /* 从20px调整到24px */
  height: 24px; /* 从20px调整到24px */
}

.compact-mode .tool-icon {
  font-size: 16px; /* 从12px调整到16px */
}

.compact-mode .option-button {
  width: 24px;
  height: 24px;
}

.compact-mode .option-icon {
  font-size: 12px;
}

.compact-mode .color-box {
  width: 26px;
  height: 26px;
}

/* 快捷键对话框样式 */
:deep(.shortcut-dialog) {
  border-radius: 4px;
}

:deep(.shortcut-dialog .el-dialog__header) {
  margin: 0;
  padding: 8px 15px;
  background-color: #f7f7f7;
  border-bottom: 1px solid #ebeef5;
}

:deep(.shortcut-dialog .el-dialog__title) {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

:deep(.shortcut-dialog .el-dialog__headerbtn) {
  top: 10px;
  right: 15px;
}

:deep(.shortcut-dialog .el-dialog__body) {
  padding: 0;
  background-color: #fff;
}

.shortcuts-grid {
  display: flex;
  justify-content: space-between;
}

.shortcut-section {
  flex: 1;
  border-right: 1px solid #ebeef5;
}

.shortcut-section:last-child {
  border-right: none;
}

.shortcut-section .section-title {
  padding: 8px 10px;
  font-weight: 600;
  font-size: 14px;
  color: #fff;
  background-color: #303133;
  text-align: center;
}

.shortcut-list {
  padding: 0;
}

.shortcut-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid #ebeef5;
}

.shortcut-item:last-child {
  border-bottom: none;
}

.shortcut-item .key {
  background-color: #6056DB;
  color: white;
  font-weight: 600;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  margin-right: 10px;
}

.shortcut-item .desc {
  color: #606266;
  font-size: 14px;
}
</style>