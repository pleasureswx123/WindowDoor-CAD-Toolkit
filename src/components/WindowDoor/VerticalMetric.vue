<script setup lang="ts">
// 垂直度量组件
import { computed } from 'vue';

const props = defineProps<{
  x: number;
  y: number;
  height: number;
}>();

const METRIC_SIZE = 100;

// 计算箭头和线条的点
const arrowPoints = computed(() => [METRIC_SIZE / 2, 0, METRIC_SIZE / 2, props.height]);
const topLinePoints = computed(() => [0, 0, METRIC_SIZE, 0]);
const bottomLinePoints = computed(() => [0, props.height, METRIC_SIZE, props.height]);

// 标签位置和文本
const labelX = computed(() => METRIC_SIZE / 2 - 50);
const labelY = computed(() => props.height / 2);
const metricText = computed(() => `${props.height} mm`);
</script>

<template>
  <v-group :x="x" :y="y">
    <v-arrow
      :points="arrowPoints"
      :stroke="'black'"
      :fill="'black'"
      :pointerAtBeginning="true"
    />
    <v-line :points="topLinePoints" :stroke="'black'" />
    <v-line :points="bottomLinePoints" :stroke="'black'" />
    <v-label :x="labelX" :y="labelY">
      <v-tag :fill="'white'" :stroke="'black'" />
      <v-text :text="metricText" :padding="10" />
    </v-label>
  </v-group>
</template> 