<script setup lang="ts">
// 度量组件 - 对应React版本中的Metrics.jsx
import { watch, ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import VerticalMetric from './VerticalMetric.vue';
import HorizontalMetric from './HorizontalMetric.vue';

const store = useWindowDoorStore();
const METRIC_SIZE = 100;
const FRAME_METRIC_OFFSET = 50; // 外框标注的偏移量

// 使用ref来存储度量数据，以便更新时能触发视图刷新
const verticalComponents = ref<any[]>([]);
const horizontalComponents = ref<any[]>([]);

// 追踪上次计算时间，防止短时间内重复计算
const lastUpdateTime = ref(0);
const UPDATE_DEBOUNCE_MS = 50; // 防抖间隔时间（毫秒）

// 通过计算属性来获取标注显示状态
const isMetricsVisible = computed(() => store.isMetricsVisible());

// 创建一个计算属性，用于监听窗口数据的变化
const windowDataSnapshot = computed(() => {
  // 递归获取所有节点的尺寸快照
  function getNodeSnapshot(node: any): any {
    if (!node) return null;
    
    const snapshot: any = {
      id: node.id,
      width: node.width,
      height: node.height,
      nodeType: node.nodeType,
      splitDirection: node.splitDirection,
      frameSize: node.frameSize // 添加框架尺寸到快照中
    };
    
    if (node.sections && node.sections.length > 0) {
      snapshot.sections = node.sections.map((sec: any) => getNodeSnapshot(sec));
    }
    
    return snapshot;
  }
  
  return getNodeSnapshot(store.root);
});

// 计算度量数据
function calculateMetrics() {
  // 如果标注设置为隐藏，则不计算
  if (!isMetricsVisible.value) {
    verticalComponents.value = [];
    horizontalComponents.value = [];
    return;
  }
  
  // 防抖：如果距离上次计算的时间太短，跳过本次计算
  const now = Date.now();
  if (now - lastUpdateTime.value < UPDATE_DEBOUNCE_MS) {
    return;
  }
  
  // 检查root是否存在且有效
  if (!store.root || typeof store.root.width !== 'number' || typeof store.root.height !== 'number') {
    console.log('Root节点不存在或维度无效，跳过度量计算');
    return;
  }
  
  lastUpdateTime.value = now;
  console.log('重新计算度量标注', store.metricsUpdateCounter, '框架尺寸:', store.root.frameSize);
  
  // 清空现有数据
  verticalComponents.value = [];
  horizontalComponents.value = [];

  // 添加整个窗户的宽度和高度标注
  // 外部宽度标注
  horizontalComponents.value.push({
    width: Math.max(0, store.root.width || 0),
    x: 0,
    y: Math.max(0, (store.root.height || 0) + FRAME_METRIC_OFFSET),
    key: 'h-full-width',
    sectionId: 'root-width',
    isFrameMetric: true,
    nodeType: 'frame'
  });

  // 外部高度标注
  verticalComponents.value.push({
    height: Math.max(0, store.root.height || 0),
    x: Math.max(0, (store.root.width || 0) + FRAME_METRIC_OFFSET),
    y: 0,
    key: 'v-full-height',
    sectionId: 'root-height',
    isFrameMetric: true,
    nodeType: 'frame'
  });

  // 递归处理各个区域的度量
  function processSection(sec: any, verticalPos: { x: number; y: number }, horizontalPos: { x: number; y: number }) {
    // 安全检查：确保sec是有效对象
    if (!sec || typeof sec !== 'object') {
      console.warn('无效的section对象，跳过处理', sec);
      return;
    }
    
    // 跳过root节点本身的度量，只处理其内部区域
    if (sec.id !== "root") {
      // 确保宽高为有效数字
      const height = typeof sec.height === 'number' && isFinite(sec.height) ? Math.max(0, sec.height) : 0;
      const width = typeof sec.width === 'number' && isFinite(sec.width) ? Math.max(0, sec.width) : 0;
      
      // 确保坐标为有效数字  
      const vx = typeof verticalPos.x === 'number' && isFinite(verticalPos.x) ? verticalPos.x : 0;
      const vy = typeof verticalPos.y === 'number' && isFinite(verticalPos.y) ? verticalPos.y : 0;
      const hx = typeof horizontalPos.x === 'number' && isFinite(horizontalPos.x) ? horizontalPos.x : 0;
      const hy = typeof horizontalPos.y === 'number' && isFinite(horizontalPos.y) ? horizontalPos.y : 0;
      
      // 添加垂直度量
      verticalComponents.value.push({
        height,
        x: vx,
        y: vy,
        key: `v-${sec.id}`,
        sectionId: sec.id,
        nodeType: sec.nodeType // 添加节点类型，区分分隔条和区域
      });

      // 添加水平度量
      horizontalComponents.value.push({
        width,
        x: hx,
        y: hy,
        key: `h-${sec.id}`,
        sectionId: sec.id,
        nodeType: sec.nodeType // 添加节点类型，区分分隔条和区域
      });
    }

    const isVertical = sec.splitDirection === 'vertical';
    const isHorizontal = sec.splitDirection === 'horizontal';
    const hasSections = sec.sections && Array.isArray(sec.sections) && sec.sections.length > 0;

    // 如果没有子区域，直接返回
    if (!hasSections) return;

    let childOffset = 0;
    
    // 处理水平分割的子区域
    if (isHorizontal && hasSections) {
      for (const child of sec.sections) {
        if (!child) continue; // 跳过无效子项
        
        const safeChildHeight = typeof child.height === 'number' && isFinite(child.height) ? child.height : 0;
        
        processSection(
          child,
          {
            x: verticalPos.x + METRIC_SIZE,
            y: verticalPos.y + childOffset
          },
          horizontalPos
        );
        childOffset += safeChildHeight;
      }
    }
    
    // 处理垂直分割的子区域
    if (isVertical && hasSections) {
      for (const child of sec.sections) {
        if (!child) continue; // 跳过无效子项
        
        const safeChildWidth = typeof child.width === 'number' && isFinite(child.width) ? child.width : 0;
        
        processSection(
          child, 
          verticalPos, 
          {
            x: horizontalPos.x + childOffset,
            y: horizontalPos.y + METRIC_SIZE
          }
        );
        childOffset += safeChildWidth;
      }
    }
    
    // 处理无分割但有子区域的情况
    if (!isVertical && !isHorizontal && hasSections && sec.sections[0]) {
      const frameSize = typeof sec.frameSize === 'number' && isFinite(sec.frameSize) ? sec.frameSize : 0;
      
      processSection(
        sec.sections[0],
        {
          x: verticalPos.x + METRIC_SIZE,
          y: verticalPos.y + frameSize
        },
        {
          x: horizontalPos.x + frameSize,
          y: horizontalPos.y + METRIC_SIZE
        }
      );
    }
  }

  try {
    // 从根元素开始处理
    processSection(store.root, { x: 0, y: 0 }, { x: 0, y: 0 });
  } catch (error) {
    console.error('度量计算过程中发生错误:', error);
    // 出错时清空组件，避免使用可能已部分填充的数据
    verticalComponents.value = [];
    horizontalComponents.value = [];
  }
}

// 初始计算
onMounted(() => {
  calculateMetrics();
});

// 监听计数器更新
watch(() => store.metricsUpdateCounter, () => {
  calculateMetrics();
});

// 监听标注显示状态变化
watch(() => isMetricsVisible.value, () => {
  calculateMetrics();
});

// 直接监听框架尺寸变化
watch(() => store.root.frameSize, () => {
  console.log('框架尺寸变化触发重新计算');
  calculateMetrics();
});

// 监听数据快照变化
watch(() => windowDataSnapshot.value, () => {
  calculateMetrics();
}, { deep: true });

// const intervalTimer = setInterval(() => {
//   calculateMetrics();
// }, 1000);

// // 组件卸载时清除计时器
// onUnmounted(() => {
//   clearInterval(intervalTimer);
// });
</script>

<template>
  <v-group v-if="isMetricsVisible">
    <!-- 垂直度量 -->
    <v-group>
      <VerticalMetric 
        v-for="metric in verticalComponents"
        :key="metric.key"
        :x="metric.x"
        :y="metric.y"
        :height="metric.height"
        :section-id="metric.sectionId"
        :is-frame-metric="metric.isFrameMetric"
        :node-type="metric.nodeType"
      />
    </v-group>
    
    <!-- 水平度量 -->
    <v-group>
      <HorizontalMetric 
        v-for="metric in horizontalComponents"
        :key="metric.key"
        :x="metric.x"
        :y="metric.y"
        :width="metric.width"
        :section-id="metric.sectionId"
        :is-frame-metric="metric.isFrameMetric"
        :node-type="metric.nodeType"
      />
    </v-group>
  </v-group>
</template> 