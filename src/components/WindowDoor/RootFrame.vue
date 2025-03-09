<script setup lang="ts">
// 根框架组件 - 对应React版本中的RootFrame.jsx
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import Section from './Section.vue';
import Sash from './Sash.vue';
import Metrics from './Metrics.vue';
import ZoomControls from './ZoomControls.vue';
import FrameSizeControl from './utils/FrameSizeControl.vue';
import MetricsControl from './utils/MetricsControl.vue';

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
  // 确保root对象已正确初始化
  if (!store.root.sections || store.root.sections.length === 0) {
    console.log('初始化窗户布局');
    store.initializeWindowWithSections('default');
  }
  
  // 延迟更新舞台尺寸，确保DOM已经渲染
  nextTick(() => {
    updateStageDimensions();
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateStageDimensions);
  });
  
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
  
  // 确保窗户尺寸不为0，防止除以0产生NaN
  const windowWidth = store.root?.width || 800;
  const windowHeight = store.root?.height || 600;
  
  // 确保舞台尺寸正确
  const stageWidth = Math.max(100, stageSize.value?.width || 100);
  const stageHeight = Math.max(100, stageSize.value?.height || 100);
  
  const stageWidthWithPadding = stageWidth - padding * 2;
  const stageHeightWithPadding = stageHeight - padding * 2;
  
  // 防止除以0
  const widthRatio = windowWidth > 0 ? stageWidthWithPadding / windowWidth : 1;
  const heightRatio = windowHeight > 0 ? stageHeightWithPadding / windowHeight : 1;
  
  // 确保比例是有限数字
  const validWidthRatio = isFinite(widthRatio) ? widthRatio : 1;
  const validHeightRatio = isFinite(heightRatio) ? heightRatio : 1;
  
  const scale = Math.min(validWidthRatio, validHeightRatio);
  
  // 防止NaN值
  const safeScale = isFinite(scale) && scale > 0 ? scale : 1;
  
  // 计算居中位置
  const centeredX = (stageWidth - windowWidth * safeScale) / 2;
  const centeredY = (stageHeight - windowHeight * safeScale) / 2;
  
  // 确保返回的坐标是有效数字
  return {
    scale: safeScale,
    x: isFinite(centeredX) ? centeredX : 0,
    y: isFinite(centeredY) ? centeredY : 0
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
            width: (store.root.width || 0) + 300,
            height: (store.root.height || 0) + 300,
            x: -150,
            y: -150,
            name: 'background',
            fill: 'transparent'
          }"
        />
        
        <!-- 主区域 -->
        <Section
          v-if="store.root.sections && store.root.sections[0]"
          :section="store.root.sections[0]"
          :x="store.root.frameSize || 0"
          :y="store.root.frameSize || 0"
        />
        
        <!-- 主框架 -->
        <Sash
          :width="store.root.width || 0"
          :height="store.root.height || 0"
          :size="store.root.frameSize || 0"
          :isRoot="true"
        />
        
        <!-- 度量标注 -->
        <Metrics />
        
        <!-- 框架尺寸控制 - 放在右上角 -->
        <FrameSizeControl
          :x="(store.root.width || 0) - 10"
          :y="10"
        />
      </v-layer>
    </v-stage>
    
    <!-- 添加缩放控制按钮 -->
    <ZoomControls />
    
    <!-- 添加标注尺寸控制按钮 -->
    <MetricsControl />
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