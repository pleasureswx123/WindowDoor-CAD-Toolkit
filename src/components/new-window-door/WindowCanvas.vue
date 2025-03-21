<template>
  <div 
    class="window-canvas" 
    ref="canvasContainer"
  >
    <v-stage ref="stageRef" :config="stageConfig" @click="handleStageClick" @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave">
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
              <component :is="component.component" :config="component.config" />
              
              <!-- 选中元素的高亮指示 -->
              <v-rect 
                v-if="isElementSelected(component.config.id)"
                :config="{
                  x: component.config.x,
                  y: component.config.y,
                  width: component.config.width,
                  height: component.config.height,
                  ...selectedBorderStyle,
                  cornerRadius: 2,
                  listening: false,
                  shadowEnabled: true,
                  shadowColor: 'rgba(0,0,0,0.3)',
                  shadowBlur: 10,
                  shadowOffset: { x: 0, y: 0 },
                  shadowOpacity: 1
                }"
              />
            </template>
          </v-group>
        </template>

        <!-- 分割预览线 -->
        <!-- 如果时activeTool为split，点击预览线允许穿透，执行stage上的click事件 -->
        <v-line v-if="showPreviewLine" :config="{
          points: previewLinePoints,
          stroke: '#f00',
          strokeWidth: 2,
          dash: [5, 5],
          listening: false
        }" />

        <!-- 中挺位置标注线和尺寸文本 -->
        <template v-if="selectedMuntin">
          <v-group>
            <v-group :config="{
              x: nodeAttrs.x - selectedMuntin.x,
              y: nodeAttrs.y - selectedMuntin.y
            }">
              <v-group :config="{
                x: selectedMuntin.x,
                y: selectedMuntin.y,
                width: selectedMuntin.width,
                height: selectedMuntin.height
              }">
                <annotation-marker 
                  :element="selectedMuntin" 
                  :is-horizontal="selectedMuntin.direction === 'horizontal'"
                  :parent-element="getParentElement(selectedMuntin.parentId)"
                  :line-color="annotationColor" 
                  :arrow-color="annotationColor" 
                  :text-color="annotationColor"
                />
              </v-group>
            </v-group>
          </v-group>
        </template>
      </v-layer>
    </v-stage>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRootWindowStore } from '../../stores/rootWindowStore';
import AnnotationMarker from './AnnotationMarker.vue';
import { WindowStructure, getElementById } from '../../utils/RootWindow';

// 获取窗户状态
const windowStore = useRootWindowStore();

// 添加这个接口定义来描述stage组件
interface KonvaStageRef {
  getStage: () => any;
  getNode: () => any;
}

interface KonvaLayerRef {
  getNode: () => any;
}

// 舞台引用
const stageRef = ref<KonvaStageRef | null>(null);
const layerRef = ref<KonvaLayerRef | null>(null);
const canvasContainer = ref<HTMLElement | null>(null); // 修复类型

// 调试标记
const showDebugInfo = ref(true); // 启用调试信息展示

// 预览线相关状态
const showPreviewLine = ref(false);
const previewLinePoints = ref<number[]>([0, 0, 0, 0]);

// 标注样式
const annotationColor = '#ff3333'; // 标注线条和文字颜色

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

// 根据activeTool返回对应的鼠标样式名称
const getCursorStyle = (tool?: string) => {
  const toolType = tool || windowStore.activeTool;
  switch (toolType) {
    case 'select':
      return 'pointer';
    case 'split':
      return 'crosshair';
    case 'sash':
      return 'cell';
    default:
      return 'default';
  }
};

// 更新鼠标样式
const updateCursorStyle = () => {
  if (stageRef.value) {
    const stage = stageRef.value.getStage();
    if (stage && stage.container()) {
      stage.container().style.cursor = getCursorStyle();
    }
  }
};

// 选中的中挺
const selectedMuntin = computed(() => {
  if (!windowStore.selectedElement || windowStore.selectedElement.ele !== 'window-muntin') {
    return null;
  }
  return Object.assign({}, windowStore.selectedElement);
});

// 选中的中挺1 (用于绘制)
const selectedMuntin1 = computed(() => {
  if (!windowStore.selectedElement || windowStore.selectedElement.ele !== 'window-muntin') {
    return null;
  }
  return Object.assign({}, windowStore.selectedElement, nodeAttrs.value);
});

// 判断选中的中挺是否是水平的
const isMuntinHorizontal = computed(() => {
  if (!selectedMuntin.value) return false;
  return selectedMuntin.value.direction === 'horizontal';
});

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

const nodeAttrs = ref({
  x: 0,
  y: 0,
});

// 监听工具变化以更新鼠标样式
watch(() => windowStore.activeTool, (newTool) => {
  // 更新鼠标样式
  updateCursorStyle();
  
  // 处理分割工具预览线
  if (newTool !== 'split') {
    showPreviewLine.value = false;
  }
});

// 点击事件处理
function handleStageClick(e: any) {
  const clickedNode = e.target;
  if (clickedNode && clickedNode.attrs && clickedNode.attrs.ele === 'window-muntin') {
    nodeAttrs.value = {
      x: clickedNode.attrs.x,
      y: clickedNode.attrs.y
    };
    // 获取中挺元素的客户端矩形信息（相对于舞台的绝对位置和尺寸）
    const clientRect = clickedNode.getClientRect();
    const pointer = clickedNode.getRelativePointerPosition();
    const absoluteTransform = clickedNode.getAbsoluteTransform();
    const position = clickedNode.position();
    const position1 = clickedNode.absolutePosition();

    console.log('=== 中挺位置信息 ===');
    console.log('元素ID:', clickedNode.id());
    console.log('客户端矩形:', clientRect); // 包含 x, y, width, height
    console.log('相对位置:', pointer);
    console.log('绝对变换:', absoluteTransform.m);
    console.log('相对位置:', position);
    console.log('原始属性11111:', clickedNode.attrs);
    console.log('绝对位置:', position1);

    // 获取相对于舞台的鼠标位置
    const stage = stageRef.value?.getStage();
    if (stage) {
      const stagePos = stage.getPointerPosition();
      const scalePos = {
        x: stagePos.x / scale.value,
        y: stagePos.y / scale.value
      };
      console.log('鼠标位置(舞台坐标系):', stagePos);
      console.log('鼠标位置(缩放后):', scalePos);
    }
  }

  let id = clickedNode.id();
  if (clickedNode && clickedNode.attrs && (clickedNode.attrs.ele || '').includes('window-sash')) {
    id = clickedNode.attrs.parentId;
  }
  if (id) {
    windowStore.setSelectedElement(id);
  } else {
    // 如果没有ID，则清除选择
    // setSelectedElement内部仅在id为truthy时才执行查找和设置，所以传入空字符串即可
    windowStore.setSelectedElement('');
  }

  if (windowStore.activeTool === 'select') {
    // 处理选择工具
    selectElement(clickedNode);
  } else if (windowStore.activeTool === 'split') {
    // 处理分割工具
    if (clickedNode?.attrs?.self?.splitArea) {
      clickedNode.attrs.self.splitArea(windowStore.splitDirection, clickedNode.getRelativePointerPosition());
      showPreviewLine.value = false;
    }
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

// 鼠标离开事件处理
function handleMouseLeave() {
  showPreviewLine.value = false;
}

// 选择元素
function selectElement(node: any) {
  // 如果没有点击到任何元素，或点击到的是舞台，清除选择
  if (!node || node.getClassName() === 'Stage') {
    console.log('清除选择');
    // 不能直接传null，因为setSelectedElement期望一个string类型的参数
    windowStore.setSelectedElement('');
    return;
  }

  // 获取节点ID和类型
  const id = node.id();
  const nodeType = node.getClassName();
  const nodeElement = node.attrs.ele || '';

  console.log("选中元素:", id, nodeType);
  console.log("元素类型:", nodeElement);

  // 设置选中元素的ID
  windowStore.setSelectedElement(id);

  // 处理中挺选择逻辑
  if (nodeElement === 'window-muntin') {
    console.log("选中了中挺元素:", node.attrs);

    // 获取中挺的位置和尺寸
    const position = node.position();
    const size = {
      width: node.width(),
      height: node.height()
    };

    console.log("中挺位置:", position);
    console.log("中挺尺寸:", size);

    // 如果中挺有变换，获取变换信息
    if (node.scaleX() !== 1 || node.scaleY() !== 1 || node.rotation() !== 0) {
      console.log("中挺变换:", {
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        rotation: node.rotation()
      });
    }

    // 获取相对于窗框的位置
    const absoluteRect = node.getClientRect();
    console.log("中挺绝对位置和尺寸:", absoluteRect);
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

// 当选中元素发生变化时，更新视图
watch(() => windowStore.selectedElement, (newVal, oldVal) => {
  console.log('选中元素变化，旧值:', oldVal, '新值:', newVal);

  // 刷新layer以显示标注
  nextTick(() => {
    if (layerRef.value) {
      console.log('刷新图层显示标注');
      const layer = layerRef.value.getNode();
      layer.batchDraw();

      // 强制延迟再次刷新一次，解决某些情况下标注不显示的问题
      setTimeout(() => {
        console.log('再次刷新图层以确保标注显示');
        layer.batchDraw();
      }, 100);
    }
  });
});

// 添加窗扇
function addSash() {
  if (!windowStore.windowStructure) return;
}

// 计算选中元素的边框样式
const selectedBorderStyle = computed(() => {
  if (!windowStore.selectedElement) return {};
  
  const elementType = windowStore.selectedElement.ele || '';
  
  // 根据元素类型返回不同的边框样式
  if (elementType === 'window-muntin') {
    return {
      stroke: 'red',
      strokeWidth: 3,
      dash: [10, 10]
    };
  } else if (elementType.includes('window-sash')) {
    return {
      stroke: 'red', // 绿色
      strokeWidth: 5,
      dash: [8, 3]
    };
  } else if (elementType === 'window-empty-area') {
    return {
      stroke: 'red',
      strokeWidth: 3,
      dash: [10, 10]
    };
  } else {
    return {
      stroke: 'red', // 紫色
      strokeWidth: 5,
      dash: [2, 2]
    };
  }
});

// 判断元素是否被选中
function isElementSelected(id: string): boolean {
  return windowStore.selectedElement && windowStore.selectedElement.id === id;
}

// 获取选中元素的样式
function getSelectedElementStyle(id: string) {
  if (isElementSelected(id)) {
    return selectedBorderStyle.value;
  }
  return null;
}

// 获取父元素数据，用于标注定位
function getParentElement(parentId: string) {
  if (!parentId) return null;
  
  // 从store获取窗户结构
  const windowStructure = windowStore.windowStructure;
  if (!windowStructure) return null;
  
  // 获取父元素
  const parentElement = getElementById(parentId);
  if (!parentElement) return null;
  
  // 返回父元素的定位和尺寸信息
  return {
    x: parentElement.x,
    y: parentElement.y,
    width: parentElement.width,
    height: parentElement.height,
    frameSize: parentElement.frameSize
  };
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

    // 强制刷新图层，确保标注显示
    if (layerRef.value) {
      layerRef.value.getNode().batchDraw();
    }
    
    // 初始化鼠标样式
    updateCursorStyle();
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