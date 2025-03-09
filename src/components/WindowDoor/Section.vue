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

// 高亮矩形配置
const highlightConfig = computed(() => 
  createHighlightConfig(props.section.width, props.section.height)
);

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
        key: child.id
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
    <!-- 玻璃部分 -->
    <Glass 
      :width="section.width" 
      :height="section.height" 
      :padding="section.frameSize" 
    />
    
    <!-- 窗框 -->
    <Sash 
      :width="section.width" 
      :height="section.height" 
      :size="section.frameSize" 
      :isRoot="false"
    />
    
    <!-- 开启方向 -->
    <OpeningDirection 
      :width="section.width" 
      :height="section.height" 
      :padding="section.frameSize" 
      :type="section.type" 
    />
    
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
        />
      </template>
    </template>
    
    <!-- 选中高亮 -->
    <v-rect 
      v-if="isSelected" 
      v-bind="highlightConfig"
    />
    
    <!-- 把手 - 放在最后，确保在最上层显示 -->
    <Handle 
      :width="section.width" 
      :height="section.height" 
      :padding="section.frameSize" 
      :type="section.type" 
    />
  </v-group>
</template> 