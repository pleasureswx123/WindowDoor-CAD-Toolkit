<template>
  <div class="window-canvas" ref="canvasContainer">
    <v-stage ref="stageRef" :config="stageConfig" @click="handleStageClick" @mousemove="handleMouseMove">
      <v-layer ref="layerRef">
        <!-- 调试信息 -->
        <v-text v-if="showDebugInfo" :config="{ 
          x: 10, 
          y: 10, 
          text: `Components: ${windowComponents.length}`, 
          fontSize: 14, 
          fill: 'red' 
        }" />
        
        <!-- 渲染窗户结构 -->
        <template v-if="windowComponents.length > 0">
          <v-group :config="{ x: 0, y: 0 }">
            <template v-for="(component, index) in flattenComponents" :key="index">
              <component 
                :is="component.component" 
                :config="component.config"
              />
            </template>
          </v-group>
        </template>

        <!-- 分割预览线 -->
        <v-line 
          v-if="showPreviewLine"
          :config="{
            points: previewLinePoints,
            stroke: '#f00',
            strokeWidth: 2,
            dash: [5, 5]
          }"
        />
      </v-layer>
    </v-stage>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRootWindowStore } from '../../stores/rootWindowStore';

// 获取窗户状态
const windowStore = useRootWindowStore();

// 添加这个接口定义来描述stage组件
interface KonvaStageRef {
  getStage: () => any;
  getNode: () => any;
}

// 舞台引用
const stageRef = ref<KonvaStageRef | null>(null);
const layerRef = ref(null);
const canvasContainer = ref<HTMLElement | null>(null); // 修复类型

// 调试标记
const showDebugInfo = ref(true); // 启用调试信息展示

// 预览线相关状态
const showPreviewLine = ref(false);
const previewLinePoints = ref<number[]>([0, 0, 0, 0]);

// 舞台配置
const stageConfig = computed(() => {
  return {
    width: Math.max(500, windowStore.windowConfig.width * scale.value),
    height: Math.max(500, windowStore.windowConfig.height * scale.value),
    scaleX: scale.value,
    scaleY: scale.value
  };
});

// 缩放比例
const scale = ref(0.5);

// 窗户组件
const windowComponents = computed(() => {
  if (!windowStore.windowStructure) {
    console.log("窗户结构不存在");
    return [];
  }
  
  try {
    // 转换WindowStructure的render输出为v-组件配置
    const renderConfig = windowStore.windowStructure.render();
    console.log("窗户渲染配置:", renderConfig);
    return [renderConfig];
  } catch (error) {
    console.error("渲染窗户结构时出错:", error);
    return [];
  }
});

// 展平组件树，使所有组件平铺渲染
const flattenComponents = computed(() => {
  const result: any[] = [];

  function flatten(component: any, parentX = 0, parentY = 0) {
    if (!component) return;
    
    // 处理当前组件
    const newConfig = {
      ...component.config,
      x: (component.config.x || 0) + parentX,
      y: (component.config.y || 0) + parentY
    };
    
    result.push({
      component: component.component,
      config: newConfig
    });
    
    // 处理子组件
    if (component.children && component.children.length > 0) {
      component.children.forEach((child: any) => {
        flatten(child, newConfig.x, newConfig.y);
      });
    }
  }
  
  windowComponents.value.forEach(comp => flatten(comp));
  console.log("展平组件树:", result);
  return result;
});

// 当窗口尺寸变化时更新画布大小
watch(() => [windowStore.windowConfig.width, windowStore.windowConfig.height], () => {
  updateCanvasSize();
});

// 点击事件处理
function handleStageClick(e: any) {
  const clickedNode = e.target;
  windowStore.setSelectedElement(clickedNode.id());
  const clickPoint = {
    x: e.evt.offsetX / scale.value,
    y: e.evt.offsetY / scale.value
  };
  
  console.log("点击坐标:", clickPoint, "点击节点:", clickedNode.getClassName());
  
  if (windowStore.activeTool === 'select') {
    // 处理选择工具
    selectElement(clickedNode);
  } else if (windowStore.activeTool === 'split') {
    // 处理分割工具
    splitElementAtPoint(clickPoint);
  } else if (windowStore.activeTool === 'sash') {
    // 处理窗扇工具
    windowStore.addSash();
  }
}

// 鼠标移动事件处理
function handleMouseMove(e: any) {
  if (windowStore.activeTool === 'split') {
    // 更新分割预览线
    showSplitPreview(e);
  }
}

// 选择元素
function selectElement(node: any) {
  // 实现元素选择逻辑
  const id = node.id();
  const nodeType = node.getClassName();
  console.log("选中元素:", id, nodeType, node.attrs, windowStore.selectedElement);
}

// 在指定点分割元素
function splitElementAtPoint(point: { x: number, y: number }) {
  if (!windowStore.windowStructure) return;
  console.log("分割元素:", windowStore.splitDirection, point);
  // 找到点所在的区域
  const targetArea: any = windowStore.selectedElement;
  if (targetArea) {
    console.log("发现目标区域:", targetArea.id);
    try {
      // 默认在中心位置分割
      let position = 50;
      
      // 根据分割方向和点击位置计算分割位置的百分比
      if (windowStore.splitDirection === 'vertical') {
        // 垂直分割，计算水平位置百分比
        position = ((point.x - targetArea.x) / targetArea.width) * 100;
      } else {
        // 水平分割，计算垂直位置百分比
        position = ((point.y - targetArea.y) / targetArea.height) * 100;
      }
      
      // 确保分割位置在有效范围内
      position = Math.max(20, Math.min(80, position));
      
      console.log(`执行${windowStore.splitDirection}分割，位置:${position}%`);
      windowStore.splitArea(position);
      
      // 分割后隐藏预览线
      showPreviewLine.value = false;
    } catch (err) {
      console.error("分割区域时出错:", err);
    }
  } else {
    console.warn("未找到可分割的区域");
  }
}

// 实现分割预览线显示
function showSplitPreview(e: any) {
  if (!windowStore.windowStructure || !stageRef.value) return;
  
  const stage = stageRef.value.getStage();
  const pointerPos = stage.getPointerPosition();
  if (!pointerPos) return;
  
  const x = pointerPos.x / scale.value;
  const y = pointerPos.y / scale.value;
  
  // 根据分割方向显示不同的预览线
  if (windowStore.splitDirection === 'vertical') {
    // 垂直分割线
    previewLinePoints.value = [
      x, 0,
      x, windowStore.windowConfig.height
    ];
  } else {
    // 水平分割线
    previewLinePoints.value = [
      0, y,
      windowStore.windowConfig.width, y
    ];
  }
  
  showPreviewLine.value = true;
}

// 更新画布大小
function updateCanvasSize() {
  if (!canvasContainer.value) {
    console.log("容器引用不存在");
    return;
  }
  
  const containerWidth = canvasContainer.value.clientWidth || 800;
  const containerHeight = canvasContainer.value.clientHeight || 600;
  console.log("容器尺寸:", containerWidth, containerHeight);
  
  // 计算合适的缩放比例
  const windowWidth = windowStore.windowConfig.width;
  const windowHeight = windowStore.windowConfig.height;
  
  const scaleX = (containerWidth - 40) / windowWidth;
  const scaleY = (containerHeight - 40) / windowHeight;
  
  // 使用较小的缩放比例，确保窗户完全可见
  scale.value = Math.min(scaleX, scaleY, 1) || 0.5;
  console.log("计算的缩放比例:", scale.value);
}

// 初始化
onMounted(() => {
  console.log("WindowCanvas组件已挂载");
  
  // 初始化窗户
  windowStore.initializeWindow();
  console.log("窗户已初始化:", windowStore.windowStructure);
  
  // 确保DOM已完全渲染
  nextTick(() => {
    // 更新画布大小
    updateCanvasSize();
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateCanvasSize);
  });
});

</script>

<style scoped>
.window-canvas {
  flex: 1;
  background: #e0e0e0;
  overflow: hidden;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>