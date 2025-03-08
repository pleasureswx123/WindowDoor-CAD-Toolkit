<script setup lang="ts">
// 水平度量组件
import { computed } from 'vue';

const props = defineProps<{
  x: number;
  y: number;
  width: number;
}>();

const METRIC_SIZE = 100;

// 计算箭头和线条的点
const arrowPoints = computed(() => [0, METRIC_SIZE / 2, props.width, METRIC_SIZE / 2]);
const leftLinePoints = computed(() => [0, 0, 0, METRIC_SIZE]);
const rightLinePoints = computed(() => [props.width, 0, props.width, METRIC_SIZE]);

// 标签位置和文本
const labelX = computed(() => props.width / 2);
const labelY = computed(() => METRIC_SIZE / 2);
const metricText = computed(() => `${props.width} mm`);
</script>

<template>
  <v-group :x="x" :y="y">
    <v-arrow
      :points="arrowPoints"
      :stroke="'black'"
      :fill="'black'"
      :pointerAtBeginning="true"
    />
    <v-line :points="leftLinePoints" :stroke="'black'" />
    <v-line :points="rightLinePoints" :stroke="'black'" />
    <v-label :x="labelX" :y="labelY">
      <v-tag :fill="'white'" :stroke="'black'" />
      <v-text :text="metricText" :padding="10" />
    </v-label>
  </v-group>
</template> 