<template>
  <div class="three-js-window" ref="container">
    <!-- 加载状态指示器 -->
    <div class="loading-overlay" v-if="isLoading">
      <el-icon class="is-loading"><loading /></el-icon>
      <span>正在渲染3D模型...</span>
    </div>
    
    <!-- 控制面板 -->
    <div class="controls-panel" v-show="!isLoading">
      <div class="control-buttons">
        <el-tooltip content="重置视图" placement="top">
          <el-button circle size="small" @click="resetCamera">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-tooltip content="切换窗户开关状态" placement="top">
          <el-button circle size="small" @click="toggleWindowOpen">
            <el-icon><SwitchButton /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
      
      <div class="animation-speed" v-if="showAnimationControls">
        <span>动画速度:</span>
        <el-slider v-model="animationSpeed" :min="0.5" :max="3" :step="0.1" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSG } from 'three-csg-ts';
import { useRootWindowStore } from '@/stores/rootWindowStore';
import { Refresh, Loading, SwitchButton } from '@element-plus/icons-vue';

// Props定义
const props = defineProps({
  width: {
    type: Number,
    default: 800
  },
  height: {
    type: Number,
    default: 600
  }
});

// 状态管理
const windowStore = useRootWindowStore();
const container = ref<HTMLElement | null>(null);
const isLoading = ref(true);
const showAnimationControls = ref(false);
const animationSpeed = ref(1.0);
const isWindowOpen = ref(false);

// Three.js相关变量
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let windowGroup: THREE.Group;
let animationMixers: THREE.AnimationMixer[] = [];
let clock: THREE.Clock;
let frameId: number | null = null;

// 材质定义
const materials = {
  frame: new THREE.MeshStandardMaterial({ 
    color: 0x8B4513, // 棕色木材
    roughness: 0.7,
    metalness: 0.2
  }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xadd8e6,
    transmission: 0.8, 
    roughness: 0.05,
    metalness: 0.1,
    clearcoat: 1.0, 
    clearcoatRoughness: 0.1,
    opacity: 0.6, 
    transparent: true,
    side: THREE.DoubleSide, 
    envMapIntensity: 1.5 
  }),
  hardware: new THREE.MeshStandardMaterial({
    color: 0xC0C0C0, // 银色金属
    roughness: 0.3,
    metalness: 0.8
  }),
  debug: new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: true,
    transparent: true,
    opacity: 0.3
  })
};

// 初始化场景
function initScene() {
  // 创建新场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  
  // 添加环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  
  // 添加主方向光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(5, 8, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  
  // 设置阴影质量
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  
  // 添加半球光
  const hemisphereLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 0.7);
  scene.add(hemisphereLight);
  
  // 添加背面光源
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight2.position.set(-5, 5, -5);
  scene.add(directionalLight2);
}

// 初始化相机
function initCamera() {
  const aspect = props.width / props.height;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  camera.position.set(0, 0, 5);
}

// 初始化渲染器
function initRenderer() {
  if (!container.value) return;
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(props.width, props.height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  container.value.appendChild(renderer.domElement);
}

// 初始化控制器
function initControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.7;
  controls.maxPolarAngle = Math.PI / 1.5;
  controls.minDistance = 2;
  controls.maxDistance = 20;
  controls.target.set(0, 0, 0);
}

// 响应窗口调整大小
function onWindowResize() {
  if (!container.value) return;
  
  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
}

// 添加坐标辅助和网格
function addHelpers() {
  // 添加坐标轴辅助
  const axesHelper = new THREE.AxesHelper(1);
  scene.add(axesHelper);
  
  // 添加网格辅助
  const gridHelper = new THREE.GridHelper(10, 10);
  scene.add(gridHelper);
}

// 创建窗户模型
function createWindow() {
  try {
    console.log('开始创建窗户模型');
    isLoading.value = true;
    
    // 清除之前的窗户组
    if (windowGroup) {
      scene.remove(windowGroup);
      animationMixers = [];
    }
    
    // 创建新窗户组
    windowGroup = new THREE.Group();
    windowGroup.name = "windowGroup";
    scene.add(windowGroup);
    
    // 获取窗户配置
    const windowConfig = windowStore.windowConfig;
    if (!windowConfig) {
      console.warn('窗户配置不存在');
      isLoading.value = false;
      return;
    }
    
    console.log('窗户配置:', windowConfig);
    
    // 获取窗户数据
    const windowStructure = windowStore.windowStructure;
    if (!windowStructure || !windowStructure.mainArea) {
      console.warn('窗户结构或主区域不存在');
      isLoading.value = false;
      return;
    }
    
    // 记录窗户的尺寸参数（毫米）
    const { width, height, frameSize } = windowConfig;
    
    // 缩放因子 - 将mm转为three.js单位
    const scaleFactor = 0.001;
    
    // 构建窗户模型
    buildWindowModel(windowStructure, windowConfig, scaleFactor);
    
    // 添加辅助元素
    addHelpers();
    
    // 检查并设置动画控制
    showAnimationControls.value = hasAnimatableSashes();
    
    // 设置相机位置以查看整个窗户
    resetCamera();
    
    console.log('窗户模型创建完成');
  } catch (error) {
    console.error('创建窗户模型失败:', error);
  } finally {
    isLoading.value = false;
  }
}

// 构建窗户模型主函数
function buildWindowModel(windowStructure, windowConfig, scaleFactor) {
  const { width, height, frameSize } = windowConfig;
  
  // 计算缩放后的尺寸
  const scaledWidth = width * scaleFactor;
  const scaledHeight = height * scaleFactor;
  const scaledFrameSize = frameSize * scaleFactor;
  
  console.log(`窗户物理尺寸: ${width}x${height}mm, 框架厚度: ${frameSize}mm`);
  console.log(`转换为Three.js单位: ${scaledWidth}x${scaledHeight}, 框架: ${scaledFrameSize}`);
  
  // 创建外框 - 居中放置
  createOuterFrame(scaledWidth, scaledHeight, scaledFrameSize);
  
  // 创建主内容区域
  createWindowContent(windowStructure.mainArea, scaledWidth, scaledHeight, scaledFrameSize, scaleFactor);
}

// 创建外框
function createOuterFrame(totalWidth, totalHeight, frameThickness) {
  // 创建窗户外框几何体
  try {
    // 外框尺寸
    const outerBox = new THREE.Mesh(
      new THREE.BoxGeometry(totalWidth, totalHeight, 0.05),
      materials.frame
    );
    
    // 内框尺寸（用于挖空）
    const innerWidth = totalWidth - frameThickness * 2;
    const innerHeight = totalHeight - frameThickness * 2;
    
    const innerBox = new THREE.Mesh(
      new THREE.BoxGeometry(innerWidth, innerHeight, 0.06),
      materials.frame
    );
    
    // 执行CSG减法操作创建带孔的外框
    const frameCSG = CSG.subtract(outerBox, innerBox);
    frameCSG.material = materials.frame;
    frameCSG.position.set(innerWidth / 2, innerHeight / 2, 0);
    frameCSG.name = "outerFrame";
    
    // 将外框添加到窗户组中
    windowGroup.add(frameCSG);
    
    console.log(`创建窗户外框: ${totalWidth}x${totalHeight}, 框架厚度: ${frameThickness}`);
    console.log(`外框位置: (${frameCSG.position.x}, ${frameCSG.position.y}, ${frameCSG.position.z})`);
  } catch (error) {
    console.error('创建窗户外框失败:', error);
  }
}

// 创建窗户内容区域
function createWindowContent(mainArea, totalWidth, totalHeight, frameThickness, scaleFactor) {
  // 创建内容容器
  const contentGroup = new THREE.Group();
  contentGroup.name = "contentGroup";
  
  // 将内容组添加到窗户组
  windowGroup.add(contentGroup);
  
  // 递归创建窗户结构
  processWindowArea(mainArea, contentGroup, scaleFactor);
  
  // 居中定位整个窗户
  windowGroup.position.set(0, 0, 0);
}

// 递归处理窗户区域
function processWindowArea(area, parentGroup, scaleFactor, depth = 0) {
  if (!area) return;
  
  // 获取缩放后的尺寸和位置
  const areaWidth = area.width * scaleFactor;
  const areaHeight = area.height * scaleFactor;
  const areaX = area.x * scaleFactor;
  const areaY = area.y * scaleFactor;
  
  // 创建该区域的组
  const areaGroup = new THREE.Group();
  areaGroup.name = `area_${area.id}`;
  
  // 这里将坐标转换为以窗户中心为原点的坐标系
  // 需要计算相对于窗户中心的位置
  const parentWidth = parentGroup.userData.width || 0;
  const parentHeight = parentGroup.userData.height || 0;
  
  // 记录区域尺寸到userData中，供子区域使用
  areaGroup.userData.width = areaWidth;
  areaGroup.userData.height = areaHeight;
  areaGroup.userData.type = area.tag || 'area';
  
  // 计算位置，不是根区域时考虑父区域的影响
  if (depth === 0) {
    // 根区域，相对于窗户中心定位
    const centerX = -parentWidth/2 + areaX;
    const centerY = -parentHeight/2 + areaY;
    areaGroup.position.set(centerX, centerY, 0);
  } else {
    // 子区域，相对于父区域定位
    areaGroup.position.set(areaX, areaY, 0);
  }
  
  parentGroup.add(areaGroup);
  
  // 打印区域信息
  const indent = '  '.repeat(depth);
  console.log(`${indent}处理区域: ${area.id}, 类型: ${area.tag || 'area'}`);
  console.log(`${indent}位置: (${areaX}, ${areaY}), 尺寸: ${areaWidth}x${areaHeight}`);
  console.log(`${indent}在场景中的位置: (${areaGroup.position.x}, ${areaGroup.position.y}, ${areaGroup.position.z})`);
  
  // 根据区域类型创建对应的元素
  if (area.tag === 'window-muntin') {
    // 创建中挺
    createMuntin(area, areaGroup, areaWidth, areaHeight, scaleFactor);
  } 
  else if (area.sash) {
    // 创建窗扇
    createSash(area, areaGroup, areaWidth, areaHeight, scaleFactor);
  }
  else if (area.children && area.children.length > 0) {
    // 处理子区域
    console.log(`${indent}处理子区域: 数量=${area.children.length}`);
    
    // 递归处理子区域
    area.children.forEach((child, index) => {
      if (child) {
        processWindowArea(child, areaGroup, scaleFactor, depth + 1);
      }
    });
  }
  else {
    // 普通区域，创建玻璃面板
    createGlassPanel(areaGroup, areaWidth, areaHeight);
  }
  
}

// 创建中挺
function createMuntin(area, parentGroup, width, height, scaleFactor) {
  let muntinWidth, muntinHeight, posX, posY;
  
  if (area.direction === 'vertical') {
    muntinWidth = area.thickness * scaleFactor;
    muntinHeight = height;
    posX = width / 2;
    posY = height / 2;
  } else {
    muntinWidth = width;
    muntinHeight = area.thickness * scaleFactor;
    posX = width / 2;
    posY = height / 2;
  }
  
  const muntinGeometry = new THREE.BoxGeometry(muntinWidth, muntinHeight, 0.04);
  const muntinMesh = new THREE.Mesh(muntinGeometry, materials.frame);
  muntinMesh.position.set(posX, posY, 0.01);
  muntinMesh.castShadow = true;
  muntinMesh.receiveShadow = true;
  muntinMesh.name = "muntin";
  
  parentGroup.add(muntinMesh);
  
  console.log(`创建中挺: 方向=${area.direction}, 尺寸=${muntinWidth}x${muntinHeight}`);
  console.log(`中挺位置: (${posX}, ${posY}, 0.01)`);
}

// 创建窗扇
function createSash(area, parentGroup, width, height, scaleFactor) {
  console.log(`创建窗扇: 类型=${area.sash.sashType}, 尺寸=${width}x${height}`);
  
  // 创建窗扇框架
  const frameThickness = area.sash.frameSize * scaleFactor || 0.02;
  const sashGroup = new THREE.Group();
  sashGroup.name = "sash";
  
  // 添加窗扇框架
  const frameGeometry = new THREE.BoxGeometry(width, height, 0.04);
  const frameMesh = new THREE.Mesh(frameGeometry, materials.frame);
  frameMesh.position.set(width/2, height/2, 0);
  frameMesh.castShadow = true;
  frameMesh.receiveShadow = true;
  sashGroup.add(frameMesh);
  
  // 如果有玻璃信息，添加玻璃
  if (area.sash.glass) {
    const glassWidth = area.sash.glass.width * scaleFactor;
    const glassHeight = area.sash.glass.height * scaleFactor;
    const glassX = area.sash.glass.x * scaleFactor;
    const glassY = area.sash.glass.y * scaleFactor;
    
    const glassGeometry = new THREE.BoxGeometry(glassWidth, glassHeight, 0.02);
    const glassMesh = new THREE.Mesh(glassGeometry, materials.glass);
    glassMesh.position.set(glassX + glassWidth/2, glassY + glassHeight/2, 0.01);
    glassMesh.castShadow = false;
    glassMesh.receiveShadow = true;
    sashGroup.add(glassMesh);
    
    console.log(`窗扇玻璃: (${glassX}, ${glassY}), 尺寸=${glassWidth}x${glassHeight}`);
  }
  
  // 如果有把手信息，添加把手
  if (area.sash.handle) {
    const handleSize = 0.05;
    const handleX = area.sash.handle.x * scaleFactor;
    const handleY = area.sash.handle.y * scaleFactor;
    
    const handleGeometry = new THREE.BoxGeometry(handleSize, handleSize*2, 0.03);
    const handleMesh = new THREE.Mesh(handleGeometry, materials.hardware);
    handleMesh.position.set(handleX + handleSize/2, handleY + handleSize, 0.04);
    handleMesh.castShadow = true;
    sashGroup.add(handleMesh);
    
    console.log(`窗扇把手: (${handleX}, ${handleY})`);
  }
  
  // 添加到父组
  parentGroup.add(sashGroup);
  
  // 设置动画属性
  parentGroup.userData.isWindow = true;
  parentGroup.userData.isOpen = false;
  parentGroup.userData.originalPosition = parentGroup.position.clone();
  parentGroup.userData.originalRotation = parentGroup.rotation.clone();
  parentGroup.userData.sashType = area.sash.sashType;
  
  // 设置旋转轴
  if (area.sash.sashType === 'left') {
    parentGroup.userData.pivotSide = 'left';
  } else if (area.sash.sashType === 'right') {
    parentGroup.userData.pivotSide = 'right';
  } else if (area.sash.sashType.includes('tilt')) {
    parentGroup.userData.pivotSide = 'bottom';
  }
}

// 创建普通玻璃面板
function createGlassPanel(parentGroup, width, height) {
  const glassGeometry = new THREE.BoxGeometry(width, height, 0.02);
  const glassMesh = new THREE.Mesh(glassGeometry, materials.glass);
  glassMesh.position.set(width/2, height/2, 0);
  glassMesh.castShadow = false;
  glassMesh.receiveShadow = true;
  glassMesh.name = "glass";
  
  parentGroup.add(glassMesh);
  
  console.log(`创建玻璃面板: 尺寸=${width}x${height}`);
}

// 检查是否有可动画的窗扇
function hasAnimatableSashes() {
  if (!windowGroup) return false;
  
  let hasAnimatable = false;
  windowGroup.traverse((object) => {
    if (object.userData && object.userData.isWindow && 
        object.userData.sashType !== 'fixed') {
      hasAnimatable = true;
    }
  });
  
  return hasAnimatable;
}

// 切换窗户开关状态
function toggleWindowOpen() {
  isWindowOpen.value = !isWindowOpen.value;
  
  if (!windowGroup) return;
  
  // 遍历所有窗扇并应用动画
  windowGroup.traverse((object) => {
    if (object.userData && object.userData.isWindow && 
        object.userData.sashType !== 'fixed') {
      animateWindow(object, isWindowOpen.value);
    }
  });
}

// 窗户开关动画
function animateWindow(windowObj, open) {
  const { pivotSide, sashType } = windowObj.userData;
  
  // 根据窗扇类型设置旋转角度
  let targetRotation = new THREE.Euler(0, 0, 0);
  
  if (open) {
    if (pivotSide === 'left') {
      targetRotation.y = Math.PI / 3; // 60度
    } else if (pivotSide === 'right') {
      targetRotation.y = -Math.PI / 3; // -60度
    } else if (pivotSide === 'bottom') {
      targetRotation.x = Math.PI / 6; // 30度
    }
  }
  
  // 创建动画
  const duration = 1.0 / animationSpeed.value;
  const mixer = new THREE.AnimationMixer(windowObj);
  animationMixers.push(mixer);
  
  // 为窗扇创建旋转关键帧
  const rotationKF = new THREE.KeyframeTrack(
    '.rotation[xyz]',
    [0, duration],
    [
      windowObj.rotation.x, windowObj.rotation.y, windowObj.rotation.z,
      targetRotation.x, targetRotation.y, targetRotation.z
    ]
  );
  
  // 创建动画片段
  const clip = new THREE.AnimationClip('open', duration, [rotationKF]);
  
  // 播放动画
  const action = mixer.clipAction(clip);
  action.setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();
}

// 重置相机位置
function resetCamera() {
  if (!camera) return;
  
  // 设置相机位置为正面视图
  camera.position.set(0, 0, 5); 
  
  // 设置相机视角中心为场景中心
  if (controls) {
    controls.target.set(0, 0, 0);
    controls.update();
  }
}

// 动画循环
function animate() {
  frameId = requestAnimationFrame(animate);
  
  // 更新控制器
  if (controls) {
  controls.update();
  }
  
  // 更新动画混合器
  if (clock) {
  const delta = clock.getDelta();
  animationMixers.forEach(mixer => mixer.update(delta));
  }
  
  // 渲染场景
  if (renderer && scene && camera) {
  renderer.render(scene, camera);
  }
}

// 初始化3D渲染
onMounted(() => {
  if (!container.value) return;
  
  // 初始化Three.js核心组件
  initScene();
  initCamera();
  initRenderer();
  initControls();
  
  // 创建窗户模型
  createWindow();
  
  // 启动动画循环
  clock = new THREE.Clock();
  animate();
  
  // 添加窗口调整大小监听
  window.addEventListener('resize', onWindowResize);
});

// 在组件销毁时清理资源
onUnmounted(() => {
  if (frameId !== null) {
    cancelAnimationFrame(frameId);
  }
  
  window.removeEventListener('resize', onWindowResize);
  
  // 清理Three.js资源
  if (renderer) {
    renderer.dispose();
    if (container.value) {
      container.value.removeChild(renderer.domElement);
    }
  }
  
  // 清理场景对象
  if (scene) {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });
  }
});

// 监听窗户数据变化，更新3D模型
watch(() => windowStore.windowStructure, () => {
  isLoading.value = true;
  
  // 延迟更新，确保数据已经完全更新
  setTimeout(() => {
    createWindow();
  }, 100);
}, { deep: true });

// 导出组件方法
defineExpose({
  resetCamera,
  toggleWindowOpen
});
</script>

<style scoped>
.three-js-window {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #f7f7f7;
  overflow: hidden;
  border-radius: 4px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.loading-overlay i {
  font-size: 32px;
  margin-bottom: 10px;
}

.controls-panel {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 5;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-buttons {
  display: flex;
  gap: 8px;
}

.animation-speed {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.animation-speed span {
  font-size: 12px;
  color: #666;
}

@media (max-width: 768px) {
  .controls-panel {
    bottom: 10px;
    right: 10px;
    padding: 8px;
  }
}
</style> 