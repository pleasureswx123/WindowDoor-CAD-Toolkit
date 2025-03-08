<script setup lang="ts">
// 根框架组件 - 对应React版本中的RootFrame.jsx
import { ref, onMounted, computed } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import Section from './Section.vue';
import Sash from './Sash.vue';
import Metrics from './Metrics.vue';

const store = useWindowDoorStore();
const containerRef = ref<HTMLDivElement | null>(null);
const stageRef = ref<any>(null);

// 舞台尺寸状态
const stageSize = ref({
  width: 100,
  height: 500
});

// 初始化时获取容器宽度
onMounted(() => {
  if (containerRef.value) {
    stageSize.value.width = containerRef.value.offsetWidth;
  }
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

// 计算缩放比例
const scale = computed(() => {
  const padding = 150;
  return (stageSize.value.width - padding * 2) / store.root.width;
});

// 计算舞台高度
const stageHeight = computed(() => {
  const padding = 150;
  return padding * 2 + store.root.height * scale.value;
});
</script>

<template>
  <div ref="containerRef">
    <v-stage
      :config="{
        width: stageSize.width,
        height: stageHeight,
      }"
      ref="stageRef"
      @click="handleClick"
    >
      <v-layer 
        :config="{
          scaleX: scale,
          scaleY: scale,
          y: 20,
          x: 20
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
        />
        
        <!-- 度量标注 -->
        <Metrics />
      </v-layer>
    </v-stage>
  </div>
</template>

<style scoped>
div {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
</style> 