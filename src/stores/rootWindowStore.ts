import { ref, computed, watch, reactive } from 'vue'
import { defineStore } from 'pinia'
import { WindowStructure, getElementById, elementIdMap } from '../utils/RootWindow'
import { v4 as uuidv4 } from 'uuid';

export const useRootWindowStore = defineStore('rootWindowStore', () => {
  // 窗户基本配置
  const windowConfig = reactive({
    width: 1000,
    height: 1000,
    frameSize: 50,
  })
  
  const selectedElement = ref<any | null>(null);

  // 历史记录相关
  const history = ref<any[]>([]); // 历史状态数组
  const historyStep = ref(-1); // 当前历史位置
  const maxHistoryLength = 50; // 最大历史长度
  const isUndoRedoAction = ref(false); // 是否正在执行撤销/重做操作

  function setSelectedElement(id: string) {
    if (id) {
      selectedElement.value = getElementById(id);
    } else {
      selectedElement.value = null;
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
    );
    
    // 初始化后记录初始状态
    if (!isUndoRedoAction.value) {
      recordCurrentState();
    }
  }
  
  // 记录当前状态到历史记录
  function recordCurrentState() {
    if (isUndoRedoAction.value || !windowStructure.value) return;
    
    console.log('记录历史状态:', historyStep.value + 1);
    
    // 如果在历史中间执行了新操作，删除后面的历史记录
    if (historyStep.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyStep.value + 1);
    }
    
    // 复制当前窗户结构状态(深拷贝)
    const currentState = JSON.stringify(exportWindowConfig());
    
    // 添加到历史记录
    history.value.push(currentState);
    
    // 如果历史记录过长，删除最早的记录
    if (history.value.length > maxHistoryLength) {
      history.value.shift();
    }
    
    // 更新历史步骤
    historyStep.value = history.value.length - 1;
    
    console.log('历史记录长度:', history.value.length, '当前步骤:', historyStep.value);
  }
  
  // 从历史记录中恢复状态
  function restoreState(step: number) {
    isUndoRedoAction.value = true;
    
    try {
      const stateToRestore = JSON.parse(history.value[step]);
      
      // 清空现有元素ID映射
      for (const key of elementIdMap.keys()) {
        elementIdMap.delete(key);
      }
      
      // 重建窗户结构
      rebuildWindowStructure(stateToRestore);
      
      // 清除选中元素
      selectedElement.value = null;
      selectedArea.value = null;
      selectedMuntin.value = null;
      selectedSash.value = null;
      
      console.log('状态已恢复到步骤:', step);
    } catch (err) {
      console.error('恢复状态失败:', err);
    } finally {
      isUndoRedoAction.value = false;
    }
  }
  
  // 重建窗户结构
  function rebuildWindowStructure(config: any) {
    // 创建新的窗户结构
    windowStructure.value = new WindowStructure(
      config.width || windowConfig.width,
      config.height || windowConfig.height,
      config.frameSize || windowConfig.frameSize
    );
    
    // 更新窗户配置
    if (config.width) windowConfig.width = config.width;
    if (config.height) windowConfig.height = config.height;
    if (config.frameSize) windowConfig.frameSize = config.frameSize;
    
    // TODO: 可以进一步根据保存的配置重建所有中挺和窗扇
    // 这需要一个完整的递归实现，根据保存的结构和类型重建每个元素
  }
  
  // 删除选中元素
  function deleteSelectedElement() {
    if (!selectedElement.value) {
      console.log('没有选中的元素可删除');
      return;
    }
    
    // 记录删除前的状态
    recordCurrentState();
    
    const elementToDelete = selectedElement.value;
    console.log('删除元素:', elementToDelete.ele, elementToDelete.id);
    
    // 根据元素类型执行不同的删除操作
    if (elementToDelete.ele === 'window-muntin' && elementToDelete.parent) {
      // 删除中挺
      elementToDelete.parent.removeMuntin(elementToDelete.id);
      selectedElement.value = null;
      console.log('已删除中挺');
    } else if (elementToDelete.ele && elementToDelete.ele.includes('window-sash') && elementToDelete.parent) {
      // 删除窗扇
      elementToDelete.parent.removeSash(elementToDelete.id);
      selectedElement.value = null;
      console.log('已删除窗扇');
    } else if (elementToDelete.ele === 'window-empty-area' && elementToDelete.sash) {
      // 如果是空白区域且有窗扇，删除窗扇
      elementToDelete.removeSash(elementToDelete.sash.id);
      console.log('已删除区域内的窗扇');
    } else {
      console.log('无法删除此类型元素:', elementToDelete.ele);
    }
    
    // 删除后记录新状态
    recordCurrentState();
  }
  
  // 清空设计
  function clearDesign() {
    // 记录清空前的状态
    recordCurrentState();
    
    // 重新初始化窗户
    initializeWindow();
    
    // 清除选中
    selectedElement.value = null;
    selectedArea.value = null;
    selectedMuntin.value = null;
    selectedSash.value = null;
    
    console.log('设计已清空');
    
    // 清空后记录新状态
    recordCurrentState();
  }
  
  // 更新窗户尺寸
  function updateWindowSize(width: number, height: number) {
    // 记录更新前的状态
    recordCurrentState();
    
    windowConfig.width = width;
    windowConfig.height = height;
    
    if (windowStructure.value) {
      // 重新创建窗户实例
      initializeWindow();
    }
    
    // 更新后记录新状态
    recordCurrentState();
  }
  
  // 更新窗框尺寸
  function updateFrameSize(size: number) {
    // 记录更新前的状态
    recordCurrentState();
    
    windowConfig.frameSize = size;
    
    if (windowStructure.value) {
      // 重新创建窗户实例
      initializeWindow();
    }
    
    // 更新后记录新状态
    recordCurrentState();
  }
  
  // 添加窗扇
  function addSash() {
    if (!windowStructure.value) return;
    if (!selectedElement.value) {
      console.warn("未找到选中的元素");
      return;
    }
    
    // 记录添加前的状态
    recordCurrentState();
    
    if (selectedElement.value.constructor && selectedElement.value.constructor.name === 'WindowEmptyArea') {
      selectedElement.value.addSash(sashType.value);
      console.log('已添加窗扇:', sashType.value);
    }
    
    // 添加后记录新状态
    recordCurrentState();
  }
  
  // 导出窗户配置
  function exportWindowConfig() {
    // 将windowStructure转换为JSON配置
    if (!windowStructure.value) return null;
    
    const serializeWindow = (obj: any): any => {
      const result: Record<string, any> = {};
      
      // 复制基础属性
      ['id', 'x', 'y', 'width', 'height', 'direction', 'type', 'thickness', 'splitDirection', 'frameSize', 'color', 'sashType', 'ele', 'tag', 'parentId'].forEach((prop: string) => {
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
      
      // 处理框架
      if (obj.frame) {
        result.frame = serializeWindow(obj.frame);
      }
      
      // 处理玻璃
      if (obj.glass) {
        result.glass = serializeWindow(obj.glass);
      }
      
      // 处理把手
      if (obj.handle) {
        result.handle = serializeWindow(obj.handle);
      }
      
      // 处理主区域
      if (obj.mainArea) {
        result.mainArea = serializeWindow(obj.mainArea);
      }
      
      // 添加类型标识
      result.type = obj.constructor ? obj.constructor.name : 'Unknown';
      
      // 窗户结构特殊处理
      if (obj instanceof WindowStructure) {
        result.width = windowConfig.width;
        result.height = windowConfig.height;
        result.frameSize = windowConfig.frameSize;
      }
      
      return result;
    };
    
    return serializeWindow(windowStructure.value);
  }
  
  // 导入窗户配置
  function importWindowConfig(config: any) {
    // 实现配置导入逻辑
    if (!config) return;
    
    rebuildWindowStructure(config);
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
  
  // 当窗户结构变化时，监听并记录历史
  watch(() => windowStructure.value, (newVal) => {
    if (newVal && history.value.length === 0) {
      // 初始状态记录
      recordCurrentState();
    }
  });
  
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
    deleteSelectedElement,
    clearDesign,
    // 暴露历史相关状态用于调试
    history,
    historyStep
  }
})
