<script setup lang="ts">
// 窗框组件 - 对应React版本中的Sash.jsx
import { computed, ref } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import PopupInput from './utils/PopupInput.vue';

const props = defineProps<{
  width: number;
  height: number;
  size: number;
  isRoot?: boolean; // 添加属性区分是根窗户框架还是窗扇框架
}>();

const store = useWindowDoorStore();
const showPopup = ref(false);
const popupPosition = ref({ x: 0, y: 0 });
const popupSize = ref({ width: 100, height: 40 });
const isHovered = ref(false);

// 通用的线条属性
const lineProps = computed(() => ({
  closed: true,
  stroke: 'black',
  strokeWidth: 1,
  // 解决遮挡问题：使用透明填充或完全去除填充
  fill: isHovered.value ? 'rgba(240,249,255,0.3)' : 'transparent',
  listening: true, // 确保能接收点击事件
  shadowBlur: isHovered.value ? 4 : 0,
  shadowColor: isHovered.value ? '#1890ff' : 'transparent'
}));

// 上框线条点
const topLinePoints = computed(() => [
  0, 0, 
  props.width, 0, 
  props.width - props.size, props.size, 
  props.size, props.size
]);

// 左框线条点
const leftLinePoints = computed(() => [
  0, 0, 
  props.size, props.size, 
  props.size, props.height - props.size, 
  0, props.height
]);

// 下框线条点
const bottomLinePoints = computed(() => [
  0, props.height,
  props.size, props.height - props.size,
  props.width - props.size, props.height - props.size,
  props.width, props.height
]);

// 右框线条点
const rightLinePoints = computed(() => [
  props.width, 0,
  props.width, props.height,
  props.width - props.size, props.height - props.size,
  props.width - props.size, props.size
]);

// 处理点击事件
const handleClick = (e: any) => {
  // 设置弹出框位置
  const stage = e.target.getStage();
  const pos = stage.getPointerPosition();
  
  popupPosition.value = {
    x: pos.x,
    y: pos.y
  };
  
  // 设置弹出框大小
  popupSize.value = {
    width: 150,
    height: 40
  };
  
  // 显示弹出框
  showPopup.value = true;
};

// 鼠标进入
const handleMouseEnter = () => {
  isHovered.value = true;
  document.body.style.cursor = 'pointer';
};

// 鼠标离开
const handleMouseLeave = () => {
  isHovered.value = false;
  document.body.style.cursor = 'default';
};

// 关闭弹出框
const closePopup = () => {
  showPopup.value = false;
};

// 更新框架尺寸
const updateFrameSize = (newSize: number) => {
  // 根据isRoot属性决定更新哪种框架尺寸
  if (props.isRoot) {
    store.updateFrameSize(newSize, 'root');
  } else {
    store.updateFrameSize(newSize, 'section');
  }
  showPopup.value = false;
};

// 弹窗标题
const popupTitle = computed(() => {
  return props.isRoot ? '调整窗户外框厚度' : '调整窗扇框架厚度';
});
</script>

<template>
  <v-group 
    :name="isRoot ? 'root-sash' : 'section-sash'"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
  >
    <v-line v-bind="lineProps" :points="topLinePoints" />
    <v-line v-bind="lineProps" :points="leftLinePoints" />
    <v-line v-bind="lineProps" :points="bottomLinePoints" />
    <v-line v-bind="lineProps" :points="rightLinePoints" />
  </v-group>
  
  <!-- 弹出输入框 -->
  <teleport to="body" v-if="showPopup">
    <PopupInput
      :initialValue="size"
      :position="popupPosition"
      :size="popupSize"
      :title="popupTitle"
      :min="10"
      :max="200"
      :step="5"
      @update="updateFrameSize"
      @close="closePopup"
    />
  </teleport>
</template> 