<script setup lang="ts">
// 度量组件 - 对应React版本中的Metrics.jsx
import { computed } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import VerticalMetric from './VerticalMetric.vue';
import HorizontalMetric from './HorizontalMetric.vue';

const store = useWindowDoorStore();
const METRIC_SIZE = 100;

// 度量数据
const metrics = computed(() => {
  const verticalComponents: any[] = [];
  const horizontalComponents: any[] = [];

  // 递归处理各个区域的度量
  function processSection(sec: any, verticalPos: { x: number; y: number }, horizontalPos: { x: number; y: number }) {
    // 添加垂直度量
    verticalComponents.push({
      height: sec.height,
      x: verticalPos.x,
      y: verticalPos.y,
      key: `v-${sec.id}`
    });

    // 添加水平度量
    horizontalComponents.push({
      width: sec.width,
      x: horizontalPos.x,
      y: horizontalPos.y,
      key: `h-${sec.id}`
    });

    const isVertical = sec.splitDirection === 'vertical';
    const isHorizontal = sec.splitDirection === 'horizontal';
    const hasSections = sec.sections && sec.sections.length > 0;

    let childOffset = 0;
    
    // 处理水平分割的子区域
    if (isHorizontal && hasSections) {
      for (const child of sec.sections) {
        processSection(
          child,
          {
            x: verticalPos.x + METRIC_SIZE,
            y: verticalPos.y + childOffset
          },
          horizontalPos
        );
        childOffset += child.height;
      }
    }
    
    // 处理垂直分割的子区域
    if (isVertical && hasSections) {
      for (const child of sec.sections) {
        processSection(
          child, 
          verticalPos, 
          {
            x: horizontalPos.x + childOffset,
            y: horizontalPos.y + METRIC_SIZE
          }
        );
        childOffset += child.width;
      }
    }
    
    // 处理无分割但有子区域的情况
    if (!isVertical && !isHorizontal && hasSections) {
      processSection(
        sec.sections[0],
        {
          x: verticalPos.x + METRIC_SIZE,
          y: verticalPos.y + sec.frameSize
        },
        {
          x: horizontalPos.x + sec.frameSize,
          y: horizontalPos.y + METRIC_SIZE
        }
      );
    }
  }

  // 从根元素开始处理
  processSection(store.root, { x: 0, y: 0 }, { x: 0, y: 0 });

  return {
    verticalComponents,
    horizontalComponents
  };
});
</script>

<template>
  <v-group>
    <!-- 垂直度量 -->
    <v-group :x="store.root.width">
      <VerticalMetric 
        v-for="metric in metrics.verticalComponents"
        :key="metric.key"
        :x="metric.x"
        :y="metric.y"
        :height="metric.height"
      />
    </v-group>
    
    <!-- 水平度量 -->
    <v-group :y="store.root.height">
      <HorizontalMetric 
        v-for="metric in metrics.horizontalComponents"
        :key="metric.key"
        :x="metric.x"
        :y="metric.y"
        :width="metric.width"
      />
    </v-group>
  </v-group>
</template> 