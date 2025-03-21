<template>
  <div class="design-toolbar">
    <div class="toolbar-section">
      <h3>窗户尺寸</h3>
      <div class="input-group">
        <label>宽度:</label>
        <input type="number" v-model.number="width" @change="updateSize" min="300" max="5000" />
      </div>
      <div class="input-group">
        <label>高度:</label>
        <input type="number" v-model.number="height" @change="updateSize" min="300" max="5000" />
      </div>
      <div class="input-group">
        <label>框架厚度:</label>
        <input type="number" v-model.number="frameSize" @change="updateFrameSize" min="20" max="200" />
      </div>
    </div>

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

    <div class="toolbar-section">
      <h3>操作</h3>
      <div class="action-buttons">
        <button @click="resetWindow">重置</button>
        <button @click="exportWindow">导出</button>
        <button @click="importWindow">导入</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRootWindowStore } from '../../stores/rootWindowStore';

const windowStore = useRootWindowStore();

// 从store获取数据
const width = ref(windowStore.windowConfig.width);
const height = ref(windowStore.windowConfig.height);
const frameSize = ref(windowStore.windowConfig.frameSize);
const activeTool = computed(() => windowStore.activeTool);
const splitDirection = computed(() => windowStore.splitDirection);
const sashType = computed(() => windowStore.sashType);

// 更新尺寸
function updateSize() {
  windowStore.updateWindowSize(width.value, height.value);
}

// 更新框架厚度
function updateFrameSize() {
  windowStore.updateFrameSize(frameSize.value);
}

// 选择工具
function selectTool(tool: 'select' | 'split' | 'sash') {
  if(tool === 'select') {
    windowStore.selectedElement = null;
  }
  windowStore.activeTool = tool;
}

// 设置分割方向
function setSplitDirection(direction: 'horizontal' | 'vertical') {
  windowStore.splitDirection = direction;
}

// 设置窗扇类型
function setSashType(type: 'fixed' | 'left' | 'right' | 'tiltLeft' | 'tiltRight') {
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
function exportWindow() {
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
</style>