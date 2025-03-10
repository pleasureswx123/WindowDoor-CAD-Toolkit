<script setup lang="ts">
// 区域组件 - 对应React版本中的Section.jsx
import { computed, ref } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import Glass from './Glass.vue';
import OpeningDirection from './OpeningDirection.vue';
import Sash from './Sash.vue';
import Handle from './Handle.vue';
import DeviderComponent from './Devider.vue';
import { createHighlightConfig } from './utils/konvaConfig';

const props = defineProps<{
  section: any;
  x: number;
  y: number;
}>();

const store = useWindowDoorStore();
const groupRef = ref<any>(null);

// 判断当前区域是否被选中
const isSelected = computed(() => store.selectedSection?.id === props.section.id);

// 判断是否为空区域且没有子区域
const isEmptyWithoutChildren = computed(() => {
  return props.section.type === "empty" && 
         (!props.section.sections || props.section.sections.length === 0);
});

// 判断是否为空区域
const isEmpty = computed(() => props.section.type === "empty");

// 空区域是否已被分割（有子区域但本身仍是空区域）
const isEmptyWithChildren = computed(() => {
  return props.section.type === "empty" && 
         props.section.sections && 
         props.section.sections.length > 0;
});

// 高亮矩形配置
const highlightConfig = computed(() => 
  createHighlightConfig(props.section.width, props.section.height)
);

// 空区域提示样式
const emptyAreaStyle = computed(() => ({
  x: 0,
  y: 0,
  width: props.section.width,
  height: props.section.height,
  fill: 'rgba(240, 240, 240, 0.4)',
  stroke: '#e6a23c',
  strokeWidth: 2,
  dash: [10, 5],
  cornerRadius: 0
}));

// 恢复空区域提示文本样式
const emptyTextStyle = computed(() => ({
  text: '点击配置窗扇类型',
  fontFamily: 'Arial, sans-serif',
  fontSize: 12,
  fontStyle: 'bold',
  fill: '#e6a23c',
  align: 'center',
  width: props.section.width,
  verticalAlign: 'middle'
}));

// 图标样式
const configIconStyle = computed(() => ({
  width: 40,
  height: 40,
  x: props.section.width / 2 - 20,
  y: props.section.height / 2 - 40,
  fill: '#e6a23c',
  opacity: 0.8,
  cornerRadius: 5
}));

// 点击提示圆圈样式
const circleTipStyle = computed(() => ({
  x: props.section.width / 2,
  y: props.section.height / 2,
  radius: 20,
  fill: 'rgba(230, 162, 60, 0.1)',
  stroke: '#e6a23c',
  strokeWidth: 1,
}));

// 加号样式
const plusSignStyle = computed(() => ({
  x: props.section.width / 2,
  y: props.section.height / 2,
  data: 'M-10,0 L10,0 M0,-10 L0,10',
  stroke: '#e6a23c',
  strokeWidth: 2,
  lineCap: 'round',
}));

// 处理点击事件
const handleClick = (e: any) => {
  // 确保事件冒泡停止，避免舞台层捕获事件
  e.cancelBubble = true;
  
  // 即使点击子元素也选中当前区域
  store.selectedSectionId = props.section.id;
  
  // 阻止继续冒泡
  if (e.stopPropagation) {
    e.stopPropagation();
  }
};

// 计算子区域和分隔线
const childSections = computed(() => {
  const result = [];
  let offsetX = 0;
  let offsetY = 0;

  // 遍历子区域和分隔线
  for (const child of props.section.sections) {
    if (child.nodeType === 'section') {
      // 这是一个嵌套的区域
      result.push({
        type: 'section',
        section: child,
        x: offsetX,
        y: offsetY,
        key: child.id
      });
    } else {
      // 这是一个分隔线
      result.push({
        type: 'devider',
        width: child.width,
        height: child.height,
        x: offsetX,
        y: offsetY,
        key: child.id,
        id: child.id
      });
    }

    // 根据分割方向更新偏移量
    if (props.section.splitDirection === 'vertical') {
      offsetX += child.width;
    } else {
      offsetY += child.height;
    }
  }

  return result;
});
</script>

<template>
  <v-group 
    :x="x" 
    :y="y" 
    ref="groupRef"
    @click="handleClick"
    name="section"
  >
    <!-- 玻璃部分 - 特殊处理已分割的空区域 -->
    <Glass 
      :width="section.width" 
      :height="section.height" 
      :padding="section.frameSize" 
      :type="isEmptyWithChildren ? 'split-empty' : section.type"
    />
    
    <!-- 窗框 - 仅当不是空区域时显示 -->
    <Sash 
      v-if="!isEmpty"
      :width="section.width" 
      :height="section.height" 
      :size="section.frameSize" 
      :isRoot="false"
    />
    
    <!-- 开启方向 - 仅当不是空区域时显示 -->
    <OpeningDirection 
      v-if="!isEmpty"
      :width="section.width" 
      :height="section.height" 
      :padding="section.frameSize" 
      :type="section.type" 
    />
    
    <!-- 空区域提示 - 只在真正的空区域（没有子区域）显示 -->
    <template v-if="isEmptyWithoutChildren">
      <!-- 区域背景 -->
      <v-rect 
        :config="emptyAreaStyle"
      />
      
      <!-- 中心提示圆圈 -->
      <v-circle
        :config="circleTipStyle"
      />
      
      <!-- 添加加号图标 -->
      <v-path
        :config="plusSignStyle"
      />
      
      <!-- 提示文本 -->
      <v-text
        :x="0"
        :y="props.section.height / 2 + 50"
        v-bind="emptyTextStyle"
      />
    </template>
    
    <!-- 渲染子组件 -->
    <template v-for="child in childSections" :key="child.key">
      <!-- 子区域 -->
      <template v-if="child.type === 'section'">
        <Section 
          :section="child.section"
          :x="child.x"
          :y="child.y"
        />
      </template>
      
      <!-- 分隔线 -->
      <template v-else>
        <DeviderComponent 
          :width="child.width"
          :height="child.height"
          :x="child.x"
          :y="child.y"
          :id="child.id"
        />
      </template>
    </template>
    
    <!-- 选中高亮 -->
    <v-rect 
      v-if="isSelected" 
      v-bind="highlightConfig"
    />
    
    <!-- 把手 - 只有在不是空区域且有开启类型时显示 -->
    <Handle 
      v-if="!isEmpty"
      :width="section.width" 
      :height="section.height" 
      :padding="section.frameSize" 
      :type="section.type" 
    />
  </v-group>
</template> 