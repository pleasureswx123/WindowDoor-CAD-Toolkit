<script setup lang="ts">
// 根框架组件 - 对应React版本中的RootFrame.jsx
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import Section from './Section.vue';
import Sash from './Sash.vue';
import Metrics from './Metrics.vue';
import ZoomControls from './ZoomControls.vue';
import FrameSizeControl from './utils/FrameSizeControl.vue';
import SectionTypeControl from './utils/SectionTypeControl.vue';

const store = useWindowDoorStore();
const containerRef = ref<HTMLDivElement | null>(null);
const stageRef = ref<any>(null);

// 舞台尺寸状态
const stageSize = ref({
  width: 100,
  height: 500
});

// 初始化时获取容器宽度并监听窗口大小变化
onMounted(() => {
  updateStageDimensions();
  
  // 监听窗口大小变化
  window.addEventListener('resize', updateStageDimensions);
  
  // 清理事件监听
  return () => {
    window.removeEventListener('resize', updateStageDimensions);
  };
});

// 更新舞台尺寸
const updateStageDimensions = () => {
  if (containerRef.value) {
    stageSize.value = {
      width: containerRef.value.offsetWidth,
      height: containerRef.value.offsetHeight || 600
    };
  }
};

// 监听存储中窗户尺寸变化
watch(() => [store.root.width, store.root.height], () => {
  // 当窗户尺寸变化时，可能需要调整缩放
  nextTick(updateStageDimensions);
});

// 处理舞台点击事件，用于取消选择
const handleClick = (e: any) => {
  // 获取目标节点
  const target = e.target;
  
  // 如果已经被子组件处理了，就不再处理
  if (e.cancelBubble) {
    return;
  }
  
  // 如果没有被子组件处理且不是section，则取消选择
  // 检查名称是否包含"section"
  const targetName = target.name && target.name();
  const isSection = targetName && targetName.indexOf('section') >= 0;
  
  if (!isSection) {
    store.selectedSectionId = null;
  }
};

// 计算缩放比例和中心位置
const viewConfig = computed(() => {
  const padding = 60; // 边距
  
  // 计算宽高比例，选择最小值保持比例
  const windowWidth = store.root.width;
  const windowHeight = store.root.height;
  
  const stageWidthWithPadding = stageSize.value.width - padding * 2;
  const stageHeightWithPadding = stageSize.value.height - padding * 2;
  
  const widthRatio = stageWidthWithPadding / windowWidth;
  const heightRatio = stageHeightWithPadding / windowHeight;
  
  const scale = Math.min(widthRatio, heightRatio);
  
  // 计算居中位置
  const centeredX = (stageSize.value.width - windowWidth * scale) / 2;
  const centeredY = (stageSize.value.height - windowHeight * scale) / 2;
  
  return {
    scale,
    x: centeredX,
    y: centeredY
  };
});
</script>

<template>
  <div ref="containerRef" class="root-frame-container">
    <v-stage
      :config="{
        width: stageSize.width,
        height: stageSize.height,
      }"
      ref="stageRef"
      @click="handleClick"
    >
      <v-layer 
        :config="{
          scaleX: viewConfig.scale,
          scaleY: viewConfig.scale,
          x: viewConfig.x,
          y: viewConfig.y
        }"
      >
        <!-- 背景 - 用于点击取消选择 -->
        <v-rect 
          :config="{
            width: store.root.width + 300,
            height: store.root.height + 300,
            x: -150,
            y: -150,
            name: 'background',
            fill: 'transparent'
          }"
        />
        
        <!-- 主区域 -->
        <Section
          :section="store.root.sections[0]"
          :x="store.root.frameSize"
          :y="store.root.frameSize"
        />
        
        <!-- 主框架 -->
        <Sash
          :width="store.root.width"
          :height="store.root.height"
          :size="store.root.frameSize"
          :isRoot="true"
        />
        
        <!-- 度量标注 -->
        <Metrics />
        
        <!-- 框架尺寸控制 - 放在右上角 -->
        <FrameSizeControl
          :x="store.root.width - 10"
          :y="10"
        />
      </v-layer>
    </v-stage>
    
    <!-- 添加缩放控制按钮 -->
    <ZoomControls />
    
    <!-- 添加窗扇类型控制面板 -->
    <SectionTypeControl />
  </div>
</template>

<style scoped>
.root-frame-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
  background-color: #f0f0f0;
  box-sizing: border-box;
  position: relative;
}
</style> 