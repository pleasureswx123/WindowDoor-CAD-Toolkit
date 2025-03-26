<template>
  <div class="window-base-properties">
    <!-- 窗户基础属性 -->
    <h3><Icon icon="tabler:window" class="section-icon" /> 窗户基础属性</h3>
    <div class="setting-group">
      <label><Icon icon="tabler:ruler-2" class="setting-icon" /> 窗户宽度 (mm):</label>
      <input type="number" v-model.number="width" @change="updateWindowSize" min="300" max="5000" />
    </div>
    <div class="setting-group">
      <label><Icon icon="tabler:ruler-2" class="setting-icon" /> 窗户高度 (mm):</label>
      <input type="number" v-model.number="height" @change="updateWindowSize" min="300" max="5000" />
    </div>
    <div class="setting-group">
      <label><Icon icon="tabler:border-all" class="setting-icon" /> 框架厚度 (mm):</label>
      <input type="number" v-model.number="frameSize" min="20" max="200" />
    </div>
    <!-- 窗扇框架宽度设置 -->
    <div class="setting-group">
      <label><Icon icon="tabler:border-inner" class="setting-icon" /> 窗扇框架宽度 (mm):</label>
      <input type="number" v-model.number="sashFrameThickness" min="20" max="100" step="2" />
    </div>
    <!-- 中挺宽度设置 -->
    <div class="setting-group">
      <label><Icon icon="tabler:layout-grid" class="setting-icon" /> 中挺宽度 (mm):</label>
      <input type="number" v-model.number="defaultMuntinThickness" min="20" max="100" step="2" />
    </div>
    
    <!-- 全局默认配置 -->
    <div class="global-settings">
      <h4><Icon icon="tabler:settings" class="section-icon" /> 全局默认配置</h4>
      <p class="setting-desc">设置下列项目后，新创建的元素将使用这些默认值</p>
      
      <!-- 默认颜色配置 -->
      <div class="setting-section">
        <h5><Icon icon="tabler:border-outer" class="setting-icon" /> 窗框配置</h5>
        <div class="setting-group">
          <label><Icon icon="tabler:color-swatch" class="setting-icon" /> 窗框颜色:</label>
          <el-color-picker v-model="defaultConfigValue.frameColor" show-alpha />
        </div>
        <div class="setting-group">
          <label><Icon icon="tabler:border-style" class="setting-icon" /> 窗框边线颜色:</label>
          <el-color-picker v-model="defaultConfigValue.frameStrokeColor" show-alpha />
        </div>
        <div class="setting-group">
          <label><Icon icon="tabler:line-height" class="setting-icon" /> 窗框边线宽度 (px):</label>
          <input type="number" v-model.number="defaultConfigValue.frameStrokeWidth" min="0" max="5" step="0.5" />
        </div>
      </div>
      
      <div class="setting-section">
        <h5><Icon icon="tabler:layout-grid" class="setting-icon" /> 中挺配置</h5>
        <div class="setting-group">
          <label><Icon icon="tabler:color-swatch" class="setting-icon" /> 中挺颜色:</label>
          <el-color-picker v-model="defaultConfigValue.muntinColor" show-alpha />
        </div>
      </div>
      
      <div class="setting-section">
        <h5><Icon icon="tabler:layout-board" class="setting-icon" /> 窗扇配置</h5>
        <div class="setting-group">
          <label><Icon icon="tabler:color-swatch" class="setting-icon" /> 窗扇颜色:</label>
          <el-color-picker v-model="defaultConfigValue.sashColor" show-alpha />
        </div>
        <div class="setting-group">
          <label><Icon icon="tabler:border-style" class="setting-icon" /> 窗扇边线颜色:</label>
          <el-color-picker v-model="defaultConfigValue.sashStrokeColor" show-alpha />
        </div>
        <div class="setting-group">
          <label><Icon icon="tabler:line-height" class="setting-icon" /> 窗扇边线宽度 (px):</label>
          <input type="number" v-model.number="defaultConfigValue.sashStrokeWidth" min="0" max="5" step="0.5" />
        </div>
      </div>
      
      <div class="setting-section">
        <h5><Icon icon="tabler:glass" class="setting-icon" /> 玻璃配置</h5>
        <div class="setting-group">
          <label><Icon icon="tabler:color-swatch" class="setting-icon" /> 玻璃颜色:</label>
          <el-color-picker v-model="defaultConfigValue.glassColor" show-alpha />
        </div>
        <div class="setting-group">
          <label><Icon icon="tabler:opacity" class="setting-icon" /> 玻璃透明度: {{ (defaultConfigValue.glassOpacity * 100).toFixed(0) }}%</label>
          <input type="range" v-model.number="defaultConfigValue.glassOpacity" min="0" max="1" step="0.05" class="slider" />
          <div class="opacity-hint">
            <span>不透明</span>
            <span>透明</span>
          </div>
        </div>
      </div>
      
      <!-- 应用默认配置按钮 -->
      <div class="setting-actions">
        <button class="apply-all-button" @click="applyToAllElements">
          <Icon icon="tabler:wand" /> 应用到所有元素
        </button>
      </div>
    </div>
    
    <!-- 提示信息 -->
    <div class="setting-tips">
      <p><Icon icon="tabler:info-circle" /> 提示: 调整窗户尺寸将重新绘制整个窗户</p>
      <p><Icon icon="tabler:info-circle" /> 全局默认配置将影响新创建的元素</p>
      <p><Icon icon="tabler:info-circle" /> 点击"应用到所有元素"可将当前配置应用到所有现有元素</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useRootWindowStore } from '@/stores/rootWindowStore';
import { defaultConfigValue } from '@/utils/RootWindow';
import { Icon } from '@iconify/vue';

const windowStore = useRootWindowStore();

// 监听defaultConfigValue变化
watch(defaultConfigValue, (newVal) => {
  console.log('defaultConfig updated', newVal);
  const { 
    frameColor, 
    frameStrokeColor, 
    frameStrokeWidth, 
    glassColor, 
    glassOpacity, 
    sashFrameThickness: localSashFrameThickness, 
    defaultMuntinThickness: localDefaultMuntinThickness 
  } = newVal;
  
  nextTick(() => {
    // 更新窗框颜色
    windowStore.windowStructure?.frame?.updateColor(frameColor, frameStrokeColor, frameStrokeWidth);
  });
}, { deep: true });

// 窗户尺寸设置
const width = computed({
  get: () => windowStore.windowConfig.width,
  set: (value) => {
    windowStore.windowConfig.width = value;
  }
});

const height = computed({
  get: () => windowStore.windowConfig.height,
  set: (value) => {
    windowStore.windowConfig.height = value;
  }
});

// 窗扇框架宽度设置
const sashFrameThickness = computed({
  get: () => {
    return defaultConfigValue.sashFrameThickness;
  },
  set: (value) => {
    defaultConfigValue.sashFrameThickness = value;
  }
});

// 中挺宽度设置
const defaultMuntinThickness = computed({
  get: () => {
    return defaultConfigValue.defaultMuntinThickness;
  },
  set: (value) => {
    defaultConfigValue.defaultMuntinThickness = value;
  }
});

// 窗框大小设置
const frameSize = computed({
  get: () => {
    return windowStore.windowConfig.frameSize;
  },
  set: (value) => {
    windowStore.updateFrameSize(value);
  }
});

// 更新窗户尺寸
function updateWindowSize() {
  windowStore.updateWindowSize(width.value, height.value);
}

// 应用到所有元素
function applyToAllElements() {
  if (windowStore.windowStructure) {
    windowStore.windowStructure.applyDefaultConfigToAll();
  }
}
</script>

<style scoped>
.window-base-properties {
  width: 100%;
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #e0e0e0;
  border-bottom: 1px solid #3e3e3e;
  padding-bottom: 8px;
  display: flex;
  align-items: center;
}

.section-icon {
  margin-right: 8px;
  color: #4a6bff;
}

.setting-icon {
  font-size: 16px;
  margin-right: 4px;
  opacity: 0.8;
}

.setting-group {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
}

.setting-group label {
  font-size: 14px;
  margin-bottom: 4px;
  color: #b0b0b0;
  display: flex;
  align-items: center;
}

.setting-group input {
  padding: 8px;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 14px;
  background-color: #333;
  color: #e0e0e0;
}

.setting-group input:focus {
  border-color: #4a6bff;
  outline: none;
}

.setting-actions {
  margin-top: 20px;
}

button {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #444;
  background-color: #333;
  color: #e0e0e0;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

button:hover {
  background-color: #444;
}

.apply-all-button {
  background-color: #ff6b4a;
  color: white;
  border-color: #d13535;
  width: 100%;
}

.apply-all-button:hover {
  background-color: #d13535;
}

.setting-tips {
  margin-top: 20px;
  padding: 10px;
  background-color: #2a2a2a;
  border-radius: 4px;
  font-size: 12px;
  color: #b0b0b0;
}

.setting-tips p {
  margin: 5px 0;
}

.global-settings {
  margin-top: 20px;
  margin-bottom: 20px;
  border-top: 1px dashed #444;
  padding-top: 15px;
}

.global-settings h4 {
  margin-top: 5px;
  margin-bottom: 10px;
  font-size: 15px;
  color: #4a6bff;
}

.setting-desc {
  margin-bottom: 15px;
  font-size: 13px;
  color: #666;
  font-style: italic;
}

.setting-section {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #2a2a2a;
  border-radius: 4px;
  border-left: 3px solid #4a6bff;
}

.setting-section h5 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #e0e0e0;
  border-bottom: 1px solid #444;
  padding-bottom: 5px;
}

.color-picker-container {
  display: flex;
  align-items: center;
}

.color-input {
  border: 1px solid #555;
  border-radius: 4px;
  margin-right: 8px;
  background-color: #333;
}

.color-text {
  padding: 8px;
  border: 1px solid #555;
  border-radius: 4px;
  background-color: #333;
  color: #e0e0e0;
}

.slider {
  width: 100%;
}

.opacity-hint {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #b0b0b0;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .window-base-properties {
    padding: 10px;
  }
  
  h3 {
    font-size: 14px;
  }
  
  .setting-group label {
    font-size: 12px;
  }
  
  .setting-group input {
    padding: 6px;
    font-size: 12px;
    border: 1px solid #555;
  }
  
  button {
    padding: 6px 10px;
    font-size: 12px;
  }
}
</style> 