<script setup lang="ts">
// 分隔线组件 - 对应React版本中的Devider.jsx
import { computed, ref, onMounted, nextTick } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const store = useWindowDoorStore();
const deviderRef = ref<any>(null); // 使用any类型以访问Konva方法

const props = defineProps<{
  x: number;
  y: number;
  width: number;
  height: number;
  id: number;
}>();

// 计算分隔线的配置
const rectConfig = computed(() => ({
  x: props.x,
  y: props.y,
  width: props.width,
  height: props.height,
  fill: '#e8e8e8', // 更好看的填充色
  stroke: props.id === store.selectedDeviderId ? '#4a90e2' : '#999',
  strokeWidth: props.id === store.selectedDeviderId ? 2 : 1,
  id: `devider-${props.id}`, // 使用唯一ID以便于通过Konva API查找
  name: 'devider', // 使用name属性以便于选择所有中挺
  draggable: false,
  // 当鼠标悬停时显示手型指针
  listening: true
}));

watchEffect(() => {
  if (store.selectedDeviderId) {
    store.selectedDevider.splitDirection = store.selectedDevider.width > store.selectedDevider.height ? 'horizontal' : 'vertical';
    store.selectedDevider.x = props.x;
    store.selectedDevider.y = props.y;
  }
})

// 在组件挂载后更新中挺数据
onMounted(() => {
  nextTick(() => {
    if (deviderRef.value) {
      try {
        console.log(props);
        // 获取Konva对象 - konvaNode是Konva.Rect实例
        const konvaNode = deviderRef.value.getNode();
        
        // 将中挺数据与Konva节点关联
        konvaNode.setAttr('deviderId', props.id);
        
      } catch (error) {
        console.error('获取Konva节点失败:', error);
      }
    }
  });
});



// 处理点击事件
function handleClick(e: any) {
  // 阻止事件冒泡
  e.cancelBubble = true;
  
  try {
    // 获取Konva节点
    const node = e.target;
    const deviderId = node.getAttr('deviderId') || props.id;
    
    // 更新选中状态
    store.selectedDeviderId = deviderId;
    
    // 获取节点的绝对位置信息
    const absolutePosition = node.getAbsolutePosition();
    const stageInstance = node.getStage();
    const containerRect = stageInstance.container().getBoundingClientRect();
    
    // 日志输出中挺信息
    console.log(`选中中挺 #${deviderId}, 尺寸: ${props.width}x${props.height}`);
    console.log(`相对位置: (${node.x()}, ${node.y()}), 绝对位置: (${absolutePosition.x}, ${absolutePosition.y})`);
    console.log(`舞台位置: 左=${containerRect.left}, 上=${containerRect.top}, 变换: 缩放=${stageInstance.scaleX()}`);
  } catch (error) {
    console.error('处理点击事件失败:', error);
    // 如果出错，使用基本方法选中
    store.selectedDeviderId = props.id;
  }
}
</script>

<template>
  <v-group>
    <!-- 中挺主体 -->
    <v-rect ref="deviderRef" v-bind="rectConfig" @click="handleClick" />
    
    <!-- 如果被选中，显示选中指示器 -->
    <v-circle v-if="store.selectedDeviderId === props.id" :config="{
      x: props.x + props.width / 2,
      y: props.y + props.height / 2,
      radius: 6,
      fill: '#4a90e2',
      stroke: 'white',
      strokeWidth: 1,
      listening: false // 指示器不接收事件
    }" />
  </v-group>
</template> 