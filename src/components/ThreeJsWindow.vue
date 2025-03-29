<template>
  <div class="three-js-window" ref="container">
    <!-- 加载状态指示器 -->
    <div class="loading-overlay" v-if="isLoading">
      <el-icon class="is-loading"><LoadingIcon /></el-icon>
      <span>正在渲染3D模型...</span>
    </div>
    
    <!-- 控制面板 -->
    <div class="controls-panel" v-show="!isLoading">
      <div class="control-buttons">
        <el-tooltip content="重置视图" placement="top">
          <el-button circle size="small" @click="resetCamera">
            <el-icon><RefreshIcon /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-tooltip content="3D视角" placement="top">
          <el-button circle size="small" @click="view3D">
            <el-icon><Icon3d /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-tooltip content="正面视图" placement="top">
          <el-button circle size="small" @click="viewFront">
            <el-icon><IconFront /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-tooltip content="侧面视图" placement="top">
          <el-button circle size="small" @click="viewSide">
            <el-icon><IconSide /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-tooltip content="顶部视图" placement="top">
          <el-button circle size="small" @click="viewTop">
            <el-icon><IconTop /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-tooltip :content="isWindowOpen ? '关闭窗户' : '打开窗户'" placement="top">
          <el-button 
            type="primary" 
            :class="{'is-active': isWindowOpen}" 
            circle 
            size="small" 
            @click="toggleWindowOpen">
            <el-icon><SwitchIcon /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
      
      <div class="window-status" v-if="showAnimationControls">
        <span>窗户状态: </span>
        <span class="status-text" :class="{'status-open': isWindowOpen, 'status-closed': !isWindowOpen}">
          {{ isWindowOpen ? '已打开' : '已关闭' }}
        </span>
      </div>
      
      <div class="animation-speed" v-if="showAnimationControls">
        <span>动画速度:</span>
        <el-slider v-model="animationSpeed" :min="0.5" :max="3" :step="0.1" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, h } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSG } from 'three-csg-ts';
import { Icon } from '@iconify/vue';

// 创建iconify图标组件
const RefreshIcon = () => h(Icon, { icon: 'tabler:refresh' });
const SwitchIcon = () => h(Icon, { icon: 'tabler:toggle-right' });
const LoadingIcon = () => h(Icon, { icon: 'tabler:loading' });
const Icon3d = () => h(Icon, { icon: 'tabler:view-3d' });
const IconFront = () => h(Icon, { icon: 'tabler:layout-navbar' });
const IconSide = () => h(Icon, { icon: 'tabler:layout-sidebar' });
const IconTop = () => h(Icon, { icon: 'tabler:layout-bottombar' });

// 添加窗户结构和配置的接口定义
interface WindowConfig {
  width: number;
  height: number;
  frameSize: number;
}

interface WindowArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tag?: string;
  direction?: 'vertical' | 'horizontal';
  thickness?: number;
  children?: WindowArea[];
  sash?: {
    sashType: string;
    frameSize: number;
    glass?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    handle?: {
      x: number;
      y: number;
    };
  };
  mainArea?: WindowArea;
}

interface WindowStructure {
  frame: any;
  mainArea: WindowArea;
  frameSize: number;
  width: number;
  height: number;
}

// 窗户用户数据类型定义
interface WindowUserData {
  isWindow?: boolean;
  isAnimatable?: boolean;
  originalSashType?: string;
  sashType?: string;
  width?: number;
  height?: number;
  hingeEdge?: string;
  handlePos?: {x: number, y: number};
  isOpen?: boolean;
  type?: string;
}

// 性能和调试设置
const DEBUG_MODE = false; // 是否启用调试日志
const USE_TEXTURE_CACHE = true; // 是否缓存纹理
const USE_GEOMETRY_CACHE = true; // 是否缓存几何体
const TARGET_FPS = 60; // 目标帧率

// Props定义
const props = defineProps({
  width: {
    type: Number,
    default: 800
  },
  height: {
    type: Number,
    default: 600
  },
  windowStructure: {
    type: Object as () => WindowStructure,
    required: true
  },
  windowConfig: {
    type: Object as () => WindowConfig,
    required: true
  },
  initialOpen: {
    type: Boolean,
    default: false
  }
});

// 定义事件
const emit = defineEmits(['window-open-changed', 'loading-changed']);

// 状态管理 - 移除对store的引用
const container = ref<HTMLElement | null>(null);
const isLoading = ref(true);
const showAnimationControls = ref(false);
const animationSpeed = ref(1.0);
const isWindowOpen = ref(props.initialOpen);

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
const materials: {
  frame: THREE.MeshStandardMaterial | null;
  glass: THREE.MeshPhysicalMaterial | null;
  hardware: THREE.MeshStandardMaterial;
  debug: THREE.MeshBasicMaterial;
} = {
  frame: null, // 初始化为null，等待纹理加载后创建
  glass: null, // 初始化为null，等待纹理加载后创建
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

// 环境贴图
let envMap: THREE.Texture | null = null;

// 资源缓存
const textureCache = new Map<string, THREE.Texture>();
const geometryCache = {
  box: new Map<string, THREE.BoxGeometry>(),
  cylinder: new Map<string, THREE.CylinderGeometry>(),
  sphere: new Map<string, THREE.SphereGeometry>()
};

// 性能监控变量
let frameCount = 0;
let lastFpsTime = 0;
let currentFps = 0;

// 添加相机位置和目标的ref声明，用于跟踪相机移动
const cameraPosition = ref(new THREE.Vector3());
const controlsTarget = ref(new THREE.Vector3());

// 创建窗口动画变量
const isAnimationRunning = ref(true);
const windowCasement = ref<THREE.Group | null>(null);
const isWindowMoving = ref(false);
const lastAnimTime = ref(Date.now());
const windowAnimSpeed = ref(1.5);
const isOpening = ref(false);
const windowOpenAngle = ref(0);
const maxOpenAngle = ref(Math.PI / 4); // 45度
const animationFrameId = ref<number | null>(null);

// 创建相机位置动画变量
const cameraAnimationFrame = ref<number | null>(null);
let cameraAnimationStartTime = 0;
let cameraAnimationStartPosition = new THREE.Vector3();
let cameraAnimationTargetPosition = new THREE.Vector3();
let cameraAnimationStartTarget = new THREE.Vector3();
let cameraAnimationEndTarget = new THREE.Vector3();
let cameraAnimationDuration = 500;

// 调试日志函数
function debugLog(...args: any[]): void {
  if (DEBUG_MODE) {
    console.log(...args);
  }
}

// 资源管理模块
const ResourceManager = {
  // 纹理缓存
  textureCache: new Map<string, THREE.Texture>(),
  
  // 几何体缓存
  geometryCache: {
    box: new Map<string, THREE.BoxGeometry>(),
    cylinder: new Map<string, THREE.CylinderGeometry>(),
    sphere: new Map<string, THREE.SphereGeometry>()
  },
  
  // 加载纹理
  loadTexture(url: string, callback: (texture: THREE.Texture) => void): void {
    if (USE_TEXTURE_CACHE && this.textureCache.has(url)) {
      debugLog(`使用缓存的纹理: ${url}`);
      callback(this.textureCache.get(url)!);
      return;
    }
    
    textureLoader.load(
      url, // 正确传递url作为第一个参数
      // 成功回调
      (texture: THREE.Texture) => { // 明确指定texture类型
        if (USE_TEXTURE_CACHE) {
          this.textureCache.set(url, texture);
          debugLog(`缓存纹理: ${url}`);
        }
        callback(texture);
      },
      // 进度回调
      undefined,
      // 错误回调
      (err) => {
        console.error(`加载纹理失败: ${url}`, err);
      }
    );
  },
  
  // 获取几何体 - 盒子
  getBoxGeometry(width: number, height: number, depth: number): THREE.BoxGeometry {
    if (!USE_GEOMETRY_CACHE) {
      return new THREE.BoxGeometry(width, height, depth);
    }
    
    const key = `${width.toFixed(4)}_${height.toFixed(4)}_${depth.toFixed(4)}`;
    if (!this.geometryCache.box.has(key)) {
      this.geometryCache.box.set(key, new THREE.BoxGeometry(width, height, depth));
      debugLog(`创建新的盒体几何体: ${key}`);
    } else {
      debugLog(`使用缓存的盒体几何体: ${key}`);
    }
    return this.geometryCache.box.get(key)!;
  },
  
  // 获取几何体 - 圆柱体
  getCylinderGeometry(radiusTop: number, radiusBottom: number, height: number): THREE.CylinderGeometry {
    if (!USE_GEOMETRY_CACHE) {
      return new THREE.CylinderGeometry(radiusTop, radiusBottom, height);
    }
    
    const key = `${radiusTop.toFixed(4)}_${radiusBottom.toFixed(4)}_${height.toFixed(4)}`;
    if (!this.geometryCache.cylinder.has(key)) {
      this.geometryCache.cylinder.set(key, new THREE.CylinderGeometry(radiusTop, radiusBottom, height));
      debugLog(`创建新的圆柱体几何体: ${key}`);
    } else {
      debugLog(`使用缓存的圆柱体几何体: ${key}`);
    }
    return this.geometryCache.cylinder.get(key)!;
  },
  
  // 获取几何体 - 球体
  getSphereGeometry(radius: number): THREE.SphereGeometry {
    if (!USE_GEOMETRY_CACHE) {
      return new THREE.SphereGeometry(radius);
    }
    
    const key = `${radius.toFixed(4)}`;
    if (!this.geometryCache.sphere.has(key)) {
      this.geometryCache.sphere.set(key, new THREE.SphereGeometry(radius));
      debugLog(`创建新的球体几何体: ${key}`);
    } else {
      debugLog(`使用缓存的球体几何体: ${key}`);
    }
    return this.geometryCache.sphere.get(key)!;
  },
  
  // 清理资源
  dispose(): void {
    // 清理几何体缓存
    if (USE_GEOMETRY_CACHE) {
      this.geometryCache.box.forEach(geometry => geometry.dispose());
      this.geometryCache.box.clear();
      
      this.geometryCache.cylinder.forEach(geometry => geometry.dispose());
      this.geometryCache.cylinder.clear();
      
      this.geometryCache.sphere.forEach(geometry => geometry.dispose());
      this.geometryCache.sphere.clear();
    }
    
    // 清理纹理缓存
    if (USE_TEXTURE_CACHE) {
      this.textureCache.forEach(texture => texture.dispose());
      this.textureCache.clear();
    }
  }
};

// 纹理加载器
const textureLoader = new THREE.TextureLoader();

// 加载纹理
function loadTextures() {
  isLoading.value = true;
  
  // 纹理URL
  const woodColorMapUrl = '/textures/Wood066_1K-JPG/Wood066_1K-JPG_Color.jpg';
  const woodNormalMapUrl = '/textures/Wood066_1K-JPG/Wood066_1K-JPG_NormalGL.jpg';
  const woodRoughnessMapUrl = '/textures/Wood066_1K-JPG/Wood066_1K-JPG_Roughness.jpg';
  
  // 跟踪加载进度
  let loadedCount = 0;
  const totalToLoad = 3;
  
  // 当所有纹理加载完毕时调用此函数
  const checkAllLoaded = () => {
    loadedCount++;
    debugLog(`纹理加载进度: ${loadedCount}/${totalToLoad}`);
    
    if (loadedCount >= totalToLoad) {
      debugLog('所有纹理加载完成');
      createWindow();
    }
  };
  
  // 加载木材颜色纹理
  ResourceManager.loadTexture(woodColorMapUrl, (woodColorMap) => {
    woodColorMap.wrapS = woodColorMap.wrapT = THREE.RepeatWrapping;
    
    // 加载木材法线纹理
    ResourceManager.loadTexture(woodNormalMapUrl, (woodNormalMap) => {
      woodNormalMap.wrapS = woodNormalMap.wrapT = THREE.RepeatWrapping;
      
      // 加载木材粗糙度纹理
      ResourceManager.loadTexture(woodRoughnessMapUrl, (woodRoughnessMap) => {
        woodRoughnessMap.wrapS = woodRoughnessMap.wrapT = THREE.RepeatWrapping;
        
        // 创建木材材质
        materials.frame = new THREE.MeshStandardMaterial({ 
          map: woodColorMap,
          normalMap: woodNormalMap,
          roughnessMap: woodRoughnessMap,
          color: 0xffffff, // 使用白色让纹理显示原色
          roughness: 0.7,
          metalness: 0.1
        });
        
        // 创建完全透明的玻璃材质
        materials.glass = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transmission: 1.0,     // 完全透射
          thickness: 0.2,        // 减小厚度
          roughness: 0.0,        // 完全平滑
          metalness: 0.0,        // 无金属感
          clearcoat: 0.0,        // 移除清漆效果
          ior: 1.45,             // 玻璃的折射率
          reflectivity: 0.2,     // 低反射率
          transparent: true,     // 启用透明
          opacity: 0.2,          // 非常低的不透明度
          side: THREE.DoubleSide,// 双面渲染
          envMapIntensity: 0.5,  // 减少环境贴图强度
          depthWrite: false      // 禁用深度写入以改善透明渲染
        });
        
        checkAllLoaded();
      });
      
      checkAllLoaded();
    });
    
    checkAllLoaded();
  });
}

// 初始化场景
function initScene() {
  // 创建新场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  
  // 使用备用环境贴图方案
  useBackupEnvironment();
  
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

// 备用环境贴图方案
function useBackupEnvironment() {
  if (!renderer) return;
  
  // 创建一个简单的梯度环境贴图
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x88ccee);
  const envTexture = pmremGenerator.fromScene(envScene).texture;
  
  scene.environment = envTexture;
  envMap = envTexture;
  
  pmremGenerator.dispose();
}

// 初始化相机
function initCamera() {
  const aspect = props.width / props.height;
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000); // 增加FOV到60度，提供更广阔的视野
  camera.position.set(0, 0, 5);
  
  // 启用相机动画效果的设置
  camera.userData.targetPosition = new THREE.Vector3(0, 0, 5);
  camera.userData.animationDuration = 500; // 动画持续时间(毫秒)
}

// 初始化渲染器
function initRenderer() {
  if (!container.value) return;
  
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    logarithmicDepthBuffer: true,
    premultipliedAlpha: false // 改变Alpha混合模式提高透明效果
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(props.width, props.height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMappingExposure = 1.0; // 设置曝光
  renderer.sortObjects = true; // 启用物体排序以正确渲染透明物体
  
  container.value.appendChild(renderer.domElement);
}

// 初始化控制器
function initControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.8; // 增加旋转速度
  controls.maxPolarAngle = Math.PI * 0.85; // 允许更广的仰角
  controls.minPolarAngle = 0.1; // 设置最小极角，避免从正下方观察
  controls.minDistance = 1;   // 减小最小距离
  controls.maxDistance = 30;  // 增加最大距离
  controls.enablePan = true;  // 启用平移
  controls.panSpeed = 0.8;    // 设置平移速度
  controls.screenSpacePanning = true; // 使用屏幕空间平移，更加直观
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
    debugLog('开始创建窗户模型');
    isLoading.value = true;
    emit('loading-changed', true);
    
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
    const windowConfig = props.windowConfig;
    if (!windowConfig) {
      console.warn('窗户配置不存在');
      isLoading.value = false;
      emit('loading-changed', false);
      return;
    }
    
    debugLog('窗户配置:', windowConfig);
    
    // 获取窗户数据
    const windowStructure = props.windowStructure;
    if (!windowStructure || !windowStructure.mainArea) {
      console.warn('窗户结构或主区域不存在');
      isLoading.value = false;
      emit('loading-changed', false);
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
    
    debugLog('窗户模型创建完成');
  } catch (error) {
    console.error('创建窗户模型失败:', error);
  } finally {
    isLoading.value = false;
    emit('loading-changed', false);
  }
}

// 构建窗户模型主函数
function buildWindowModel(
  windowStructure: WindowStructure, 
  windowConfig: WindowConfig, 
  scaleFactor: number
) {
  const { width, height, frameSize } = windowConfig;
  
  // 计算缩放后的尺寸
  const scaledWidth = width * scaleFactor;
  const scaledHeight = height * scaleFactor;
  const scaledFrameSize = frameSize * scaleFactor;
  
  debugLog(`窗户物理尺寸: ${width}x${height}mm, 框架厚度: ${frameSize}mm`);
  debugLog(`转换为Three.js单位: ${scaledWidth}x${scaledHeight}, 框架: ${scaledFrameSize}`);
  
  // 创建外框 - 居中放置
  createOuterFrame(scaledWidth, scaledHeight, scaledFrameSize);
  
  // 创建主内容区域
  createWindowContent(windowStructure.mainArea, scaledWidth, scaledHeight, scaledFrameSize, scaleFactor);
}

// 创建外框
function createOuterFrame(
  totalWidth: number, 
  totalHeight: number, 
  frameThickness: number
) {
  // 创建窗户外框几何体
  try {
    // 外框尺寸
    const outerBox = new THREE.Mesh(
      ResourceManager.getBoxGeometry(totalWidth, totalHeight, 0.05),
      materials.frame || new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    
    // 内框尺寸（用于挖空）
    const innerWidth = totalWidth - frameThickness * 2;
    const innerHeight = totalHeight - frameThickness * 2;
    
    const innerBox = new THREE.Mesh(
      ResourceManager.getBoxGeometry(innerWidth, innerHeight, 0.06),
      materials.frame || new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    
    // 执行CSG减法操作创建带孔的外框
    const frameCSG = CSG.subtract(outerBox, innerBox);
    frameCSG.material = materials.frame || new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    frameCSG.position.set(innerWidth / 2, innerHeight / 2, 0);
    frameCSG.name = "outerFrame";
    
    // 将外框添加到窗户组中
    windowGroup.add(frameCSG);
    
    debugLog(`创建窗户外框: ${totalWidth}x${totalHeight}, 框架厚度: ${frameThickness}`);
    debugLog(`外框位置: (${frameCSG.position.x}, ${frameCSG.position.y}, ${frameCSG.position.z})`);
  } catch (error) {
    console.error('创建窗户外框失败:', error);
  }
}

// 创建窗户内容区域
function createWindowContent(
  mainArea: WindowArea, 
  totalWidth: number,
  totalHeight: number, 
  frameThickness: number, 
  scaleFactor: number
) {
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
function processWindowArea(
  area: WindowArea, 
  parentGroup: THREE.Group, 
  scaleFactor: number, 
  depth = 0
) {
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
  debugLog(`${indent}处理区域: ${area.id}, 类型: ${area.tag || 'area'}`);
  debugLog(`${indent}位置: (${areaX}, ${areaY}), 尺寸: ${areaWidth}x${areaHeight}`);
  debugLog(`${indent}在场景中的位置: (${areaGroup.position.x}, ${areaGroup.position.y}, ${areaGroup.position.z})`);
  
  // 记录额外信息
  if (area.sash) {
    debugLog(`${indent}窗扇类型: ${area.sash.sashType}`);
    areaGroup.userData.originalSashType = area.sash.sashType;
  }
  
  // 根据区域类型创建对应的元素
  if (area.tag === 'window-muntin') {
    // 创建中挺
    createMuntin(area, areaGroup, areaWidth, areaHeight, scaleFactor);
  } 
  else if (area.sash) {
    // 创建窗扇
    createSash(area, areaGroup, areaWidth, areaHeight, scaleFactor);
    
    // 特别标记可动画区域
    if (area.sash.sashType !== 'fixed') {
      areaGroup.userData.isAnimatable = true;
      debugLog(`${indent}标记可动画窗扇: ${area.id}, 类型: ${area.sash.sashType}`);
    }
  }
  else if (area.children && area.children.length > 0) {
    // 处理子区域
    debugLog(`${indent}处理子区域: 数量=${area.children.length}`);
    
    // 递归处理子区域
    area.children.forEach((child: WindowArea, index: number) => {
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
function createMuntin(
  area: WindowArea, 
  parentGroup: THREE.Group, 
  width: number, 
  height: number, 
  scaleFactor: number
) {
  let muntinWidth, muntinHeight, posX, posY;
  
  if (area.direction === 'vertical') {
    muntinWidth = (area.thickness || 20) * scaleFactor;
    muntinHeight = height;
    posX = width / 2;
    posY = height / 2;
  } else {
    muntinWidth = width;
    muntinHeight = (area.thickness || 20) * scaleFactor;
    posX = width / 2;
    posY = height / 2;
  }
  
  // 使用缓存的几何体
  const geometry = ResourceManager.getBoxGeometry(muntinWidth, muntinHeight, 0.04);
  
  const muntinMesh = new THREE.Mesh(
    geometry, 
    materials.frame || new THREE.MeshStandardMaterial({ color: 0x8B4513 })
  );
  muntinMesh.position.set(posX, posY, 0.01);
  muntinMesh.castShadow = true;
  muntinMesh.receiveShadow = true;
  muntinMesh.name = "muntin";
  
  parentGroup.add(muntinMesh);
  
  debugLog(`创建中挺: 方向=${area.direction}, 尺寸=${muntinWidth}x${muntinHeight}`);
  debugLog(`中挺位置: (${posX}, ${posY}, 0.01)`);
}

// 创建窗扇
function createSash(
  area: WindowArea, 
  parentGroup: THREE.Group, 
  width: number, 
  height: number, 
  scaleFactor: number
) {
  if (!area.sash) return;
  
  debugLog(`创建窗扇: 类型=${area.sash.sashType}, 尺寸=${width}x${height}`);
  
  // 创建窗扇框架
  let frameThickness = area.sash.frameSize * scaleFactor || 0.02;
  
  // 设置窗扇对应的数据
  let hingeEdge = 'none'; // 铰链边位置
  let handlePos = { x: 0, y: 0 }; // 把手位置

  // 根据窗扇类型确定铰链位置
  if (area.sash.sashType === 'left') {
    // 左开窗扇 - 把手在右侧，铰链在左侧
    hingeEdge = 'left';
    debugLog(`左开窗扇: 铰链在左侧，把手在右侧`);
  } else if (area.sash.sashType === 'right') {
    // 右开窗扇 - 把手在左侧，铰链在右侧
    hingeEdge = 'right';
    debugLog(`右开窗扇: 铰链在右侧，把手在左侧`);
  } else if (area.sash.sashType.includes('tilt')) {
    // 倾斜窗扇 - 把手在顶部，铰链在底部
    hingeEdge = 'bottom';
    debugLog(`倾斜窗扇: 铰链在底部，把手在顶部`);
  }
  
  if (area.sash.sashType !== 'fixed') {
    // 对于可动窗扇，创建两个组：
    // 1. 轴心组(pivotGroup) - 用于定位旋转轴的位置
    // 2. 窗扇内容组(sashGroup) - 包含窗扇的所有内容
    
    // 创建轴心组 - 此组将放置在铰链位置，作为旋转轴
    const pivotGroup = new THREE.Group();
    pivotGroup.name = "pivot_" + area.id;
    
    // 创建窗扇内容组 - 此组包含窗扇的所有实际内容
    const sashGroup = new THREE.Group();
    sashGroup.name = "sash_" + area.id;
    
    // 添加窗扇框架到窗扇内容组
    const outerFrameGeometry = new THREE.BoxGeometry(width, height, 0.04);
    const outerFrameMesh = new THREE.Mesh(
      outerFrameGeometry, 
      materials.frame || new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    
    // 创建内框几何体（用于挖空）
    const innerWidth = width - frameThickness * 2;
    const innerHeight = height - frameThickness * 2;
    const innerFrameGeometry = new THREE.BoxGeometry(innerWidth, innerHeight, 0.05);
    const innerFrameMesh = new THREE.Mesh(innerFrameGeometry, materials.debug);
    
    // 将内框放置在窗扇的中心
    innerFrameMesh.position.set(frameThickness, frameThickness, 0);
    
    // 执行CSG减法操作创建带孔的框架
    const frameMesh = CSG.subtract(outerFrameMesh, innerFrameMesh);
    frameMesh.material = materials.frame || new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    frameMesh.position.set(width/2, height/2, 0);
    frameMesh.castShadow = true;
    frameMesh.receiveShadow = true;
    sashGroup.add(frameMesh);
    
    // 如果有玻璃信息，则创建对应的玻璃
    if (area.sash.glass) {
      // 玻璃的尺寸和位置
      const glassX = area.sash.glass.x * scaleFactor;
      const glassY = area.sash.glass.y * scaleFactor;
      const glassWidth = area.sash.glass.width * scaleFactor;
      const glassHeight = area.sash.glass.height * scaleFactor;
      
      const glassGeometry = new THREE.BoxGeometry(glassWidth, glassHeight, 0.02);
      const glassMesh = new THREE.Mesh(
        glassGeometry,
        materials.glass || new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transmission: 1.0,
          transparent: true
        })
      );
      glassMesh.position.set(glassX + glassWidth/2, glassY + glassHeight/2, 0.01);
      glassMesh.castShadow = false;
      glassMesh.receiveShadow = true;
      sashGroup.add(glassMesh);
    } else {
      // 如果没有特定的玻璃信息，则在框架内部添加默认玻璃
      const glassGeometry = new THREE.BoxGeometry(innerWidth, innerHeight, 0.02);
      const glassMesh = new THREE.Mesh(
        glassGeometry,
        materials.glass || new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transmission: 1.0,
          transparent: true
        })
      );
      // 玻璃位置与内框位置相同，但稍微前移，确保在框架之上
      glassMesh.position.set(width/2, height/2, 0.01);
      glassMesh.castShadow = false;
      glassMesh.receiveShadow = true;
      sashGroup.add(glassMesh);
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
      
      // 记录把手位置
      handlePos.x = handleX;
      handlePos.y = handleY;
      
      debugLog(`窗扇把手: (${handleX}, ${handleY})`);
    }
    
    // 添加调试边框
    const debugBoxGeom = new THREE.BoxGeometry(width, height, 0.01);
    const debugMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.2,
      wireframe: true
    });
    const debugBox = new THREE.Mesh(debugBoxGeom, debugMaterial);
    debugBox.position.set(width/2, height/2, 0.02);
    debugBox.name = "debugBox";
    sashGroup.add(debugBox);
    
    // ======= 核心：正确设置旋转轴和窗扇位置 =======
    
    // 根据铰链边缘定位窗扇和轴心点
    if (hingeEdge === 'left') {
      // 左侧铰链 - 轴心点在左侧边缘
      
      // 窗扇本体以左上角为原点
      sashGroup.position.set(0, 0, 0);
      
      // 将窗扇添加到轴心组
      pivotGroup.add(sashGroup);
      
      // 轴心组定位在窗扇左边缘
      pivotGroup.position.set(0, 0, 0);
      
    } else if (hingeEdge === 'right') {
      // 右侧铰链 - 轴心点在右侧边缘
      
      // 窗扇本体定位，使其右边缘与轴心对齐
      // 在这种情况下，窗扇向左偏移宽度，使其右边缘位于原点
      sashGroup.position.set(-width, 0, 0);
      
      // 将窗扇添加到轴心组
      pivotGroup.add(sashGroup);
      
      // 轴心组定位在窗扇右边缘（父组中的位置）
      pivotGroup.position.set(width, 0, 0);
      
    } else if (hingeEdge === 'bottom') {
      // 底部铰链 - 轴心点在底部边缘
      
      // 窗扇本体定位，使其底边与轴心对齐
      sashGroup.position.set(0, 0, 0);
      
      // 将窗扇添加到轴心组
      pivotGroup.add(sashGroup);
      
      // 轴心组定位在窗扇底边
      pivotGroup.position.set(0, 0, 0);
    }
    
    // 添加铰链标记 - 根据铰链边位置添加，铰链将添加到父组而不是pivotGroup
    addHingeMarkers(hingeEdge, pivotGroup, width, height, parentGroup);
    
    // 添加红色调试标记，显示轴心点位置
    addDebugMarker(pivotGroup, 0xff0000);
    
    // 存储窗扇类型信息用于动画
    pivotGroup.userData.sashType = area.sash.sashType;
    pivotGroup.userData.isWindow = true;
    pivotGroup.userData.width = width;
    pivotGroup.userData.height = height;
    pivotGroup.userData.hingeEdge = hingeEdge;
    pivotGroup.userData.handlePos = handlePos;
    
    // 将轴心组添加到父组
    parentGroup.add(pivotGroup);
    
  } else {
    // 固定窗扇 - 直接创建和添加窗扇
    frameThickness = 0;
    // 创建窗扇组
    const sashGroup = new THREE.Group();
    sashGroup.name = "sash_" + area.id;
    
    // 添加窗扇框架
    const outerFrameGeometry = new THREE.BoxGeometry(width, height, 0.04);
    const outerFrameMesh = new THREE.Mesh(
      outerFrameGeometry, 
      materials.frame || new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    
    // 创建内框几何体（用于挖空）
    const innerWidth = width - frameThickness * 2;
    const innerHeight = height - frameThickness * 2;
    const innerFrameGeometry = new THREE.BoxGeometry(innerWidth, innerHeight, 0.05);
    const innerFrameMesh = new THREE.Mesh(innerFrameGeometry, materials.debug);
    
    // 将内框放置在窗扇的中心
    innerFrameMesh.position.set(frameThickness, frameThickness, 0);
    
    // 执行CSG减法操作创建带孔的框架
    const frameMesh = CSG.subtract(outerFrameMesh, innerFrameMesh);
    frameMesh.material = materials.frame || new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    frameMesh.position.set(width/2, height/2, 0);
    frameMesh.castShadow = true;
    frameMesh.receiveShadow = true;
    sashGroup.add(frameMesh);
    
    // 添加默认玻璃
    const glassGeometry = new THREE.BoxGeometry(innerWidth, innerHeight, 0.02);
    const glassMesh = new THREE.Mesh(
      glassGeometry, 
      materials.glass || new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 1.0,
        transparent: true
      })
    );
    glassMesh.position.set(width/2, height/2, 0.01);
    glassMesh.castShadow = false;
    glassMesh.receiveShadow = true;
    sashGroup.add(glassMesh);
    
    // 将窗扇添加到父组
    parentGroup.add(sashGroup);
  }
}

// 添加铰链标记
function addHingeMarkers(
  hingeEdge: string, 
  pivotGroup: THREE.Group, 
  width: number, 
  height: number, 
  parentGroup: THREE.Group
) {
  // 创建铰链标记 - 黄色圆柱体
  const hingeGeo = ResourceManager.getCylinderGeometry(0.02, 0.02, 0.08);
  const hingeMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
  
  // 获取轴心组的世界位置
  const pivotWorldPosition = new THREE.Vector3();
  pivotGroup.getWorldPosition(pivotWorldPosition);
  
  if (hingeEdge === 'left') {
    // 左侧铰链 - 放置在窗扇左侧
    for (let i = 0; i < 3; i++) {
      const hinge = new THREE.Mesh(hingeGeo, hingeMaterial);
      hinge.rotation.z = Math.PI / 2; // 旋转90度使圆柱体水平
      hinge.position.set(pivotWorldPosition.x, height * (i+1)/4, 0.02);
      hinge.name = `hinge_left_${i}`;
      // 将铰链添加到父组，这样铰链位置就不会随窗扇旋转而变化
      parentGroup.add(hinge);
    }
  } else if (hingeEdge === 'right') {
    // 右侧铰链 - 放置在窗扇右侧
    for (let i = 0; i < 3; i++) {
      const hinge = new THREE.Mesh(hingeGeo, hingeMaterial);
      hinge.rotation.z = Math.PI / 2; // 旋转90度使圆柱体水平
      hinge.position.set(pivotWorldPosition.x, height * (i+1)/4, 0.02);
      hinge.name = `hinge_right_${i}`;
      // 将铰链添加到父组，这样铰链位置就不会随窗扇旋转而变化
      parentGroup.add(hinge);
    }
  } else if (hingeEdge === 'bottom') {
    // 底部铰链 - 放置在窗扇底部
    for (let i = 0; i < 3; i++) {
      const hinge = new THREE.Mesh(hingeGeo, hingeMaterial);
      hinge.rotation.x = Math.PI / 2; // 旋转90度使圆柱体垂直于窗扇平面
      hinge.position.set(width * (i+1)/4, pivotWorldPosition.y, 0.02);
      hinge.name = `hinge_bottom_${i}`;
      // 将铰链添加到父组，这样铰链位置就不会随窗扇旋转而变化
      parentGroup.add(hinge);
    }
  }
}

// 创建普通玻璃面板
function createGlassPanel(
  parentGroup: THREE.Group, 
  width: number, 
  height: number
) {
  // 使用更薄的几何体
  const glassGeometry = ResourceManager.getBoxGeometry(width, height, 0.005);
  const glassMesh = new THREE.Mesh(
    glassGeometry, 
    materials.glass || new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 1.0,
      transparent: true
    })
  );
  glassMesh.position.set(width/2, height/2, 0);
  glassMesh.castShadow = false;
  glassMesh.receiveShadow = false; // 禁用接收阴影以提高透明度
  glassMesh.name = "glass";
  glassMesh.renderOrder = 2000; // 确保玻璃在渲染队列中最后渲染
  
  parentGroup.add(glassMesh);
  
  debugLog(`创建玻璃面板: 尺寸=${width}x${height}`);
}

// 检查是否有可动画的窗扇
function hasAnimatableSashes() {
  if (!windowGroup) return false;
  
  let hasAnimatable = false;
  let animatableCount = 0;
  
  windowGroup.traverse((object) => {
    if (object.userData && object.userData.isWindow && 
        object.userData.sashType !== 'fixed') {
      hasAnimatable = true;
      animatableCount++;
      debugLog(`找到可动画窗扇: ID=${object.name}, 类型=${object.userData.sashType}`);
    }
  });
  
  debugLog(`总共找到 ${animatableCount} 个可动画窗扇`);
  return hasAnimatable;
}

// 切换窗户开关状态
function toggleWindowOpen() {
  isWindowOpen.value = !isWindowOpen.value;
  emit('window-open-changed', isWindowOpen.value);
  debugLog(`切换窗户状态为: ${isWindowOpen.value ? '打开' : '关闭'}`);
  
  if (!windowGroup) {
    debugLog('窗户组不存在，无法执行动画');
    return;
  }
  
  let animatedCount = 0;
  
  // 遍历所有窗扇并应用动画
  windowGroup.traverse((object) => {
    if (object.userData && object.userData.isWindow && object.userData.sashType !== 'fixed') {
      debugLog(`找到窗扇: ${object.name}, 类型=${object.userData.sashType}`);
      animateWindow(object, isWindowOpen.value);
      animatedCount++;
    }
  });
  
  if (animatedCount === 0) {
    debugLog('没有找到可动画的窗扇');
  }
}

// 窗户开关动画
function animateWindow(windowObj: THREE.Object3D, open: boolean) {
  debugLog(`执行窗扇动画: open=${open}, object=${windowObj.name}`);
  const { sashType, width, height, hingeEdge } = windowObj.userData;
  
  // 创建动画
  const duration = 1.0 / animationSpeed.value;
  
  // 立即设置旋转角度而不是使用动画
  if (open) {
    // 根据铰链边缘设置旋转轴和角度
    if (hingeEdge === 'left') {
      // 左侧铰链 - 向内打开45度，绕Y轴负方向旋转
      windowObj.rotation.set(0, -Math.PI / 4, 0); // -45度
      debugLog(`设置左侧铰链旋转: Y轴 ${-Math.PI / 4} 弧度（-45度）- 向内打开`);
    } else if (hingeEdge === 'right') {
      // 右侧铰链 - 向内打开45度，绕Y轴正方向旋转
      windowObj.rotation.set(0, Math.PI / 4, 0); // 45度
      debugLog(`设置右侧铰链旋转: Y轴 ${Math.PI / 4} 弧度（45度）- 向内打开`);
    } else if (hingeEdge === 'bottom') {
      // 底部铰链 - 向内打开45度，绕X轴负方向旋转
      windowObj.rotation.set(-Math.PI / 4, 0, 0); // -45度
      debugLog(`设置底部铰链旋转: X轴 ${-Math.PI / 4} 弧度（-45度）- 向内打开`);
    }
    
    // 添加动画标志
    windowObj.userData.isOpen = true;
    debugLog(`窗扇已打开: ${sashType}, 铰链边: ${hingeEdge}, 当前角度: (${windowObj.rotation.x}, ${windowObj.rotation.y}, ${windowObj.rotation.z})`);
  } else {
    // 关闭窗扇 - 恢复到原始状态
    windowObj.rotation.set(0, 0, 0);
    
    // 移除打开标志
    windowObj.userData.isOpen = false;
    debugLog(`窗扇已关闭: ${sashType}`);
  }
  
  // 强制场景更新
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
  
  debugLog(`窗扇动画完成: ${open ? '打开' : '关闭'}`);
}

// 添加调试标记
function addDebugMarker(obj: THREE.Object3D, color = 0xff0000) {
  // 创建一个小球作为标记
  const markerGeo = ResourceManager.getSphereGeometry(0.05);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: color });
  const marker = new THREE.Mesh(markerGeo, markerMaterial);
  marker.name = "debugMarker";
  
  // 移除之前的标记
  obj.children.forEach(child => {
    if (child.name === "debugMarker") {
      obj.remove(child);
    }
  });
  
  // 添加到对象
  obj.add(marker);
  debugLog(`添加调试标记到: ${obj.name}`);
  
  // 确保渲染更新
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// 使用平滑动画移动相机
function moveCamera(
  targetPosition: THREE.Vector3, 
  targetLookAt: THREE.Vector3, 
  duration: number = 500
) {
  if (!camera || !controls) return;
  
  // 取消之前正在进行的动画
  if (cameraAnimationFrame.value !== null) {
    cancelAnimationFrame(cameraAnimationFrame.value);
  }
  
  // 设置动画参数
  cameraAnimationStartTime = Date.now();
  cameraAnimationDuration = duration;
  cameraAnimationStartPosition.copy(camera.position);
  cameraAnimationTargetPosition.copy(targetPosition);
  cameraAnimationStartTarget.copy(controls.target);
  cameraAnimationEndTarget.copy(targetLookAt);
  
  // 开始动画
  animateCameraPosition();
}

// 相机位置动画函数
function animateCameraPosition() {
  const now = Date.now();
  const elapsed = now - cameraAnimationStartTime;
  const progress = Math.min(elapsed / cameraAnimationDuration, 1.0);
  
  // 使用缓动函数使动画更加平滑
  const easeProgress = easeInOutCubic(progress);
  
  // 更新相机位置
  camera.position.lerpVectors(
    cameraAnimationStartPosition, 
    cameraAnimationTargetPosition, 
    easeProgress
  );
  
  // 更新控制器目标点
  controls.target.lerpVectors(
    cameraAnimationStartTarget,
    cameraAnimationEndTarget,
    easeProgress
  );
  
  // 更新控制器
  controls.update();
  
  // 渲染场景
  if (renderer && scene) {
    renderer.render(scene, camera);
  }
  
  // 如果动画未完成，继续下一帧
  if (progress < 1.0) {
    cameraAnimationFrame.value = requestAnimationFrame(animateCameraPosition);
  } else {
    cameraAnimationFrame.value = null;
  }
}

// 缓动函数
function easeInOutCubic(t: number): number {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// 重置相机位置也使用平滑动画
function resetCamera() {
  if (!camera || !windowGroup) return;
  
  // 计算窗户模型的包围盒，以便自动调整相机位置
  const boundingBox = new THREE.Box3().setFromObject(windowGroup);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  
  // 获取模型的中心点和尺寸
  boundingBox.getCenter(center);
  boundingBox.getSize(size);
  
  // 根据模型尺寸计算最佳观察距离
  const maxDim = Math.max(size.x, size.y);
  const fov = camera.fov * (Math.PI / 180);
  let cameraDistance = maxDim / (2 * Math.tan(fov / 2)) * 1.5;
  
  // 使用平滑动画重置相机
  const targetPosition = new THREE.Vector3(0, 0, cameraDistance);
  moveCamera(targetPosition, center);
  
  debugLog(`相机重置为正面视图，距离: ${cameraDistance}`);
}

// 从正面查看窗户 - 使用平滑动画
function viewFront() {
  if (!camera || !windowGroup || !controls) return;
  
  const boundingBox = new THREE.Box3().setFromObject(windowGroup);
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  
  // 计算合适的距离
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  const maxDim = Math.max(size.x, size.y);
  const fov = camera.fov * (Math.PI / 180);
  const cameraDistance = maxDim / (2 * Math.tan(fov / 2)) * 1.5;
  
  // 从正面(Z轴)观察 - 使用平滑动画
  const targetPosition = new THREE.Vector3(0, 0, cameraDistance);
  moveCamera(targetPosition, center);
}

// 从侧面查看窗户 - 使用平滑动画
function viewSide() {
  if (!camera || !windowGroup || !controls) return;
  
  const boundingBox = new THREE.Box3().setFromObject(windowGroup);
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  
  // 计算合适的距离
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  const maxDim = Math.max(size.z, size.y);
  const fov = camera.fov * (Math.PI / 180);
  const cameraDistance = maxDim / (2 * Math.tan(fov / 2)) * 1.5;
  
  // 从侧面(X轴)观察 - 使用平滑动画
  const targetPosition = new THREE.Vector3(cameraDistance, 0, 0);
  moveCamera(targetPosition, center);
}

// 从顶部查看窗户 - 使用平滑动画
function viewTop() {
  if (!camera || !windowGroup || !controls) return;
  
  const boundingBox = new THREE.Box3().setFromObject(windowGroup);
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  
  // 计算合适的距离
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  const maxDim = Math.max(size.x, size.z);
  const fov = camera.fov * (Math.PI / 180);
  const cameraDistance = maxDim / (2 * Math.tan(fov / 2)) * 1.5;
  
  // 从顶部(Y轴)观察 - 使用平滑动画
  const targetPosition = new THREE.Vector3(0, cameraDistance, 0);
  moveCamera(targetPosition, center);
}

// 3D角度查看窗户 - 使用平滑动画
function view3D() {
  if (!camera || !windowGroup || !controls) return;
  
  const boundingBox = new THREE.Box3().setFromObject(windowGroup);
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  
  // 计算合适的距离
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  const cameraDistance = maxDim / (2 * Math.tan(fov / 2)) * 1.8;
  
  // 设定一个俯视+侧视的组合视角，45度角观察 - 使用平滑动画
  const angle = Math.PI / 4; // 45度角
  const x = cameraDistance * Math.sin(angle);
  const y = cameraDistance * Math.sin(angle) * 0.8;
  const z = cameraDistance * Math.cos(angle);
  
  const targetPosition = new THREE.Vector3(x, y, z);
  moveCamera(targetPosition, center);
}

// 动画循环
function animate() {
  if (!isAnimationRunning.value) return;
  
  // 更新控制器
  if (controls) {
    controls.update();
  }
  
  // 检查相机是否移动（替代原来的 controls.changed）
  // 保存上一帧的相机位置和目标用于比较
  const prevCameraPosition = cameraPosition.value.clone();
  const prevControlsTarget = controlsTarget.value.clone();
  
  // 更新当前相机位置和目标
  if (camera) {
    cameraPosition.value.copy(camera.position);
  }
  if (controls) {
    controlsTarget.value.copy(controls.target);
  }
  
  // 检查相机是否移动
  const cameraHasMoved = !prevCameraPosition.equals(cameraPosition.value) || 
                         !prevControlsTarget.equals(controlsTarget.value);
  
  // 更新窗口动画，如果需要的话
  let needsRender = false;
  
  // 如果窗户正在打开或关闭
  if (isWindowMoving.value) {
    const currentTime = Date.now();
    const deltaTime = currentTime - lastAnimTime.value;
    lastAnimTime.value = currentTime;
    
    const angleToAdd = windowAnimSpeed.value * (deltaTime / 1000) * (isOpening.value ? 1 : -1);
    windowOpenAngle.value += angleToAdd;
    
    // 限制角度范围
    if (isOpening.value && windowOpenAngle.value >= maxOpenAngle.value) {
      windowOpenAngle.value = maxOpenAngle.value;
      isWindowMoving.value = false;
      emit('window-open-changed', true);
    } else if (!isOpening.value && windowOpenAngle.value <= 0) {
      windowOpenAngle.value = 0;
      isWindowMoving.value = false;
      emit('window-open-changed', false);
    }
    
    // 更新窗户旋转
    if (windowCasement.value) {
      windowCasement.value.rotation.y = windowOpenAngle.value;
    }
    
    needsRender = true;
  }
  
  // 只有在相机移动或窗口移动时才渲染
  if (cameraHasMoved || needsRender) {
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }
  
  // 继续动画循环
  frameId = requestAnimationFrame(animate);
}

// 初始化3D渲染
onMounted(() => {
  if (!container.value) return;
  
  // 初始化Three.js核心组件
  initScene();
  initCamera();
  initRenderer();
  initControls();
  
  // 加载纹理
  loadTextures();
  
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
  
  // 取消相机动画
  if (cameraAnimationFrame.value !== null) {
    cancelAnimationFrame(cameraAnimationFrame.value);
  }
  
  window.removeEventListener('resize', onWindowResize);
  
  // 清理Three.js资源
  if (renderer) {
    renderer.dispose();
    if (container.value) {
      container.value.removeChild(renderer.domElement);
    }
  }
  
  // 清理环境贴图
  if (envMap) {
    envMap.dispose();
  }
  
  // 调用清理资源函数
  ResourceManager.dispose();
});

// 监听窗户数据变化，更新3D模型
watch([() => props.windowStructure, () => props.windowConfig], () => {
  debugLog('检测到props.windowStructure或props.windowConfig变化，重新创建窗户模型');
  isLoading.value = true;
  
  // 延迟更新，确保数据已经完全更新
  nextTick(() => {
    createWindow();
  });
}, { deep: true });

// 监听initialOpen属性变化
watch(() => props.initialOpen, (newValue) => {
  if (newValue !== isWindowOpen.value) {
    toggleWindowOpen();
  }
});

// 导出组件方法
defineExpose({
  resetCamera,
  toggleWindowOpen,
  viewFront,
  viewSide,
  viewTop,
  view3D
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

.window-status {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
}

.window-status span {
  font-size: 12px;
  color: #666;
}

.status-text {
  font-weight: bold;
}

.status-open {
  color: #67c23a;
}

.status-closed {
  color: #909399;
}

.is-active {
  background-color: #409eff;
  color: white;
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