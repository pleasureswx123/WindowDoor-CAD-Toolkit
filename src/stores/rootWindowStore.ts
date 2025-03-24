import { ref, computed, watch, reactive } from 'vue'
import { defineStore } from 'pinia'
import { WindowStructure, getElementById } from '../utils/RootWindow'

export const useRootWindowStore = defineStore('rootWindowStore', () => {
  // 窗户基本配置
  const windowConfig = reactive({
    width: 1000,
    height: 1000,
    frameSize: 50,
  })
  
  const selectedElement = ref<any | null>(null);

  function setSelectedElement(id: string) {
    if (id) {
      selectedElement.value = getElementById(id);
    }
  }
  
  // 窗户实例引用
  const windowStructure = ref<WindowStructure | null>(null)
  
  // 选中相关状态
  const selectedArea = ref<string | null>(null)
  const selectedMuntin = ref<string | null>(null)
  const selectedSash = ref<string | null>(null)
  
  // 工具状态
  const activeTool = ref<'select' | 'split' | 'sash' | 'pan' | 'zoomIn' | 'zoomOut' | 'rectSelect' | 'rotate' | 'transform' | null>('select')
  const splitDirection = ref<'horizontal' | 'vertical'>('vertical')
  const sashType = ref<'fixed' | 'left' | 'right' | 'tiltLeft' | 'tiltRight'>('fixed')
  
  // 视图状态
  const viewState = reactive({
    scale: 0.5,
    x: 0,
    y: 0,
    resetRequested: false
  });
  
  // 创建/初始化窗户结构
  function initializeWindow() {
    windowStructure.value = new WindowStructure(
      windowConfig.width,
      windowConfig.height,
      windowConfig.frameSize
    )
  }
  
  // 更新窗户尺寸
  function updateWindowSize(width: number, height: number) {
    windowConfig.width = width
    windowConfig.height = height
    
    if (windowStructure.value) {
      // 重新创建窗户实例
      initializeWindow()
    }
  }
  
  // 更新窗框尺寸
  function updateFrameSize(size: number) {
    windowConfig.frameSize = size
    
    if (windowStructure.value) {
      // 重新创建窗户实例
      initializeWindow()
    }
  }
  
  // 添加窗扇
  function addSash() {
    if (!windowStructure.value) return;
    if (!selectedElement.value) {
      console.warn("未找到选中的元素");
      return;
    }
    if (selectedElement.value.constructor && selectedElement.value.constructor.name === 'WindowEmptyArea') {
      selectedElement.value.addSash(sashType.value);
    }
  }
  
  // 导出窗户配置
  function exportWindowConfig() {
    // 将windowStructure转换为JSON配置
    if (!windowStructure.value) return null
    
    const serializeWindow = (obj: any): any => {
      const result: Record<string, any> = {};
      
      // 复制基础属性
      ['id', 'x', 'y', 'width', 'height', 'direction', 'type', 'thickness', 'splitDirection'].forEach((prop: string) => {
        if (obj && obj[prop] !== undefined) {
          result[prop] = obj[prop];
        }
      });
      
      // 处理子元素
      if (obj.children && obj.children.length > 0) {
        result.children = obj.children.map((child: any) => serializeWindow(child));
      }
      
      // 处理特殊对象
      if (obj.sash) {
        result.sash = serializeWindow(obj.sash);
      }
      
      // 添加类型标识
      result.type = obj.constructor ? obj.constructor.name : 'Unknown';
      
      return result;
    };
    
    return serializeWindow(windowStructure.value);
  }
  
  // 导入窗户配置
  function importWindowConfig(config: any) {
    // TODO: 实现配置导入逻辑
  }
  
  // 重置视图
  function resetView() {
    // 不直接设置固定值，而是让组件处理
    // 只设置标志位
    viewState.resetRequested = true;
    
    // 记录重置请求时间
    console.log('请求重置视图:', new Date().toISOString());
  }
  
  // 应用设置
  function updateSettings(settings: { showGrid?: boolean, showDimensions?: boolean, units?: string }) {
    // 将来可以添加更多设置处理逻辑
    console.log('应用设置:', settings);
  }
  
  // 撤销操作
  function undo() {
    console.log('执行撤销操作');
    // TODO: 实现撤销功能
  }
  
  // 重做操作
  function redo() {
    console.log('执行重做操作');
    // TODO: 实现重做功能
  }
  
  return {
    windowConfig,
    windowStructure,
    selectedArea,
    selectedMuntin,
    selectedSash,
    activeTool,
    splitDirection,
    sashType,
    viewState,
    initializeWindow,
    updateWindowSize,
    updateFrameSize,
    addSash,
    exportWindowConfig,
    importWindowConfig,
    selectedElement,
    setSelectedElement,
    resetView,
    updateSettings,
    undo,
    redo,
  }
})
