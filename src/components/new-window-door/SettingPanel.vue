<template>
  <div class="setting-panel" v-if="hasSelectedElement">
    <!-- 中挺设置面板 -->
    <div v-if="isMuntinSelected" class="muntin-settings">
      <h3>中挺设置</h3>

      <!-- 中挺方向 (只读) -->
      <div class="setting-group">
        <label>中挺方向:</label>
        <span>{{ muntinDirection === 'horizontal' ? '水平' : '垂直' }}</span>
      </div>

      <!-- 中挺厚度设置 -->
      <div class="setting-group">
        <label>厚度 (mm):</label>
        <input type="number" v-model.number="muntinThickness" min="20" max="100" step="2" />
      </div>

      <!-- 中挺位置设置 -->
      <div class="setting-group" v-if="muntinDirection === 'horizontal'">
        <label>上边距 (mm):</label>
        <input type="number" v-model.number="muntinPosition" :min="minPosition" :max="maxPosition" step="5" />
      </div>

      <div class="setting-group" v-if="muntinDirection === 'vertical'">
        <label>左边距 (mm):</label>
        <input type="number" v-model.number="muntinPosition" :min="minPosition" :max="maxPosition" step="5" />
      </div>

      <!-- 删除中挺按钮 -->
      <div class="setting-actions">
        <button class="delete-button" @click="deleteMuntin">
          删除中挺
        </button>
      </div>

      <!-- 提示信息 -->
      <div class="setting-tips">
        <p>提示: 水平中挺只能上下移动，垂直中挺只能左右移动</p>
        <p>有效范围: {{ minPosition }}mm - {{ maxPosition }}mm</p>
      </div>
    </div>

    <!-- 窗扇设置面板 -->
    <div v-if="isSashSelected" class="sash-settings">
      <h3>窗扇设置</h3>

      <!-- 窗扇类型选择 'fixed' | 'left' | 'right' | 'tiltLeft' | 'tiltRight'; -->
      <div class="setting-group">
        <label>窗扇类型:</label>
        <select v-model="sashType" class="select-input">
          <option value="fixed">固定窗</option>
          <option value="left">左开窗</option>
          <option value="right">右开窗</option>
          <option value="tiltLeft">倾斜左开</option>
          <option value="tiltRight">倾斜右开</option>
        </select>
      </div>

      <!-- 窗扇整体尺寸（只读） -->
      <div class="setting-group">
        <label>窗扇整体尺寸:</label>
        <div class="size-display">
          <div class="size-item">
            <span>宽度: {{ sashWidth }}mm</span>
          </div>
          <div class="size-item">
            <span>高度: {{ sashHeight }}mm</span>
          </div>
        </div>
      </div>

      <!-- 窗框大小设置（可编辑） -->
      <div class="setting-group">
        <label>窗框大小 (mm):</label>
        <input type="number" v-model.number="frameSize" min="20" max="100" step="2" />
      </div>

      <!-- 窗扇颜色设置 -->
      <div class="setting-group">
        <label>窗扇颜色:</label>
        <div class="color-picker-container">
          <input type="color" v-model="sashColor" class="color-input" />
          <input type="text" v-model="sashColor" class="color-text" placeholder="#颜色代码" />
        </div>
      </div>

      <!-- 窗扇边线颜色设置 -->
      <div class="setting-group">
        <label>边线颜色:</label>
        <div class="color-picker-container">
          <input type="color" v-model="sashStrokeColor" class="color-input" />
          <input type="text" v-model="sashStrokeColor" class="color-text" placeholder="#颜色代码" />
        </div>
      </div>
      
      <!-- 窗扇边线宽度设置 -->
      <div class="setting-group">
        <label>边线粗细 (px):</label>
        <input type="number" v-model.number="sashStrokeWidth" min="0" max="5" step="0.5" />
      </div>

      <!-- 玻璃尺寸（只读） -->
      <div class="setting-group">
        <label>玻璃尺寸:</label>
        <div class="size-display">
          <div class="size-item">
            <span>宽度: {{ glassWidth }}mm</span>
          </div>
          <div class="size-item">
            <span>高度: {{ glassHeight }}mm</span>
          </div>
        </div>
      </div>
      
      <!-- 玻璃颜色设置 -->
      <div class="setting-group">
        <label>玻璃颜色:</label>
        <div class="color-picker-container">
          <input type="color" v-model="glassColor" class="color-input" />
          <input type="text" v-model="glassColor" class="color-text" placeholder="#颜色代码" />
        </div>
      </div>
      
      <!-- 玻璃透明度设置 -->
      <div class="setting-group">
        <label>透明度: {{ (glassOpacity * 100).toFixed(0) }}%</label>
        <input type="range" v-model.number="glassOpacity" min="0" max="1" step="0.05" class="slider" />
        <div class="opacity-hint">
          <span>不透明</span>
          <span>透明</span>
        </div>
      </div>

      <!-- 删除窗扇按钮 -->
      <div class="setting-actions">
        <button class="delete-button" @click="deleteSash">
          删除窗扇
        </button>
      </div>

      <!-- 提示信息 -->
      <div class="setting-tips">
        <p>提示: 调整窗框大小会自动更新玻璃尺寸</p>
        <p>更改窗扇类型会影响窗扇的外观和功能</p>
        <p>可以自定义窗扇颜色和玻璃透明度以获得不同视觉效果</p>
      </div>
    </div>

    <!-- 空白区域设置面板 -->
    <div v-else-if="isEmptyAreaSelected" class="empty-area-settings">
      <h3>空白区域设置</h3>
      
      <!-- 空白区域尺寸（只读） -->
      <div class="setting-group">
        <label>区域尺寸:</label>
        <div class="size-display">
          <div class="size-item">
            <span>宽度: {{ emptyAreaWidth }}mm</span>
          </div>
          <div class="size-item">
            <span>高度: {{ emptyAreaHeight }}mm</span>
          </div>
        </div>
      </div>
      
      <!-- 空白区域可分割 -->
      <div class="setting-group">
        <label>区域分割:</label>
        <div class="split-buttons">
          <button 
            class="split-button" 
            :class="{ active: splitDirection === 'vertical' }"
            @click="splitDirection = 'vertical'"
          >
            垂直分割
          </button>
          <button 
            class="split-button" 
            :class="{ active: splitDirection === 'horizontal' }"
            @click="splitDirection = 'horizontal'"
          >
            水平分割
          </button>
        </div>
      </div>
      
      <!-- 中挺厚度设置 -->
      <div class="setting-group" v-if="splitDirection">
        <label>中挺厚度 (mm):</label>
        <input type="number" v-model.number="splitThickness" min="20" max="100" step="2" />
      </div>
      
      <!-- 确认分割按钮 -->
      <div class="setting-actions" v-if="splitDirection">
        <button class="split-confirm-button" @click="confirmSplit">
          确认分割
        </button>
      </div>
      
      <!-- 分割线 -->
      <div class="separator" v-if="splitDirection"></div>
      
      <!-- 窗扇类型选择 -->
      <div class="setting-group">
        <label>安装窗扇类型:</label>
        <select v-model="selectedSashType" class="select-input">
          <option value="fixed">固定窗</option>
          <option value="left">左开窗</option>
          <option value="right">右开窗</option>
          <option value="tiltLeft">倾斜左开</option>
          <option value="tiltRight">倾斜右开</option>
        </select>
      </div>
      
      <!-- 安装窗扇按钮 -->
      <div class="setting-actions">
        <button class="install-button" @click="installSash">
          安装窗扇
        </button>
      </div>
      
      <!-- 提示信息 -->
      <div class="setting-tips">
        <p>提示: 安装窗扇后，此区域将不能再进行分割</p>
        <p>分割区域后，将创建中挺和两个新的空白区域</p>
      </div>
    </div>

    <!-- 其他元素设置面板可以在这里添加 -->
    <div v-else-if="isFrameSelected" class="frame-settings">
      <h3>窗框设置</h3>
      
      <!-- 窗框颜色设置 -->
      <div class="setting-group">
        <label>窗框颜色:</label>
        <div class="color-picker-container">
          <input type="color" v-model="frameColor" class="color-input" />
          <input type="text" v-model="frameColor" class="color-text" placeholder="#颜色代码" />
        </div>
      </div>

      <!-- 窗框边线颜色设置 -->
      <div class="setting-group">
        <label>边线颜色:</label>
        <div class="color-picker-container">
          <input type="color" v-model="frameStrokeColor" class="color-input" />
          <input type="text" v-model="frameStrokeColor" class="color-text" placeholder="#颜色代码" />
        </div>
      </div>
      
      <!-- 窗框边线宽度设置 -->
      <div class="setting-group">
        <label>边线粗细 (px):</label>
        <input type="number" v-model.number="frameStrokeWidth" min="0" max="5" step="0.5" />
      </div>

      <!-- 提示信息 -->
      <div class="setting-tips">
        <p>提示: 修改窗框颜色可以改变整体窗户外观</p>
        <p>默认颜色: #8B4513 (棕色)</p>
      </div>
    </div>
    
    <div v-else>
      <h3>元素设置</h3>
      <p>已选中: {{ selectedElementType }}</p>
      <p>请使用工具栏中的操作进行编辑</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRootWindowStore } from '../../stores/rootWindowStore';
import { WindowMuntin } from '../../utils/RootWindow';
import { useEventListener, onKeyStroke } from '@vueuse/core';

const windowStore = useRootWindowStore();

// 判断是否有选中元素
const hasSelectedElement = computed(() => !!windowStore.selectedElement);

// 判断选中的元素类型
const selectedElementType = computed(() => {
  if (!windowStore.selectedElement) return '无';
  
  // 根据元素类型返回对应的名称
  const elementType = windowStore.selectedElement.ele || '未知元素';
  return elementType;
});

// 判断是否选中了中挺
const isMuntinSelected = computed(() => {
  if (!windowStore.selectedElement) return false;
  return windowStore.selectedElement.ele === 'window-muntin';
});

// 判断是否选中了窗扇
const isSashSelected = computed(() => {
  if (!windowStore.selectedElement) return false;
  return windowStore.selectedElement.ele?.includes('window-sash');
});

// 判断是否选中了空白区域
const isEmptyAreaSelected = computed(() => {
  if (!windowStore.selectedElement) return false;
  return windowStore.selectedElement.ele === 'window-empty-area';
});

// 判断是否选中了窗框
const isFrameSelected = computed(() => {
  if (!windowStore.selectedElement) return false;
  return windowStore.selectedElement.ele === 'window-frame';
});

// 获取中挺方向
const muntinDirection = computed(() => {
  if (!isMuntinSelected.value || !windowStore.selectedElement) return 'vertical';
  return windowStore.selectedElement.direction;
});

// 中挺厚度
const muntinThickness = computed({
  get: () => {
    if (!isMuntinSelected.value || !windowStore.selectedElement) return 40;
    return windowStore.selectedElement.thickness || 40;
  },
  set: (value) => {
    if (!isMuntinSelected.value || !windowStore.selectedElement) return;
    
    // 确保厚度在有效范围内
    const validThickness = Math.max(20, Math.min(100, value));
    
    // 更新中挺厚度
    windowStore.selectedElement.thickness = validThickness;
    
    // 需要重新渲染
    if (windowStore.selectedElement.parent && windowStore.selectedElement.parent.splitArea) {
      // 获取当前中挺位置
      const position = muntinDirection.value === 'horizontal' 
        ? { x: 0, y: muntinPosition.value + validThickness / 2 } 
        : { x: muntinPosition.value + validThickness / 2, y: 0 };
        
      // 调用父元素的splitArea方法更新分割
      nextTick(() => {
        windowStore.selectedElement.parent.splitArea(
          muntinDirection.value, 
          position, 
          validThickness // 传入新的厚度
        );
      });
    }
  }
});

// 中挺位置
const muntinPosition = computed({
  get: () => {
    if (!isMuntinSelected.value || !windowStore.selectedElement) return 0;
    const a = windowStore.selectedElement;
    // 根据方向返回对应的位置
    if (muntinDirection.value === 'horizontal') {
      return windowStore.selectedElement.y || 0;
    } else {
      return windowStore.selectedElement.x || 0;
    }
  },
  set: (value) => {
    if (!isMuntinSelected.value || !windowStore.selectedElement) return;
    
    // 确保位置在有效范围内
    const validPosition = Math.max(minPosition.value, Math.min(maxPosition.value, value));
    
    // 根据中挺方向更新位置
    if (muntinDirection.value === 'horizontal') {
      windowStore.selectedElement.y = validPosition;
    } else {
      windowStore.selectedElement.x = validPosition;
    }
    
    // 调用父元素的splitArea方法更新分割
    if (windowStore.selectedElement.parent && windowStore.selectedElement.parent.splitArea) {
      const position = muntinDirection.value === 'horizontal' 
        ? { x: 0, y: validPosition + muntinThickness.value / 2 } 
        : { x: validPosition + muntinThickness.value / 2, y: 0 };

      nextTick(() => {
        windowStore.selectedElement.parent.splitArea(
          muntinDirection.value, 
          position, 
          muntinThickness.value
        );
      });
    }
  }
});

// 计算中挺位置的最小值 (1.5倍中挺厚度)
const minPosition = computed(() => {
  return Math.ceil(muntinThickness.value * 1.5);
});

// 计算中挺位置的最大值 (父元素尺寸减去安全距离)
const maxPosition = computed(() => {
  if (!isMuntinSelected.value || !windowStore.selectedElement) return 1000;
  
  const parent = windowStore.selectedElement.parent;
  if (!parent) return 1000;
  
  // 根据中挺方向返回相应的最大值
  if (muntinDirection.value === 'horizontal') {
    return parent.height - minPosition.value;
  } else {
    return parent.width - minPosition.value;
  }
});

// 窗扇整体宽度
const sashWidth = computed(() => {
  if (!isSashSelected.value || !windowStore.selectedElement) return 0;
  return windowStore.selectedElement.width || 0;
});

// 窗扇整体高度
const sashHeight = computed(() => {
  if (!isSashSelected.value || !windowStore.selectedElement) return 0;
  return windowStore.selectedElement.height || 0;
});

// 窗框大小
const frameSize = computed({
  get: () => {
    if (!isSashSelected.value || !windowStore.selectedElement) return 40;

    const a = windowStore.selectedElement;
    return windowStore.selectedElement.frameSize || 0;
  },
  set: (value) => {
    if (!isSashSelected.value || !windowStore.selectedElement) return;
    
    // 更新窗框大小
    windowStore.selectedElement.frameSize = value;

    
    // 触发重新渲染
    if (windowStore.selectedElement.updateFrameSize) {
      windowStore.selectedElement.updateFrameSize(value);
    }
  }
});

// 玻璃宽度
const glassWidth = computed(() => {
  if (!isSashSelected.value || !windowStore.selectedElement) return 0;
  return sashWidth.value - (frameSize.value * 2);
});

// 玻璃高度
const glassHeight = computed(() => {
  if (!isSashSelected.value || !windowStore.selectedElement) return 0;
  return sashHeight.value - (frameSize.value * 2);
});

// 窗扇类型
const sashType = computed({
  get: () => {
    if (!isSashSelected.value || !windowStore.selectedElement) return 'fixed';
    return windowStore.selectedElement.sashType || 'fixed';
  },
  set: (value) => {
    if (!isSashSelected.value || !windowStore.selectedElement) return;
    
    // 更新窗扇类型
    windowStore.selectedElement.sashType = value;
    
    // 如果有更新窗扇类型的方法，调用它
    if (windowStore.selectedElement.updateSashType) {
      nextTick(() => {
        windowStore.selectedElement.updateSashType(value);
      });
    }
  }
});

// 空白区域宽度
const emptyAreaWidth = computed(() => {
  if (!isEmptyAreaSelected.value || !windowStore.selectedElement) return 0;
  return windowStore.selectedElement.width || 0;
});

// 空白区域高度
const emptyAreaHeight = computed(() => {
  if (!isEmptyAreaSelected.value || !windowStore.selectedElement) return 0;
  return windowStore.selectedElement.height || 0;
});

// 选择的窗扇类型
const selectedSashType = ref('fixed');

// 安装窗扇
function installSash() {
  if (!isEmptyAreaSelected.value || !windowStore.selectedElement) return;
  
  const area = windowStore.selectedElement;
  
  // 检查区域是否已有内容
  if (area.children && area.children.length > 0) {
    alert('此区域已被分割，无法安装窗扇');
    return;
  }
  
  if (area.sash) {
    alert('此区域已有窗扇，无法重复安装');
    return;
  }
  
  // 在空白区域添加窗扇
  if (area.addSash) {
    area.addSash(selectedSashType.value);
    // 选中新安装的窗扇
    if (area.sash) {
      windowStore.selectedElement = area.sash;
    }
  } else {
    alert('安装失败，请重试');
  }
}

// 空白区域分割方向
const splitDirection = ref<'horizontal' | 'vertical' | null>(null);

// 中挺厚度
const splitThickness = ref(40);

// 空白区域分割
function confirmSplit() {
  if (!isEmptyAreaSelected.value || !windowStore.selectedElement) return;
  
  const area = windowStore.selectedElement;
  
  // 检查区域是否已有内容
  if (area.children && area.children.length > 0) {
    alert('此区域已被分割，无法再次分割');
    return;
  }
  
  if (area.sash) {
    alert('此区域已有窗扇，无法分割');
    return;
  }

  // 计算分割位置 - 默认在中间位置分割
  const position = {
    x: splitDirection.value === 'vertical' ? area.width / 2 : 0,
    y: splitDirection.value === 'horizontal' ? area.height / 2 : 0
  };
  
  // 执行分割
  if (area.splitArea && splitDirection.value) {
    area.splitArea(splitDirection.value, position, splitThickness.value);
    
    // 重置分割方向
    splitDirection.value = null;
  }
}

// 当选中元素变化时，重置分割设置
watch(() => windowStore.selectedElement, (newElement) => {
  // 重置分割方向
  splitDirection.value = null;
  
  if (newElement && newElement.ele === 'window-muntin') {
    console.log('选中了中挺:', newElement);
  } else if (newElement && newElement.ele === 'window-empty-area') {
    console.log('选中了空白区域:', newElement);
  }
}, { immediate: true });

// 删除中挺
function deleteMuntin() {
  if (!isMuntinSelected.value || !windowStore.selectedElement) return;
  
  if (confirm('确定要删除这个中挺吗？')) {
    // 获取父元素
    const parent = windowStore.selectedElement.parent;
    
    // 实现删除逻辑 - 需要父组件提供删除方法
    if (parent && parent.removeMuntin) {
      parent.removeMuntin(windowStore.selectedElement.id);
      windowStore.selectedElement = null;
    }
  }
}

// 删除窗扇
function deleteSash() {
  if (!isSashSelected.value || !windowStore.selectedElement) return;
  
  if (confirm('确定要删除这个窗扇吗？')) {
    // 获取父元素
    const parent = windowStore.selectedElement.parent;
    
    // 实现删除逻辑 - 需要父组件提供删除方法
    if (parent && parent.removeSash) {
      parent.removeSash(windowStore.selectedElement.id);
      windowStore.selectedElement = null;
    }
  }
}

// 使用VueUse的onKeyStroke替代原生的键盘事件监听
// 同时监听Delete和Backspace键，兼容Windows和Mac
onKeyStroke(['Delete', 'Backspace'], (e) => {
  // 检查当前焦点是否在输入框、文本框或其他可输入元素中
  const activeElement = document.activeElement;
  const isInputActive = activeElement instanceof HTMLInputElement || 
                       activeElement instanceof HTMLTextAreaElement || 
                       activeElement instanceof HTMLSelectElement ||
                       (activeElement && 'isContentEditable' in activeElement && activeElement.isContentEditable);
  
  // 如果焦点在输入元素中，不执行删除操作
  if (isInputActive) {
    return;
  }
  
  // 仅当焦点不在输入元素中时，执行删除操作
  if (isMuntinSelected.value) {
    deleteMuntin();
  } else if (isSashSelected.value) {
    deleteSash();
  }
});

// 窗框颜色
const frameColor = computed({
  get: () => {
    if (!isFrameSelected.value || !windowStore.selectedElement) return '#8B4513';
    return windowStore.selectedElement.color || '#8B4513';
  },
  set: (value) => {
    if (!isFrameSelected.value || !windowStore.selectedElement) return;
    
    // 更新窗框颜色
    windowStore.selectedElement.color = value;
    
    // 如果有更新窗框颜色的方法，调用它
    if (windowStore.selectedElement.updateColor) {
      nextTick(() => {
        windowStore.selectedElement.updateColor(
          value,
          windowStore.selectedElement.frameStrokeColor,
          windowStore.selectedElement.frameStrokeWidth
        );
      });
    }
  }
});

// 窗框边线颜色
const frameStrokeColor = computed({
  get: () => {
    if (!isFrameSelected.value || !windowStore.selectedElement) return '#000';
    return windowStore.selectedElement.frameStrokeColor || '#000';
  },
  set: (value) => {
    if (!isFrameSelected.value || !windowStore.selectedElement) return;
    
    // 更新窗框边线颜色
    windowStore.selectedElement.frameStrokeColor = value;
    
    // 如果有更新窗框的方法，调用它
    if (windowStore.selectedElement.updateColor) {
      nextTick(() => {
        windowStore.selectedElement.updateColor(
          windowStore.selectedElement.color,
          value,
          windowStore.selectedElement.frameStrokeWidth
        );
      });
    }
  }
});

// 窗框边线宽度
const frameStrokeWidth = computed({
  get: () => {
    if (!isFrameSelected.value || !windowStore.selectedElement) return 0.5;
    return windowStore.selectedElement.frameStrokeWidth || 0.5;
  },
  set: (value) => {
    if (!isFrameSelected.value || !windowStore.selectedElement) return;
    
    // 更新窗框边线宽度
    windowStore.selectedElement.frameStrokeWidth = value;
    
    // 如果有更新窗框的方法，调用它
    if (windowStore.selectedElement.updateColor) {
      nextTick(() => {
        windowStore.selectedElement.updateColor(
          windowStore.selectedElement.color,
          windowStore.selectedElement.frameStrokeColor,
          value
        );
      });
    }
  }
});

// 窗扇颜色
const sashColor = computed({
  get: () => {
    if (!isSashSelected.value || !windowStore.selectedElement) return '#A0522D';
    // 窗扇颜色存储在frame对象中
    return windowStore.selectedElement.frame?.frameColor || '#A0522D';
  },
  set: (value) => {
    if (!isSashSelected.value || !windowStore.selectedElement) return;
    
    // 如果有更新窗扇颜色的方法，调用它
    if (windowStore.selectedElement.frame.updateData) {
      nextTick(() => {
        windowStore.selectedElement.frame.updateData(
          value,
          sashStrokeColor.value,
          sashStrokeWidth.value
        );
      });
    }
  }
});

// 窗扇边线颜色
const sashStrokeColor = computed({
  get: () => {
    if (!isSashSelected.value || !windowStore.selectedElement) return '#000';
    // 窗扇边线颜色存储在frame对象中
    return windowStore.selectedElement.frame?.frameStrokeColor || '#000';
  },
  set: (value) => {
    if (!isSashSelected.value || !windowStore.selectedElement) return;
    
    // 如果有更新窗扇的方法，调用它
    if (windowStore.selectedElement.frame.updateData) {
      nextTick(() => {
        windowStore.selectedElement.frame.updateData(
          sashColor.value,
          value,
          sashStrokeWidth.value
        );
      });
    }
  }
});

// 窗扇边线宽度
const sashStrokeWidth = computed({
  get: () => {
    if (!isSashSelected.value || !windowStore.selectedElement) return 1;
    // 窗扇边线宽度存储在frame对象中
    return windowStore.selectedElement.frame?.frameStrokeWidth || 1;
  },
  set: (value) => {
    if (!isSashSelected.value || !windowStore.selectedElement) return;
    
    // 如果有更新窗扇的方法，调用它
    if (windowStore.selectedElement.frame.updateData) {
      nextTick(() => {
        windowStore.selectedElement.frame.updateData(
          sashColor.value,
          sashStrokeColor.value,
          value
        );
      });
    }
  }
});

// 玻璃颜色
const glassColor = computed({
  get: () => {
    if (!isSashSelected.value || !windowStore.selectedElement) return '#ADD8E6';
    // 玻璃颜色存储在glass对象中
    return windowStore.selectedElement.glass?.color || '#ADD8E6';
  },
  set: (value) => {
    if (!isSashSelected.value || !windowStore.selectedElement) return;
    
    // 如果有玻璃，更新其颜色
    if (windowStore.selectedElement.glass) {
      // 如果有更新玻璃颜色的方法，调用它
      if (windowStore.selectedElement.glass.updateData) {
        nextTick(() => {
          windowStore.selectedElement.glass.updateData(value, glassOpacity.value);
        });
      }
    }
  }
});

// 玻璃透明度
const glassOpacity = computed({
  get: () => {
    if (!isSashSelected.value || !windowStore.selectedElement) return 0.7;
    // 透明度存储在glass对象中
    return windowStore.selectedElement.glass?.opacity || 0.7;
  },
  set: (value) => {
    if (!isSashSelected.value || !windowStore.selectedElement) return;
    
    // 如果有玻璃，更新其透明度
    if (windowStore.selectedElement.glass) {
      // 如果有更新玻璃颜色的方法，调用它
      if (windowStore.selectedElement.glass.updateData) {
        nextTick(() => {
          windowStore.selectedElement.glass.updateData(glassColor.value, value);
        });
      }
    }
  }
});
</script>

<style scoped>
.setting-panel {
  padding: 15px;
  background: #f5f5f5;
  border-left: 1px solid #ddd;
  width: 250px;
  height: 100%;
  overflow-y: auto;
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
  border-bottom: 1px solid #ddd;
  padding-bottom: 8px;
}

.setting-group {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
}

.setting-group label {
  font-size: 14px;
  margin-bottom: 4px;
  color: #555;
}

.setting-group input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
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
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

button:hover {
  background: #f0f0f0;
}

.delete-button {
  background: #ff4a4a;
  color: white;
  border-color: #d83636;
}

.delete-button:hover {
  background: #d83636;
}

.setting-tips {
  margin-top: 20px;
  padding: 10px;
  background: #e9f7fb;
  border-radius: 4px;
  font-size: 12px;
  color: #444;
}

.setting-tips p {
  margin: 5px 0;
}

/* 添加新的样式 */
.size-display {
  background: #f8f8f8;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.size-item {
  display: flex;
  justify-content: space-between;
  margin: 4px 0;
  font-size: 14px;
  color: #666;
}

.size-item span {
  font-family: monospace;
}

.select-input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  width: 100%;
}

.select-input:focus {
  border-color: #4a6bff;
  outline: none;
}

.install-button {
  background: #4a6bff;
  color: white;
  border-color: #3551d1;
  width: 100%;
}

.install-button:hover {
  background: #3551d1;
}

.separator {
  margin: 20px 0;
  border-top: 1px dashed #ccc;
}

.split-buttons {
  display: flex;
  gap: 10px;
}

.split-button {
  flex: 1;
  background: #f5f5f5;
  border: 1px solid #ccc;
}

.split-button.active {
  background: #e0e0ff;
  border-color: #4a6bff;
  font-weight: bold;
}

.split-confirm-button {
  background: #4a9bff;
  color: white;
  border-color: #3581d1;
  width: 100%;
}

.split-confirm-button:hover {
  background: #3581d1;
}

.color-picker-container {
  display: flex;
  align-items: center;
}

.color-input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 8px;
}

.color-text {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.slider {
  width: 100%;
}

.opacity-hint {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}
</style> 