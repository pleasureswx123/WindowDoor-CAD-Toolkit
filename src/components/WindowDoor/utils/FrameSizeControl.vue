<script setup lang="ts">
// 框架尺寸控制组件
import { ref, computed } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import PopupInput from './PopupInput.vue';

const props = defineProps<{
  x: number;
  y: number;
}>();

const store = useWindowDoorStore();
const showRootPopup = ref(false);
const showSectionPopup = ref(false);
const popupPosition = ref({ x: 0, y: 0 });
const popupSize = ref({ width: 100, height: 40 });
const isRootHovered = ref(false);
const isSectionHovered = ref(false);

// 当前框架尺寸
const rootFrameSize = computed(() => store.root.frameSize);

// 当前选中窗扇的框架尺寸
const sectionFrameSize = computed(() => {
  if (!store.selectedSection) return null;
  return store.selectedSection.frameSize;
});

// 判断当前选中的窗扇是否为固定窗
const isFixedWindow = computed(() => {
  if (!store.selectedSection) return false;
  return store.selectedSection.type === "none";
});

// 处理根窗户外框点击事件
const handleRootClick = (e: any) => {
  // 设置弹出框位置
  const rect = e.currentTarget.getBoundingClientRect();
  popupPosition.value = {
    x: rect.left,
    y: rect.top
  };
  
  // 设置弹出框大小
  popupSize.value = {
    width: rect.width,
    height: rect.height
  };
  
  // 显示弹出框
  showRootPopup.value = true;
};

// 处理窗扇框架点击事件
const handleSectionClick = (e: any) => {
  if (!store.selectedSection) return;
  
  // 如果是固定窗，不显示调整框架厚度的弹窗
  if (isFixedWindow.value) {
    return;
  }
  
  // 设置弹出框位置
  const rect = e.currentTarget.getBoundingClientRect();
  popupPosition.value = {
    x: rect.left,
    y: rect.top
  };
  
  // 设置弹出框大小
  popupSize.value = {
    width: rect.width,
    height: rect.height
  };
  
  // 显示弹出框
  showSectionPopup.value = true;
};

// 鼠标进入
const handleRootMouseEnter = () => {
  isRootHovered.value = true;
  document.body.style.cursor = 'pointer';
};

const handleSectionMouseEnter = () => {
  isSectionHovered.value = true;
  document.body.style.cursor = 'pointer';
};

// 鼠标离开
const handleRootMouseLeave = () => {
  isRootHovered.value = false;
  document.body.style.cursor = 'default';
};

const handleSectionMouseLeave = () => {
  isSectionHovered.value = false;
  document.body.style.cursor = 'default';
};

// 关闭弹出框
const closeRootPopup = () => {
  showRootPopup.value = false;
};

const closeSectionPopup = () => {
  showSectionPopup.value = false;
};

// 更新根窗户框架尺寸
const updateRootFrameSize = (newSize: number) => {
  store.updateFrameSize(newSize, 'root');
  showRootPopup.value = false;
};

// 更新窗扇框架尺寸
const updateSectionFrameSize = (newSize: number) => {
  if (!store.selectedSection) return;
  store.updateFrameSize(newSize, 'section');
  showSectionPopup.value = false;
};

// 计算样式
const rootBadgeStyle = computed(() => ({
  fill: isRootHovered.value ? '#e6f7ff' : '#f0f9ff',
  stroke: '#1890ff',
  strokeWidth: 1.5,
  opacity: 0.9,
  shadowBlur: isRootHovered.value ? 5 : 0,
  shadowColor: isRootHovered.value ? '#1890ff' : 'transparent'
}));

const sectionBadgeStyle = computed(() => ({
  fill: isSectionHovered.value ? '#f0f9fe' : '#faf8f2',
  stroke: '#e6a23c',
  strokeWidth: 1.5,
  opacity: 0.9,
  shadowBlur: isSectionHovered.value ? 5 : 0,
  shadowColor: isSectionHovered.value ? '#e6a23c' : 'transparent'
}));

const rootTextStyle = computed(() => ({
  fontFamily: 'Arial, sans-serif',
  fontSize: 12,
  fontWeight: 'bold',
  fill: '#1890ff',
  padding: 5
}));

const sectionTextStyle = computed(() => ({
  fontFamily: 'Arial, sans-serif',
  fontSize: 12,
  fontWeight: 'bold',
  fill: '#e6a23c',
  padding: 5
}));
</script>

<template>
  <v-group :x="x" :y="y">
    <!-- 根窗户外框厚度控制 -->
    <v-label 
      @click="handleRootClick"
      @mouseenter="handleRootMouseEnter"
      @mouseleave="handleRootMouseLeave"
    >
      <v-tag v-bind="rootBadgeStyle" :cornerRadius="4" />
      <v-text 
        :text="`窗户外框: ${rootFrameSize} mm`" 
        v-bind="rootTextStyle"
      />
    </v-label>
    
    <!-- 窗扇框架厚度控制 - 仅当有选中窗扇时显示 -->
    <v-label 
      v-if="sectionFrameSize !== null"
      :y="35"
      @click="handleSectionClick"
      @mouseenter="handleSectionMouseEnter"
      @mouseleave="handleSectionMouseLeave"
    >
      <v-tag v-bind="sectionBadgeStyle" :cornerRadius="4" />
      <v-text 
        :text="isFixedWindow ? '固定窗 (无框架)' : `窗扇框架: ${sectionFrameSize} mm`" 
        v-bind="sectionTextStyle"
      />
    </v-label>
  </v-group>
  
  <!-- 根窗户外框厚度弹出输入框 -->
  <teleport to="body" v-if="showRootPopup">
    <PopupInput
      :initialValue="rootFrameSize"
      :position="popupPosition"
      :size="popupSize"
      :title="'调整窗户外框厚度'"
      :min="10"
      :max="200"
      :step="5"
      @update="updateRootFrameSize"
      @close="closeRootPopup"
    />
  </teleport>
  
  <!-- 窗扇框架厚度弹出输入框 -->
  <teleport to="body" v-if="showSectionPopup && sectionFrameSize !== null">
    <PopupInput
      :initialValue="sectionFrameSize"
      :position="popupPosition"
      :size="popupSize"
      :title="'调整窗扇框架厚度'"
      :min="0"
      :max="200"
      :step="5"
      @update="updateSectionFrameSize"
      @close="closeSectionPopup"
    />
  </teleport>
</template>

<style scoped>
/* 添加一些鼠标悬停样式，提示可点击 */
:deep(.konvajs-content) {
  cursor: pointer;
}
</style> 