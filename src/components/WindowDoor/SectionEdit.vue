<script setup lang="ts">
// 区域编辑组件 - 对应React版本中的SectionEdit.jsx
import { computed } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const store = useWindowDoorStore();

// 当前选中的区域
const selectedSection = computed(() => store.selectedSection || {});

// 判断是否有区域被选中
const isEnabled = computed(() => !!store.selectedSection);

// 处理类型选择变更
const handleTypeSelect = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  store.setSectionType(target.value);
};

// 处理框架尺寸变更
const handleFrameSizeChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (store.selectedSection) {
    store.selectedSection.frameSize = parseInt(target.value, 10);
  }
};

// 处理垂直分割
const handleVerticalSplit = () => {
  store.splitCurrentSection('vertical');
};

// 处理水平分割
const handleHorizontalSplit = () => {
  store.splitCurrentSection('horizontal');
};
</script>

<template>
  <div :style="{ 
    opacity: isEnabled ? '1' : '0.3',
    pointerEvents: isEnabled ? 'auto' : 'none'
  }">
    <div>
      窗类型：
      <select :value="selectedSection.type" @change="handleTypeSelect">
        <option value="none">空</option>
        <option value="left">向左开</option>
        <option value="right">向右开</option>
        <option value="tilt,left">倾斜并向左开</option>
        <option value="tilt,right">倾斜并向右开</option>
      </select>
      
      框架尺寸：
      <input 
        type="number" 
        :value="selectedSection.frameSize" 
        @change="handleFrameSizeChange" 
      />
    </div>
    
    <button @click="handleVerticalSplit">垂直分割</button>
    <button @click="handleHorizontalSplit">水平分割</button>
  </div>
</template>

<style scoped>
div {
  margin-bottom: 10px;
}

select, input {
  margin: 0 10px;
}

button {
  margin-right: 10px;
  padding: 5px 10px;
  cursor: pointer;
}
</style> 