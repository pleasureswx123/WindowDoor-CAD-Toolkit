import { ref, computed, watch, reactive } from 'vue'
import { defineStore } from 'pinia'
import { WindowStructure, getElementById, elementIdMap } from '../utils/RootWindow'
import { v4 as uuidv4 } from 'uuid';
import { saveWindowDesign, getWindowDesignById, getWindowDesignList, deleteWindowDesign, generateThumbnail } from '../utils/IndexedDBService';
import type { WindowDesign } from '../utils/IndexedDBService';

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
  
  // 当前窗户设计的ID和名称
  const currentDesignId = ref<string | null>(null);
  const currentDesignName = ref<string>('未命名设计');
  
  // 保存窗户设计列表
  const windowDesignList = ref<WindowDesign[]>([]);
  
  // 加载中状态
  const isLoading = ref(false);

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
    
    // 重置当前设计ID和名称
    currentDesignId.value = null;
    currentDesignName.value = '未命名设计';
    
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
    if (!config) return;

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

    // 递归重建窗户结构
    function rebuildElement(element: any, parentArea: any = null) {
      if (!element || !windowStructure.value) return;

      const area = parentArea || windowStructure.value.mainArea;

      // 处理分割区域
      if (element.splitDirection && element.children && element.children.length > 0) {
        // 计算分割位置
        const splitPosition = {
          x: element.splitDirection === 'vertical' ? 
            element.children[1].x + element.children[1].width / 2 : 
            0,
          y: element.splitDirection === 'horizontal' ? 
            element.children[1].y + element.children[1].height / 2 : 
            0
        };

        // 分割区域
        area.splitArea(element.splitDirection, splitPosition);

        // 递归处理子区域
        element.children.forEach((child: any, index: number) => {
          // 跳过中挺（index === 1）
          if (index !== 1 && area.children) {
            // 使用对应的子区域作为父区域
            const childArea = index === 0 ? area.children[0] : area.children[2];
            rebuildElement(child, childArea);
          }
        });
      }
      // 处理窗扇
      else if (element.sash && !area.children.length) {
        area.addSash(element.sash.sashType || 'fixed');
      }
    }

    // 开始从主区域重建
    if (config.mainArea) {
      rebuildElement(config.mainArea);
    }
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
  
  // 创建新窗户
  function createNewWindow(width: number, height: number, frameSize: number, name: string = '未命名设计') {
    // 更新窗户配置
    windowConfig.width = width;
    windowConfig.height = height;
    windowConfig.frameSize = frameSize;
    
    // 更新设计名称
    currentDesignName.value = name;
    currentDesignId.value = null;
    
    // 初始化窗户
    initializeWindow();
    
    // 重置视图
    resetView();
    
    return true;
  }
  
  // 保存窗户设计到IndexedDB
  async function saveWindowDesignToDB(name?: string, getThumbnail?: () => string): Promise<string | null> {
    try {
      if (!windowStructure.value) {
        console.error('没有可保存的窗户设计');
        return null;
      }
      
      // 如果提供了新名称，则更新当前设计名称
      if (name) {
        currentDesignName.value = name;
      }
      
      // 导出窗户配置
      const config = exportWindowConfig();
      
      // 获取缩略图
      let thumbnail = '';
      if (getThumbnail) {
        thumbnail = getThumbnail();
      }
      
      // 保存到数据库
      const savedId = await saveWindowDesign({
        id: currentDesignId.value || undefined,
        name: currentDesignName.value,
        width: windowConfig.width,
        height: windowConfig.height,
        frameSize: windowConfig.frameSize,
        thumbnail,
        data: config
      });
      
      // 更新当前设计ID
      currentDesignId.value = savedId;
      
      // 刷新窗户设计列表
      await loadWindowDesignList();
      
      console.log('窗户设计保存成功:', savedId);
      return savedId;
    } catch (error) {
      console.error('保存窗户设计失败:', error);
      return null;
    }
  }
  
  // 加载窗户设计列表
  async function loadWindowDesignList() {
    try {
      isLoading.value = true;
      windowDesignList.value = await getWindowDesignList();
      console.log('加载窗户设计列表成功, 共', windowDesignList.value.length, '个设计');
    } catch (error) {
      console.error('加载窗户设计列表失败:', error);
    } finally {
      isLoading.value = false;
    }
  }
  
  // 清除历史记录
  function clearHistory() {
    // 清除选中元素
    selectedElement.value = null;
    selectedArea.value = null;
    selectedMuntin.value = null;
    selectedSash.value = null;
    
    // 重置视图
    resetView();
    
    // 重置历史记录
    history.value = [];
    historyStep.value = -1;

    // 清空元素ID映射
    for (const key of elementIdMap.keys()) {
      elementIdMap.delete(key);
    }
  }
  
  // 加载窗户设计
  async function loadWindowDesign(id: string) {
    try {
      const design = await getWindowDesignById(id);
      if (!design) {
        throw new Error('未找到窗户设计');
      }

      // 更新当前设计ID和名称
      currentDesignId.value = design.id;
      currentDesignName.value = design.name;

      // 清除历史记录
      clearHistory();

      // 重建窗户结构
      rebuildWindowStructure(design.data);

      // 记录初始状态
      recordCurrentState();

      return true;
    } catch (error) {
      console.error('加载窗户设计失败:', error);
      throw error;
    }
  }
  
  // 删除窗户设计
  async function deleteWindowDesignFromDB(id: string): Promise<boolean> {
    try {
      await deleteWindowDesign(id);
      
      // 如果删除的是当前设计，则重置当前设计
      if (currentDesignId.value === id) {
        initializeWindow();
        resetView();
      }
      
      // 刷新窗户设计列表
      await loadWindowDesignList();
      
      console.log('删除窗户设计成功:', id);
      return true;
    } catch (error) {
      console.error('删除窗户设计失败:', error);
      return false;
    }
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
    historyStep,
    // 暴露IndexedDB相关方法和状态
    createNewWindow,
    saveWindowDesignToDB,
    loadWindowDesignList,
    loadWindowDesign,
    deleteWindowDesignFromDB,
    windowDesignList,
    currentDesignId,
    currentDesignName,
    isLoading
  }
})
