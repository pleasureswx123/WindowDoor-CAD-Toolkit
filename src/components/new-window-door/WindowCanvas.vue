<template>
  <div 
    class="window-canvas" 
    ref="canvasContainer"
  >
    <v-stage 
      ref="stageRef" 
      :config="stageConfig" 
      @click="handleStageClick" 
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @wheel="handleWheel"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
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
    
    <!-- 添加舞台预览 -->
    <div class="stage-preview" v-if="showPreview">
      <img 
        :src="previewUrl" 
        alt="舞台预览"
        class="preview-image"
        @click="togglePreviewSize"
        :class="{ 'preview-large': isPreviewLarge }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, reactive } from 'vue';
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

// 预览相关状态
const showPreview = ref(true); // 是否显示预览
const previewUrl = ref(''); // 预览图URL
const isPreviewLarge = ref(false); // 预览是否放大

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
    scaleY: scale.value,
    x: stagePosition.x,
    y: stagePosition.y,
    draggable: windowStore.activeTool === 'pan',
  };
});

// 缩放比例
const scale = ref(windowStore.viewState.scale);

// 舞台位置
const stagePosition = reactive({
  x: windowStore.viewState.x,
  y: windowStore.viewState.y
});

// 处理平移、缩放相关状态
const isPanning = ref(false);
const lastMousePos = ref({ x: 0, y: 0 });
const lastTouchCenter = ref({ x: 0, y: 0 });
const lastTouchDistance = ref(0);

// 根据activeTool返回对应的鼠标样式名称
const getCursorStyle = (tool?: string) => {
  const toolType = tool || windowStore.activeTool;
  switch (toolType) {
    case 'select':
      return 'pointer';
    case 'split':
      return 'crosshair';
    case 'sash':
      return 'copy';
    case 'pan':
      return 'grab';
    case 'zoomIn':
      return 'zoom-in';
    case 'zoomOut':
      return 'zoom-out';
    default:
      return 'default';
  }
};

// 更新鼠标样式，支持自定义光标
const updateCursorStyle = () => {
  if (stageRef.value) {
    const stage = stageRef.value.getStage();
    if (stage && stage.container()) {
      const tool = windowStore.activeTool;
      
      // 使用自定义光标图像
      if (tool === 'sash') {
        // 可以使用base64编码的图像或相对路径
        // stage.container().style.cursor = `url('/images/sash-cursor.png'), copy`;
        
        // 暂时使用CSS自带的光标
        stage.container().style.cursor = getCursorStyle();
      } else {
        stage.container().style.cursor = getCursorStyle();
      }
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

// 监听工具变化以更新鼠标样式和状态
watch(() => windowStore.activeTool, (newTool) => {
  // 更新鼠标样式
  updateCursorStyle();
  
  // 处理分割工具预览线
  if (newTool !== 'split') {
    showPreviewLine.value = false;
  }
  
  // 响应工具变化
  if (newTool === 'zoomIn') {
    zoomIn();
  } else if (newTool === 'zoomOut') {
    zoomOut();
  }
});

// 监听视图重置请求
watch(() => windowStore.viewState.resetRequested, (requested) => {
  if (requested) {
    resetView();
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
  } else if (windowStore.activeTool === 'pan' && isPanning.value) {
    // 处理平移逻辑
    const stage = stageRef.value?.getStage();
    if (stage) {
      const pos = stage.getPointerPosition();
      if (pos && lastMousePos.value) {
        const dx = pos.x - lastMousePos.value.x;
        const dy = pos.y - lastMousePos.value.y;
        
        stagePosition.x += dx;
        stagePosition.y += dy;
        
        // 更新windowStore中的视图状态
        windowStore.viewState.x = stagePosition.x;
        windowStore.viewState.y = stagePosition.y;
        
        lastMousePos.value = { x: pos.x, y: pos.y };
      }
    }
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

// 处理鼠标按下事件
function handleMouseDown(e: any) {
  if (windowStore.activeTool === 'pan') {
    isPanning.value = true;
    
    // 更新鼠标样式为抓取中
    if (stageRef.value) {
      const stage = stageRef.value.getStage();
      if (stage && stage.container()) {
        stage.container().style.cursor = 'grabbing';
      }
    }
    
    // 记录鼠标位置
    const stage = stageRef.value?.getStage();
    if (stage) {
      const pos = stage.getPointerPosition();
      if (pos) {
        lastMousePos.value = { x: pos.x, y: pos.y };
      }
    }
  }
}

// 处理鼠标抬起事件
function handleMouseUp(e: any) {
  if (windowStore.activeTool === 'pan') {
    isPanning.value = false;
    
    // 恢复鼠标样式
    if (stageRef.value) {
      const stage = stageRef.value.getStage();
      if (stage && stage.container()) {
        stage.container().style.cursor = 'grab';
      }
    }
    
    // 更新预览
    updatePreview();
  }
}

// 处理滚轮事件，实现缩放
function handleWheel(e: any) {
  e.evt.preventDefault();
  
  const stage = stageRef.value?.getStage();
  if (!stage) return;
  
  const oldScale = scale.value;
  const pointer = stage.getPointerPosition();
  
  if (!pointer) return;
  
  // 计算鼠标位置相对于舞台的坐标
  const mousePointTo = {
    x: (pointer.x - stagePosition.x) / oldScale,
    y: (pointer.y - stagePosition.y) / oldScale
  };
  
  // 根据滚轮方向调整缩放比例
  const scaleBy = 1.1;
  const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
  
  // 限制缩放范围
  scale.value = Math.max(0.1, Math.min(2, newScale));
  
  // 更新windowStore中的视图状态
  windowStore.viewState.scale = scale.value;
  
  // 计算新的舞台位置
  stagePosition.x = pointer.x - mousePointTo.x * scale.value;
  stagePosition.y = pointer.y - mousePointTo.y * scale.value;
  
  // 更新windowStore中的视图状态
  windowStore.viewState.x = stagePosition.x;
  windowStore.viewState.y = stagePosition.y;
  
  // 更新预览 - 使用requestAnimationFrame防止频繁更新
  if (!window.requestAnimationFrame) {
    updatePreview();
  } else {
    requestAnimationFrame(updatePreview);
  }
}

// 处理触摸开始事件
function handleTouchStart(e: any) {
  const touches = e.evt.touches;
  
  // 处理双指触摸（缩放）
  if (touches.length === 2) {
    // 阻止默认行为（如页面缩放）
    e.evt.preventDefault();
    
    // 计算两指的中心点
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    const center = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
    
    // 计算两指的距离
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
    
    lastTouchCenter.value = center;
    lastTouchDistance.value = distance;
  }
}

// 处理触摸移动事件
function handleTouchMove(e: any) {
  const touches = e.evt.touches;
  
  // 处理双指触摸（缩放）
  if (touches.length === 2) {
    // 阻止默认行为
    e.evt.preventDefault();
    
    const stage = stageRef.value?.getStage();
    if (!stage) return;
    
    // 计算两指的中心点
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    const center = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
    
    // 计算两指的距离
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
    
    // 如果有上一次的距离记录，计算缩放比例变化
    if (lastTouchDistance.value > 0) {
      // 计算触摸点相对于舞台的坐标
      const oldScale = scale.value;
      
      // 计算触摸中心点相对于舞台的坐标
      const mousePointTo = {
        x: (center.x - stagePosition.x) / oldScale,
        y: (center.y - stagePosition.y) / oldScale
      };
      
      // 计算新的缩放比例
      const scaleFactor = distance / lastTouchDistance.value;
      const newScale = oldScale * scaleFactor;
      
      // 限制缩放范围
      scale.value = Math.max(0.1, Math.min(2, newScale));
      
      // 更新windowStore中的视图状态
      windowStore.viewState.scale = scale.value;
      
      // 计算新的舞台位置
      stagePosition.x = center.x - mousePointTo.x * scale.value;
      stagePosition.y = center.y - mousePointTo.y * scale.value;
      
      // 更新windowStore中的视图状态
      windowStore.viewState.x = stagePosition.x;
      windowStore.viewState.y = stagePosition.y;
    }
    
    // 记录本次触摸状态
    lastTouchCenter.value = center;
    lastTouchDistance.value = distance;
  }
}

// 处理触摸结束事件
function handleTouchEnd(e: any) {
  // 重置触摸状态
  if (e.evt.touches.length < 2) {
    lastTouchDistance.value = 0;
  }
}

// 放大功能
function zoomIn() {
  const scaleBy = 1.1;
  const newScale = scale.value * scaleBy;
  
  // 限制缩放范围
  scale.value = Math.min(2, newScale);
  
  // 更新windowStore中的视图状态
  windowStore.viewState.scale = scale.value;
  
  // 切换回选择工具
  windowStore.activeTool = 'select';
}

// 缩小功能
function zoomOut() {
  const scaleBy = 1.1;
  const newScale = scale.value / scaleBy;
  
  // 限制缩放范围
  scale.value = Math.max(0.1, newScale);
  
  // 更新windowStore中的视图状态
  windowStore.viewState.scale = scale.value;
  
  // 切换回选择工具
  windowStore.activeTool = 'select';
}

// 重置视图
function resetView() {
  scale.value = 0.5;
  stagePosition.x = 0;
  stagePosition.y = 0;
  
  // 强制刷新
  if (layerRef.value) {
    layerRef.value.getNode().batchDraw();
  }
}

// 更新预览图
function updatePreview() {
  if (!stageRef.value) return;
  
  // 使用1/6的比例生成预览图
  const scale = 1 / 6;
  
  try {
    // 获取舞台的DataURL
    const url = stageRef.value.getNode().toDataURL({
      pixelRatio: scale,
      mimeType: 'image/jpeg',
      quality: 0.8
    });
    
    // 更新预览图URL
    previewUrl.value = url;
  } catch (error) {
    console.error('生成预览图失败:', error);
  }
}

// 切换预览图大小
function togglePreviewSize() {
  isPreviewLarge.value = !isPreviewLarge.value;
}

// 监听窗户结构变化，更新预览
watch(() => windowComponents.value.length, () => {
  nextTick(() => {
    updatePreview();
  });
});

// 监听缩放和位置变化，更新预览
watch([() => scale.value, () => stagePosition.x, () => stagePosition.y], () => {
  nextTick(() => {
    updatePreview();
  });
});

// 监听选中元素变化，更新预览
watch(() => windowStore.selectedElement, () => {
  nextTick(() => {
    updatePreview();
  });
});

// 在任何可能改变舞台内容或视图的事件后更新预览
const handleZoomOrPanComplete = () => {
  updatePreview();
};

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
    window.addEventListener('resize', () => {
      updateCanvasSize();
      updatePreview();
    });

    // 强制刷新图层，确保标注显示
    if (layerRef.value) {
      layerRef.value.getNode().batchDraw();
    }
    
    // 初始化鼠标样式
    updateCursorStyle();
    
    // 生成初始预览图
    updatePreview();
    
    // 添加导出图片功能
    // 监听由ToolBar组件发出的导出图片事件
    window.addEventListener('export-canvas-image', (e: any) => {
      if (stageRef.value) {
        try {
          // 使用e.detail中提供的参数生成图片
          const exportOptions = e.detail || {};
          const dataURL = stageRef.value.getNode().toDataURL({
            mimeType: exportOptions.mimeType || 'image/png',
            quality: exportOptions.quality || 0.9,
            pixelRatio: exportOptions.pixelRatio || 1,
            backgroundColor: exportOptions.backgroundColor
          });
          
          // 将生成的图片URL发送回去
          window.dispatchEvent(new CustomEvent('canvas-image-ready', {
            detail: { dataURL }
          }));
        } catch (error) {
          console.error('生成图片失败:', error);
          window.dispatchEvent(new CustomEvent('canvas-image-error', {
            detail: { error: error instanceof Error ? error.message : String(error) }
          }));
        }
      }
    });
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
  position: relative;
}

.stage-preview {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  border: 2px solid #333;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  background-color: white;
}

.preview-image {
  display: block;
  max-width: 200px;
  max-height: 150px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.preview-large {
  max-width: 300px;
  max-height: 225px;
}
</style>