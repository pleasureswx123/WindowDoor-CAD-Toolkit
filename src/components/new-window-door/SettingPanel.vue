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
        <input 
          type="number" 
          v-model.number="muntinThickness" 
          min="20" 
          max="100" 
          step="2"
        />
      </div>
      
      <!-- 中挺位置设置 -->
      <div class="setting-group" v-if="muntinDirection === 'horizontal'">
        <label>上边距 (mm):</label>
        <input 
          type="number" 
          v-model.number="muntinPosition" 
          :min="minPosition" 
          :max="maxPosition" 
          step="5"
        />
      </div>
      
      <div class="setting-group" v-if="muntinDirection === 'vertical'">
        <label>左边距 (mm):</label>
        <input 
          type="number" 
          v-model.number="muntinPosition" 
          :min="minPosition" 
          :max="maxPosition" 
          step="5"
        />
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
    
    <!-- 其他元素设置面板可以在这里添加 -->
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
    debugger;
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

// 当选中元素变化时，更新中挺属性
watch(() => windowStore.selectedElement, (newElement) => {
  if (newElement && newElement.ele === 'window-muntin') {
    console.log('选中了中挺:', newElement);
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

// 使用VueUse的onKeyStroke替代原生的键盘事件监听
// 同时监听Delete和Backspace键，兼容Windows和Mac
onKeyStroke(['Delete', 'Backspace'], (e) => {
  if (isMuntinSelected.value) {
    deleteMuntin();
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
</style> 