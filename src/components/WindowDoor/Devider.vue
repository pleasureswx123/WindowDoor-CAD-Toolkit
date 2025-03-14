<script setup lang="ts">
// 中挺组件 - 优化版本
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import { getKonvaNode, safePreventDefault, getKonvaAttr } from './utils/konvaHelper';

const props = defineProps<{
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}>();

// 获取窗户状态管理器
const store = useWindowDoorStore();

// 判断中挺方向
const isVertical = computed(() => props.width < props.height);
const dividerRef = ref<any>(null);
const groupRef = ref<any>(null);

// 是否正在拖拽中
const isDragging = ref(false);

// 中挺颜色配置 - 响应式属性
const dividerColors = ref({
  normal: '#e8e8e8',
  selected: '#4a90e2',
  border: {
    normal: '#999',
    selected: '#4a90e2'
  },
  highlight: 'rgba(74, 144, 226, 0.3)'
});

// 计算中挺是否被选中
const isSelected = computed(() => store.selectedDeviderId === props.id);

// 监听选中状态变化，如果被选中则提升层级
watch(() => store.selectedDeviderId, (newId) => {
  if (newId === props.id) {
    nextTick(() => {
      moveToTop();
    });
  }
});

// 将中挺移到顶层的公共函数
function moveToTop() {
  try {
    // 获取组Group节点提升到顶层
    const group = getKonvaNode(groupRef.value);
    if (group && typeof group.moveToTop === 'function') {
      group.moveToTop();
      
      // 获取图层并重绘
      const layer = group.getLayer();
      if (layer && typeof layer.batchDraw === 'function') {
        layer.batchDraw();
      }
    }
  } catch (error) {
    console.warn('提升中挺层级失败:', error);
  }
}

// 鼠标样式
const cursorStyle = computed(() => {
  if (isDragging.value) {
    return isVertical.value ? 'ew-resize' : 'ns-resize';
  }
  return isVertical.value ? 'col-resize' : 'row-resize';
});

// 显示中挺百分比位置
const positionLabel = ref('');
const showPositionLabel = ref(false);

// 更新位置标签
function updatePositionLabel(percentage: number) {
  positionLabel.value = `${Math.round(percentage)}%`;
  showPositionLabel.value = true;
}

// 计算位置标签配置
const positionLabelConfig = computed(() => {
  return {
    x: props.x + props.width / 2,
    y: props.y + props.height / 2 - 20,
    text: positionLabel.value,
    fontSize: 12,
    fontFamily: 'Arial',
    fill: '#333',
    padding: 4,
    align: 'center',
    verticalAlign: 'middle',
    listening: false,
    visible: showPositionLabel.value && isDragging.value,
    offsetX: 15,
    offsetY: 0,
    background: '#fff',
    cornerRadius: 3,
    shadowColor: 'black',
    shadowBlur: 4,
    shadowOffset: { x: 1, y: 1 },
    shadowOpacity: 0.2
  };
});

// 辅助线显示
const snapLines = ref({
  show: false,
  position: 0,
  isVertical: isVertical.value
});

// 计算辅助线配置
const snapLineConfig = computed(() => {
  // 水平或垂直线的绘制
  const points = isVertical.value 
    ? [0, 0, 0, store.root.height] // 垂直线
    : [0, 0, store.root.width, 0]; // 水平线
    
  return {
    points: points,
    stroke: '#4a90e2',
    strokeWidth: 1,
    dash: [5, 5],
    x: isVertical.value ? snapLines.value.position : 0,
    y: isVertical.value ? 0 : snapLines.value.position,
    listening: false,
    visible: snapLines.value.show && isDragging.value
  };
});

// 计算中挺点击区域的配置 - 透明背景更大区域用于点击
const hitAreaConfig = computed(() => {
  return {
    x: props.x - 10,
    y: props.y - 10,
    width: props.width + 20,
    height: props.height + 20,
    fill: 'transparent',
    opacity: 0.01,
    listening: true,
    perfectDrawEnabled: false, // 性能优化
  };
});

// 计算中挺主体的配置
const rectConfig = computed(() => {
  const lineColor = isSelected.value ? 
                   dividerColors.value.border.selected : 
                   dividerColors.value.border.normal;
  
  return {
    x: props.x,
    y: props.y,
    width: props.width,
    height: props.height,
    fill: isSelected.value ? dividerColors.value.selected : dividerColors.value.normal,
    stroke: lineColor,
    strokeWidth: isSelected.value ? 2 : 1,
    id: `devider-${props.id}`,
    deviderId: props.id,
    name: 'devider',
    draggable: true, // 允许拖拽
    // 拖拽约束函数 - 限制中挺只能在特定方向移动
    dragBoundFunc: function(pos: {x: number, y: number}): {x: number, y: number} {
      // 在Konva拖动函数中，this上下文指向Konva节点实例
      // 但在TypeScript中我们需要明确类型
      const node = this as any; // Konva节点
      
      // 在拖动过程中，我们尝试保持中挺在其指定方向上的坐标不变
      // 使用当前绝对位置而非props，确保坐标系一致性
      let currentY = props.y;
      let currentX = props.x;
      
      try {
        // 尝试获取节点的绝对位置，如果可用的话
        if (node && typeof node.getAbsolutePosition === 'function') {
          const absPos = node.getAbsolutePosition();
          currentX = absPos.x;
          currentY = absPos.y;
        }
      } catch (error) {
        console.log('获取节点位置失败，使用props坐标代替');
      }
      
      if (isVertical.value) {
        // 垂直中挺只能水平移动（x坐标跟随鼠标，y坐标固定）
        return {
          x: pos.x, // 允许水平方向移动
          y: currentY // 保持原始y坐标不变
        };
      } else {
        // 水平中挺只能垂直移动（y坐标跟随鼠标，x坐标固定）
        return {
          x: currentX, // 保持原始x坐标不变
          y: pos.y // 允许垂直方向移动
        };
      }
    },
    listening: true,
    cursor: cursorStyle.value,
    // 性能优化
    perfectDrawEnabled: false,
    transformsEnabled: 'position', // 只有位置信息变化
  };
});

// 计算选中指示器的配置
const selectionIndicatorConfig = computed(() => {
  return {
    x: props.x + props.width / 2,
    y: props.y + props.height / 2,
    radius: 6,
    fill: dividerColors.value.selected,
    stroke: 'white',
    strokeWidth: 1,
    listening: false,
    shadowColor: 'black',
    shadowBlur: 4,
    shadowOffset: { x: 1, y: 1 },
    shadowOpacity: 0.3,
    visible: isSelected.value
  };
});

// 计算拖拽手柄的配置
const dragHandleConfig = computed(() => {
  return {
    x: isVertical.value ? props.x + props.width / 2 - 10 : props.x + props.width / 2 - 30,
    y: isVertical.value ? props.y + props.height / 2 - 30 : props.y + props.height / 2 - 10,
    width: isVertical.value ? 20 : 60,
    height: isVertical.value ? 60 : 20,
    fill: dividerColors.value.highlight,
    stroke: dividerColors.value.selected,
    strokeWidth: 1,
    cornerRadius: 3,
    listening: false,
    shadowColor: 'black',
    shadowBlur: 2,
    shadowOffset: { x: 1, y: 1 },
    shadowOpacity: 0.2,
    visible: isSelected.value
  };
});

// 查找当前中挺的父区域 - 使用store提供的API
function findParentSection() {
  return store.findDeviderAndParent(store.root, props.id)?.parent || null;
}

// 检查是否有吸附点
function checkSnapping(percentage: number): number | null {
  const snapPercentages = store.getSnapPercentages?.() || [25, 33, 50, 66, 75];
  const threshold = 3; // 吸附阈值(百分比)
  
  // 查找最近的吸附点
  for (const snapValue of snapPercentages) {
    if (Math.abs(percentage - snapValue) <= threshold) {
      return snapValue;
    }
  }
  
  return null; // 没有找到吸附点
}

// 拖拽开始事件
function handleDragStart(e: any) {
  // 阻止事件冒泡和默认行为
  e.cancelBubble = true;
  safePreventDefault(e);
  
  // 切换为拖拽模式并禁用舞台拖拽
  store.stageDraggable = false;
  isDragging.value = true;
  
  // 选中中挺
  store.selectedDeviderId = props.id;
  
  try {
    // 获取Konva节点并提升到顶层
    const node = e.target;
    const group = node.getParent();
    if (group && typeof group.moveToTop === 'function') {
      group.moveToTop();
    }

    // 获取初始位置
    const startPos = {
      x: node.x(),
      y: node.y()
    };
    // 记录初始位置用于计算位移
    store.dragStartPos = startPos;
    
    // 记录当前节点的父区域
    const parentSection = findParentSection();
    if (parentSection) {
      store.dragParentSection = parentSection;
    }
    
    // 为拖拽期间禁用其他区域的点击监听，防止穿透
    try {
      const layer = group.getLayer();
      if (layer) {
        // 暂存当前层的选择状态
        layer._originalHitEnabled = layer.hitGraphEnabled();
        // 临时启用更精确的碰撞检测
        layer.hitGraphEnabled(true);
      }
    } catch (error) {
      console.warn('设置层碰撞检测失败:', error);
    }
  } catch (error) {
    console.error('拖拽开始事件处理错误:', error);
  }
}

// 拖拽中事件
function handleDragMove(e: any) {
  // 阻止事件冒泡和默认行为
  e.cancelBubble = true;
  safePreventDefault(e);
  
  try {
    // 获取Konva节点
    const node = e.target;
    const currentPos = {
      x: node.x(),
      y: node.y()
    };
    
    // 计算中挺在父容器中的相对位置（百分比）
    if (store.dragParentSection) {
      // 获取父区域
      const parent = store.dragParentSection;
      
      // 计算相对位置
      let percentage = 0;
      
      if (isVertical.value) {
        // 垂直中挺 - 计算水平方向位置百分比
        // 计算中挺相对于父区域左边界的偏移量
        const offsetFromLeft = currentPos.x - parent.x;
        // 计算相对父区域宽度的百分比
        percentage = (offsetFromLeft / parent.width) * 100;
      } else {
        // 水平中挺 - 计算垂直方向位置百分比
        // 计算中挺相对于父区域顶部边界的偏移量
        const offsetFromTop = currentPos.y - parent.y;
        // 计算相对父区域高度的百分比
        percentage = (offsetFromTop / parent.height) * 100;
      }
      
      // 限制百分比在有效范围内 (10%-90%)
      percentage = Math.max(10, Math.min(90, percentage));
      
      // 更新位置标签
      updatePositionLabel(percentage);
      
      // 检查是否有吸附点
      const snapValue = checkSnapping(percentage);
      if (snapValue !== null) {
        // 显示吸附辅助线
        snapLines.value.show = true;
        
        // 计算吸附线位置
        if (isVertical.value) {
          // 垂直中挺 - 计算水平方向吸附线位置
          snapLines.value.position = parent.x + (parent.width * snapValue / 100);
        } else {
          // 水平中挺 - 计算垂直方向吸附线位置
          snapLines.value.position = parent.y + (parent.height * snapValue / 100);
        }
      } else {
        // 隐藏吸附辅助线
        snapLines.value.show = false;
      }
    }
  } catch (error) {
    console.error('拖拽移动事件处理错误:', error);
  }
}

// 拖拽结束事件
function handleDragEnd(e: any) {
  // 阻止事件冒泡和默认行为
  e.cancelBubble = true;
  safePreventDefault(e);
  
  // 恢复状态
  store.stageDraggable = true;
  isDragging.value = false;
  showPositionLabel.value = false;
  snapLines.value.show = false;
  
  try {
    // 获取Konva节点
    const node = e.target;
    const group = node.getParent();
    
    // 恢复层的原始碰撞检测状态
    try {
      const layer = group.getLayer();
      if (layer && layer._originalHitEnabled !== undefined) {
        layer.hitGraphEnabled(layer._originalHitEnabled);
        delete layer._originalHitEnabled;
      }
    } catch (error) {
      console.warn('恢复层碰撞检测失败:', error);
    }
    
    // 获取当前位置
    const endPos = {
      x: node.x(),
      y: node.y()
    };
    
    // 计算中挺在父容器中的相对位置（百分比）
    if (store.dragParentSection) {
      // 获取父区域
      const parent = store.dragParentSection;
      
      // 计算相对位置
      let percentage = 0;
      
      if (isVertical.value) {
        // 垂直中挺 - 计算水平方向位置百分比
        // 计算中挺相对于父区域左边界的偏移量
        const offsetFromLeft = endPos.x - parent.x;
        // 计算相对父区域宽度的百分比
        percentage = (offsetFromLeft / parent.width) * 100;
      } else {
        // 水平中挺 - 计算垂直方向位置百分比
        // 计算中挺相对于父区域顶部边界的偏移量
        const offsetFromTop = endPos.y - parent.y;
        // 计算相对父区域高度的百分比
        percentage = (offsetFromTop / parent.height) * 100;
      }
      
      // 限制百分比在有效范围内 (10%-90%)
      percentage = Math.max(10, Math.min(90, percentage));
      
      // 检查是否有吸附点并使用吸附值
      const snapValue = checkSnapping(percentage);
      if (snapValue !== null) {
        percentage = snapValue;
      }
      
      // 更新中挺位置
      store.updateDeviderPosition(props.id, percentage);
      
      // 强制重绘
      if (group && group.getLayer()) {
        group.getLayer().batchDraw();
      }
    }
    
    // 清除拖拽状态
    store.dragStartPos = null;
    store.dragParentSection = null;
  } catch (error) {
    console.error('拖拽结束事件处理错误:', error);
  }
}

// 处理鼠标进入事件
function handleMouseEnter(e: any) {
  e.cancelBubble = true;
  safePreventDefault(e);
  
  try {
    // 更新鼠标样式
    const stage = e.target.getStage();
    if (stage && stage.container) {
      stage.container().style.cursor = cursorStyle.value;
    }
  } catch (error) {
    console.warn('设置鼠标样式失败:', error);
  }
}

// 处理鼠标离开事件
function handleMouseLeave(e: any) {
  e.cancelBubble = true;
  safePreventDefault(e);
  
  // 只有在非拖拽状态下才恢复鼠标样式
  if (!isDragging.value) {
    try {
      const stage = e.target.getStage();
      if (stage && stage.container) {
        stage.container().style.cursor = 'default';
      }
    } catch (error) {
      console.warn('恢复鼠标样式失败:', error);
    }
  }
}

// 点击事件 - 确保被选中
function handleClick(e: any) {
  e.cancelBubble = true;
  safePreventDefault(e);
  
  // 选中中挺
  store.selectedDeviderId = props.id;
  
  // 提升到顶层
  moveToTop();
}

// 双击事件 - 可以打开属性编辑对话框
function handleDoubleClick(e: any) {
  e.cancelBubble = true;
  safePreventDefault(e);
  
  // 选中中挺
  store.selectedDeviderId = props.id;
  
  // 这里可以触发打开属性编辑对话框
  // store.openDeviderPropertiesDialog?.(props.id);
}

// 组件挂载后设置初始状态
onMounted(() => {
  nextTick(() => {
    // 如果这个中挺被选中，提升它的层级
    if (store.selectedDeviderId === props.id) {
      moveToTop();
    }
  });
});

// 组件卸载前清理
onUnmounted(() => {
  // 清理任何可能的引用或事件监听
  if (isDragging.value) {
    store.stageDraggable = true;
  }
  
  // 如果当前中挺被选中，取消选中
  if (store.selectedDeviderId === props.id) {
    store.selectedDeviderId = null;
  }
});
</script>

<template>
  <v-group ref="groupRef" @click="handleClick" @dblclick="handleDoubleClick">
    <!-- 透明的背景矩形 - 仅用于扩大点击区域，提高可用性 -->
    <v-rect 
      :config="hitAreaConfig"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @click="handleClick"
    />
    
    <!-- 中挺主体 - 配置了拖拽相关事件 -->
    <v-rect 
      ref="dividerRef" 
      :config="rectConfig"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @mousedown="handleDragStart"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    />

    <!-- 选中指示器 - 使用计算属性控制显示 -->
    <v-circle :config="selectionIndicatorConfig" />
    
    <!-- 拖拽手柄 - 使用计算属性控制显示 -->
    <v-rect :config="dragHandleConfig" />
    
    <!-- 拖拽过程中显示位置百分比 -->
    <v-text :config="positionLabelConfig" />
    
    <!-- 吸附辅助线 -->
    <v-line :config="snapLineConfig" />
  </v-group>
</template> 