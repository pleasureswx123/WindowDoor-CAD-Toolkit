<script setup lang="ts">
// 框架尺寸控制组件
import { ref, computed } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const props = defineProps<{
  x: number;
  y: number;
}>();

const store = useWindowDoorStore();
const showRootPopup = ref(false);
const showSectionPopup = ref(false);
const isRootHovered = ref(false);
const isSectionHovered = ref(false);


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



const handleSectionMouseEnter = () => {
  isSectionHovered.value = true;
  document.body.style.cursor = 'pointer';
};


const handleSectionMouseLeave = () => {
  isSectionHovered.value = false;
  document.body.style.cursor = 'default';
};



const sectionBadgeStyle = computed(() => ({
  fill: isSectionHovered.value ? '#f0f9fe' : '#faf8f2',
  stroke: '#e6a23c',
  strokeWidth: 1.5,
  opacity: 0.9,
  shadowBlur: isSectionHovered.value ? 5 : 0,
  shadowColor: isSectionHovered.value ? '#e6a23c' : 'transparent'
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
    <!-- 窗扇框架厚度控制 - 仅当有选中窗扇时显示 -->
    <v-label 
      v-if="sectionFrameSize !== null"
      :y="35"
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
</template>

<style scoped>
/* 添加一些鼠标悬停样式，提示可点击 */
:deep(.konvajs-content) {
  cursor: pointer;
}
</style> 