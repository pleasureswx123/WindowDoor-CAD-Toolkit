import { defineStore } from 'pinia';
import { ref, computed, nextTick, watch } from 'vue';

// 分隔线尺寸常量
const DEVIDER_SIZE = 40;

// 生成唯一ID
function generateId(): number {
  return Math.round(Math.random() * 10000);
}

// 区域类型接口
export interface SectionAttrs {
  width: number;
  height: number;
  frameSize?: number;
  type?: string;
}

// 分隔线类型接口
export interface DeviderAttrs {
  width: number;
  height: number;
  thickness?: number; // 中挺厚度，默认为40
}

// 区域类
export class Section {
  nodeType = "section";
  id: number;
  width: number;
  height: number;
  frameSize: number;
  type: string;
  splitDirection: string | null;
  sections: Array<Section | Devider>;

  constructor(attrs: SectionAttrs) {
    this.id = generateId();
    this.width = attrs.width;
    this.height = attrs.height;
    
    // 根据窗户类型决定框架尺寸
    if (attrs.type === "none") {
      // 固定窗无框架
      this.frameSize = 0;
    } else {
      // 其他类型使用传入的值或默认值
      this.frameSize = attrs.frameSize !== undefined ? attrs.frameSize : 50;
    }
    
    // 窗扇类型，默认为空("empty")
    // 可选值：
    // - "empty"：未配置的空区域，需要用户进一步配置
    // - "none"：固定窗，不可开启
    // - "left"：向左开启
    // - "right"：向右开启
    // - "tilt,left" / "tilt,right"：倾斜并开启
    this.type = attrs.type || "empty";
    
    this.splitDirection = null;
    this.sections = [];
  }
}

// 分隔线类
export class Devider {
  nodeType = "devider";
  id: number;
  width: number;
  height: number;
  sections: any[];
  thickness?: number; // 中挺厚度，默认为40

  constructor(attrs: DeviderAttrs) {
    this.id = generateId();
    this.width = attrs.width;
    this.height = attrs.height;
    this.thickness = attrs.thickness || DEVIDER_SIZE;
    this.sections = [];
  }
}

export const useWindowDoorStore = defineStore('windowDoor', () => {
  const WINDOW_WIDTH = 1000;
  const WINDOW_HEIGHT = 2000;
  const FRAME_SIZE = 50;

  // 初始化root对象，确保有默认值
  const root = ref<any>({
    id: "root",
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    frameSize: FRAME_SIZE,
    splitDirection: null,
    sections: []
  });

  const selectedSectionId = ref<number | null>(null);
  const selectedDeviderId = ref<number | null>(null); // 添加选中中挺ID
  const metricsUpdateCounter = ref(0);
  
  // 控制标注尺寸的显示状态，默认显示
  const showMetrics = ref(true);
  
  // 切换标注尺寸的显示状态
  function toggleMetricsVisibility() {
    showMetrics.value = !showMetrics.value;
    // 触发UI更新
    triggerMetricsUpdate();
  }
  
  // 获取当前标注尺寸的显示状态
  function isMetricsVisible() {
    return showMetrics.value;
  }

  // 选中的区域
  const selectedSection = computed(() => {
    if (!selectedSectionId.value) return null;
    
    // 递归查找嵌套的区域
    function findNested(sec: any, id: number): any {
      if (sec.id === id) {
        return sec;
      }
      if (!sec.sections) {
        return null;
      }
      for (let i = 0; i < sec.sections.length; i++) {
        const founded = findNested(sec.sections[i], id);
        if (founded) {
          return founded;
        }
      }
      return null;
    }
    
    return findNested(root.value, selectedSectionId.value);
  });
  
  // 选中的中挺
  const selectedDevider = computed(() => {
    if (!selectedDeviderId.value) return null;
    
    // 递归查找嵌套的中挺
    function findNestedDevider(sec: any, id: number): any {
      if (sec.nodeType === "devider" && sec.id === id) {
        return sec;
      }
      if (!sec.sections) {
        return null;
      }
      for (let i = 0; i < sec.sections.length; i++) {
        const founded = findNestedDevider(sec.sections[i], id);
        if (founded) {
          return founded;
        }
      }
      return null;
    }
    
    return findNestedDevider(root.value, selectedDeviderId.value);
  });
  
  // 当选择区域时，清除中挺选择
  watch(selectedSectionId, (newId) => {
    if (newId !== null) {
      selectedDeviderId.value = null;
    }
  });
  
  // 当选择中挺时，清除区域选择
  watch(selectedDeviderId, (newId) => {
    if (newId !== null) {
      selectedSectionId.value = null;
    }
  });

  // 设置区域类型
  function setSectionType(type: string) {
    if (!selectedSection.value) return;
    
    selectedSection.value.type = type;
    
    if (type === "none") {
      selectedSection.value.frameSize = 0;
    } else {
      selectedSection.value.frameSize = selectedSection.value.frameSize || 50;
    }
  }

  // 分割当前选中的区域
  function splitCurrentSection(direction: string) {
    if (!selectedSection.value) return;
    
    const section = selectedSection.value;
    
    // 检查区域是否已配置窗扇类型
    if (section.type !== "empty") {
      // 显示确认对话框或自动重置区域类型
      if (window.confirm("该区域已配置窗扇类型，需要先移除配置才能进行分割。是否继续？")) {
        // 保存框架尺寸，以便在分割后恢复
        const savedFrameSize = section.frameSize || FRAME_SIZE;
        
        // 重置为空区域
        section.type = "empty";
        section.frameSize = FRAME_SIZE;
        console.log("已重置区域为空区域，将进行分割");
      } else {
        // 用户取消操作
        console.log("用户取消了分割操作");
        return;
      }
    }
    
    section.splitDirection = direction;
    
    // 保存当前的frameSize用于新区域（只有在非固定窗类型时才需要）
    const currentFrameSize = section.frameSize;
    // 保存当前的type，在特殊情况下继承给子区域
    const currentType = section.type;
    
    if (direction === "vertical") {
      section.sections.push(
        new Section({
          width: section.width / 2 - DEVIDER_SIZE / 2,
          height: section.height,
          // 默认创建空区域，等待用户配置
          type: "empty"
        }),
        new Devider({
          width: DEVIDER_SIZE,
          height: section.height,
        }),
        new Section({
          width: section.width / 2 - DEVIDER_SIZE / 2,
          height: section.height,
          // 默认创建空区域，等待用户配置
          type: "empty"
        })
      );
    } else {
      section.sections.push(
        new Section({
          width: section.width,
          height: section.height / 2 - DEVIDER_SIZE / 2,
          // 默认创建空区域，等待用户配置
          type: "empty"
        }),
        new Devider({
          width: section.width,
          height: DEVIDER_SIZE,
        }),
        new Section({
          width: section.width,
          height: section.height / 2 - DEVIDER_SIZE / 2,
          // 默认创建空区域，等待用户配置
          type: "empty"
        })
      );
    }
    
    // 清除选择
    selectedSectionId.value = null;
  }

  // 触发度量标注更新
  function triggerMetricsUpdate() {
    metricsUpdateCounter.value++;
  }
  
  // 更新窗户尺寸
  function updateWindowSize(width: number, height: number) {
    console.log(`更新窗户尺寸: ${root.value.width}x${root.value.height} -> ${width}x${height}`);
    
    // 保存旧尺寸，用于计算缩放比例
    const oldWidth = root.value.width;
    const oldHeight = root.value.height;
    
    // 确保窗户尺寸不小于最小值
    width = Math.max(width, root.value.frameSize * 2 + 10);
    height = Math.max(height, root.value.frameSize * 2 + 10);
    
    // 更新根窗户尺寸
    root.value.width = width;
    root.value.height = height;
    
    // 计算内部区域尺寸 (减去两边的框架)
    const innerWidth = Math.max(10, width - root.value.frameSize * 2);
    const innerHeight = Math.max(10, height - root.value.frameSize * 2);
    
    console.log(`计算内部区域尺寸: ${innerWidth}x${innerHeight}`);
    
    // 更新根区域的内部尺寸
    if (root.value.sections[0]) {
      // 如果有子区域，需要更新已分割区域的尺寸
      if (root.value.sections[0].sections && root.value.sections[0].sections.length > 0) {
        console.log('已存在子区域，需要递归调整尺寸');
        
        // 如果有分割，需要按比例调整所有子区域尺寸
        if (root.value.sections[0].splitDirection === 'vertical') {
          // 水平调整宽度
          const widthRatio = innerWidth / root.value.sections[0].width;
          console.log(`计算水平缩放比例: ${widthRatio}`);
          
          // 更新当前区域尺寸
          root.value.sections[0].width = innerWidth;
          root.value.sections[0].height = innerHeight;
          
          // 递归调整子区域
          adjustChildrenSizes(root.value.sections[0], widthRatio, 1);
        } 
        else if (root.value.sections[0].splitDirection === 'horizontal') {
          // 垂直调整高度
          const heightRatio = innerHeight / root.value.sections[0].height;
          console.log(`计算垂直缩放比例: ${heightRatio}`);
          
          // 更新当前区域尺寸
          root.value.sections[0].width = innerWidth;
          root.value.sections[0].height = innerHeight;
          
          // 递归调整子区域
          adjustChildrenSizes(root.value.sections[0], 1, heightRatio);
        }
        else {
          // 没有分割方向但有子区域的情况
          root.value.sections[0].width = innerWidth;
          root.value.sections[0].height = innerHeight;
        }
      } 
      else {
        // 没有子区域，直接更新尺寸
        root.value.sections[0].width = innerWidth;
        root.value.sections[0].height = innerHeight;
      }
    }
    
    // 通知度量标注更新
    triggerMetricsUpdate();
  }

  // 递归调整子区域尺寸
  function adjustChildrenSizes(section: any, widthRatio: number, heightRatio: number) {
    if (!section.sections || section.sections.length === 0) {
      return;
    }
    
    for (const child of section.sections) {
      // 保存原来的类型
      const originalType = child.type;
      
      // 按比例调整尺寸
      if (widthRatio !== 1) {
        child.width = Math.max(10, Math.round(child.width * widthRatio));
      }
      if (heightRatio !== 1) {
        child.height = Math.max(10, Math.round(child.height * heightRatio));
      }
      
      // 确保类型不变
      if (child.nodeType === 'section') {
        child.type = originalType;
      }
      
      console.log(`调整子区域 ${child.id} 尺寸: ${child.width}x${child.height}, 类型: ${child.type}`);
      
      // 递归处理
      adjustChildrenSizes(child, widthRatio, heightRatio);
    }
  }

  // 更新框架尺寸
  function updateFrameSize(newFrameSize: number, target: 'root' | 'section' = 'root') {
    console.log(`更新框架尺寸: ${target === 'root' ? '窗户外框' : '窗扇框架'}, ${target === 'root' ? root.value.frameSize : selectedSection.value?.frameSize} -> ${newFrameSize}`);
    
    if (target === 'root') {
      // 如果是更新根窗户外框
      if (newFrameSize === root.value.frameSize) {
        console.log('外框尺寸未变化，跳过更新');
        return;
      }
      
      // 保存当前外框尺寸和框架尺寸
      const currentWidth = root.value.width;
      const currentHeight = root.value.height;
      const currentFrameSize = root.value.frameSize;
      
      // 更新框架尺寸
      root.value.frameSize = newFrameSize;
      
      // 计算新的内部尺寸 - 保持外部尺寸不变，内部尺寸相应调整
      const newInnerWidth = Math.max(10, currentWidth - newFrameSize * 2);
      const newInnerHeight = Math.max(10, currentHeight - newFrameSize * 2);
      
      console.log(`调整内部区域尺寸: ${root.value.sections[0].width}x${root.value.sections[0].height} -> ${newInnerWidth}x${newInnerHeight}`);
      
      // 更新根区域的内部尺寸
      root.value.sections[0].width = newInnerWidth;
      root.value.sections[0].height = newInnerHeight;
      
      // 不再自动更新所有窗扇的frameSize
    } else {
      // 如果是更新窗扇框架
      if (!selectedSection.value) {
        console.log('没有选中的窗扇，无法更新');
        return;
      }
      
      // 固定窗不能更改框架尺寸，必须保持为0
      if (selectedSection.value.type === "none") {
        console.log('固定窗的框架尺寸必须为0，无法修改');
        return;
      }
      
      if (newFrameSize === selectedSection.value.frameSize) {
        console.log('窗扇框架尺寸未变化，跳过更新');
        return;
      }
      
      // 更新选中窗扇的框架尺寸
      selectedSection.value.frameSize = newFrameSize;
    }
    
    // 触发度量标注更新
    triggerMetricsUpdate();
  }

  // 更新指定区域的尺寸
  function updateSectionSize(sectionId: number | string, width?: number, height?: number) {
    console.log(`开始更新区域尺寸: ${sectionId}, width: ${width}, height: ${height}`);
    
    // 处理特殊的根框架尺寸调整
    if (sectionId === 'root-width' && width !== undefined) {
      // 调整整个窗户宽度
      updateWindowSize(width, root.value.height);
      return;
    } else if (sectionId === 'root-height' && height !== undefined) {
      // 调整整个窗户高度
      updateWindowSize(root.value.width, height);
      return;
    } else if (sectionId === 'frame-size' && width !== undefined) {
      // 处理根框架尺寸更新
      updateFrameSize(width, 'root');
      return;
    } else if (sectionId === 'section-frame-size' && width !== undefined && selectedSection.value) {
      // 处理窗扇框架尺寸更新
      updateFrameSize(width, 'section');
      return;
    }
    
    // 确保sectionId是数字类型
    if (typeof sectionId !== 'number') return;
    
    // 递归查找嵌套的区域
    function findNested(sec: any, id: number): any {
      if (sec.id === id) {
        return sec;
      }
      if (!sec.sections) {
        return null;
      }
      for (let i = 0; i < sec.sections.length; i++) {
        const founded = findNested(sec.sections[i], id);
        if (founded) {
          return founded;
        }
      }
      return null;
    }

    // 查找指定区域
    const section = findNested(root.value, sectionId);
    
    if (!section) {
      console.warn(`未找到ID为${sectionId}的区域`);
      return;
    }
    
    console.log(`找到区域:`, section.nodeType, section.id);
    
    // 保存原尺寸
    const oldWidth = section.width;
    const oldHeight = section.height;
    
    // 更新尺寸
    let hasChanged = false;
    
    if (width !== undefined && width !== oldWidth) {
      section.width = width;
      hasChanged = true;
      console.log(`宽度已更新: ${oldWidth} -> ${width}`);
    }
    
    if (height !== undefined && height !== oldHeight) {
      section.height = height;
      hasChanged = true;
      console.log(`高度已更新: ${oldHeight} -> ${height}`);
    }
    
    // 如果没有变化，无需继续处理
    if (!hasChanged) {
      console.log('没有实际尺寸变化，跳过后续处理');
      return;
    }
    
    // 如果是根窗户的直接子区域，需要更新根窗户尺寸
    if (section.id === root.value.sections[0].id) {
      // 调整根窗户的尺寸
      const frameSize = root.value.frameSize;
      if (width !== undefined) {
        root.value.width = width + frameSize * 2;
      }
      if (height !== undefined) {
        root.value.height = height + frameSize * 2;
      }
      console.log('更新了根窗户尺寸');
      triggerMetricsUpdate();
      return;
    }
    
    // 查找父区域以及当前区域在父区域中的索引
    function findParentAndIndex(root: any, id: number): { parent: any, index: number } | null {
      if (!root.sections || root.sections.length === 0) return null;
      
      for (let i = 0; i < root.sections.length; i++) {
        if (root.sections[i].id === id) {
          return { parent: root, index: i };
        }
        const result = findParentAndIndex(root.sections[i], id);
        if (result) return result;
      }
      
      return null;
    }
    
    // 查找父区域
    const parentInfo = findParentAndIndex(root.value, sectionId);
    if (!parentInfo) {
      console.warn('未找到父区域，将直接触发度量更新');
      triggerMetricsUpdate();
      return;
    }
    
    const { parent, index } = parentInfo;
    console.log(`找到父区域: ${parent.nodeType || 'root'}, 索引: ${index}, 分割方向: ${parent.splitDirection}`);
    
    // 根据父区域的分割方向调整相邻区域
    if (parent.splitDirection === 'vertical' && width !== undefined) {
      // 垂直分割的情况，调整水平相邻区域
      // 检查右边是否有分隔线和相邻区域
      if (index + 2 < parent.sections.length) {
        // 调整右侧区域的宽度
        const rightSection = parent.sections[index + 2];
        const widthDiff = width - oldWidth;
        rightSection.width -= widthDiff;
        console.log(`调整了右侧区域 ${rightSection.id} 的宽度: ${rightSection.width + widthDiff} -> ${rightSection.width}`);
      }
    } else if (parent.splitDirection === 'horizontal' && height !== undefined) {
      // 水平分割的情况，调整垂直相邻区域
      // 检查下边是否有分隔线和相邻区域
      if (index + 2 < parent.sections.length) {
        // 调整下方区域的高度
        const bottomSection = parent.sections[index + 2];
        const heightDiff = height - oldHeight;
        bottomSection.height -= heightDiff;
        console.log(`调整了下方区域 ${bottomSection.id} 的高度: ${bottomSection.height + heightDiff} -> ${bottomSection.height}`);
      }
    }
    
    // 更新分隔条尺寸
    if (section.nodeType === 'devider') {
      console.log('检测到分隔条调整，确保更新相关区域');
      
      // 针对分隔条的特殊处理，确保相邻区域正确更新
      if (width !== undefined && parent.splitDirection === 'vertical') {
        // 检查是否需要调整前后区域的宽度和位置
        if (index > 0 && index + 1 < parent.sections.length) {
          console.log('更新垂直分隔条相邻区域');
        }
      } else if (height !== undefined && parent.splitDirection === 'horizontal') {
        // 检查是否需要调整上下区域的高度和位置
        if (index > 0 && index + 1 < parent.sections.length) {
          console.log('更新水平分隔条相邻区域');
        }
      }
    }
    
    // 无论如何都触发度量标注更新
    console.log('触发度量标注更新');
    triggerMetricsUpdate();
  }

  // 初始化窗户布局，创建预设的窗扇和分隔条
  function initializeWindowWithSections(pattern: string = 'default') {
    // 清除选择
    selectedSectionId.value = null;
    
    // 根据不同的模式创建不同的布局
    if (pattern === 'default' || pattern === 'single') {
      // 单窗扇布局 - 默认空区域
      root.value = {
        id: "root",
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        frameSize: FRAME_SIZE,
        splitDirection: null,
        sections: [
          new Section({
            width: WINDOW_WIDTH - FRAME_SIZE * 2,
            height: WINDOW_HEIGHT - FRAME_SIZE * 2,
            type: "empty" // 默认空区域，等待用户配置
          })
        ]
      };
    } else if (pattern === 'fixed-window') {
      // 固定窗布局 - 显式指定固定窗类型
      root.value = {
        id: "root",
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        frameSize: FRAME_SIZE,
        splitDirection: null,
        sections: [
          new Section({
            width: WINDOW_WIDTH - FRAME_SIZE * 2,
            height: WINDOW_HEIGHT - FRAME_SIZE * 2,
            type: "none" // 固定窗 - frameSize会在构造函数中自动设为0
          })
        ]
      };
    } else if (pattern === 'right-window') {
      // 右开窗布局
      root.value = {
        id: "root",
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        frameSize: FRAME_SIZE,
        splitDirection: null,
        sections: [
          new Section({
            width: WINDOW_WIDTH - FRAME_SIZE * 2,
            height: WINDOW_HEIGHT - FRAME_SIZE * 2,
            type: "right" // 右开窗
          })
        ]
      };
    } else if (pattern === 'double-horizontal') {
      // 两个水平排列的窗扇
      const mainSection = new Section({
        width: WINDOW_WIDTH - FRAME_SIZE * 2,
        height: WINDOW_HEIGHT - FRAME_SIZE * 2,
        frameSize: FRAME_SIZE
      });
      
      mainSection.splitDirection = 'vertical';
      mainSection.sections = [
        new Section({
          width: (WINDOW_WIDTH - FRAME_SIZE * 2) / 2 - DEVIDER_SIZE / 2,
          height: WINDOW_HEIGHT - FRAME_SIZE * 2,
          frameSize: FRAME_SIZE,
          type: "left" // 左开窗
        }),
        new Devider({
          width: DEVIDER_SIZE,
          height: WINDOW_HEIGHT - FRAME_SIZE * 2
        }),
        new Section({
          width: (WINDOW_WIDTH - FRAME_SIZE * 2) / 2 - DEVIDER_SIZE / 2,
          height: WINDOW_HEIGHT - FRAME_SIZE * 2,
          frameSize: FRAME_SIZE,
          type: "right" // 右开窗
        })
      ];
      
      root.value = {
        id: "root",
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        frameSize: FRAME_SIZE,
        splitDirection: null,
        sections: [mainSection]
      };
    } else if (pattern === 'double-vertical') {
      // 两个垂直排列的窗扇
      const mainSection = new Section({
        width: WINDOW_WIDTH - FRAME_SIZE * 2,
        height: WINDOW_HEIGHT - FRAME_SIZE * 2,
        frameSize: FRAME_SIZE
      });
      
      mainSection.splitDirection = 'horizontal';
      mainSection.sections = [
        new Section({
          width: WINDOW_WIDTH - FRAME_SIZE * 2,
          height: (WINDOW_HEIGHT - FRAME_SIZE * 2) / 2 - DEVIDER_SIZE / 2,
          frameSize: FRAME_SIZE,
          type: "tilt" // 倾斜窗
        }),
        new Devider({
          width: WINDOW_WIDTH - FRAME_SIZE * 2,
          height: DEVIDER_SIZE
        }),
        new Section({
          width: WINDOW_WIDTH - FRAME_SIZE * 2,
          height: (WINDOW_HEIGHT - FRAME_SIZE * 2) / 2 - DEVIDER_SIZE / 2,
          frameSize: FRAME_SIZE,
          type: "right" // 右开窗
        })
      ];
      
      root.value = {
        id: "root",
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        frameSize: FRAME_SIZE,
        splitDirection: null,
        sections: [mainSection]
      };
    } else if (pattern === 'fixed-double-horizontal') {
      // 两个水平排列的固定窗
      const mainSection = new Section({
        width: WINDOW_WIDTH - FRAME_SIZE * 2,
        height: WINDOW_HEIGHT - FRAME_SIZE * 2,
        frameSize: FRAME_SIZE
      });
      
      mainSection.splitDirection = 'vertical';
      mainSection.sections = [
        new Section({
          width: (WINDOW_WIDTH - FRAME_SIZE * 2) / 2 - DEVIDER_SIZE / 2,
          height: WINDOW_HEIGHT - FRAME_SIZE * 2,
          type: "none" // 固定窗 - frameSize会在构造函数中自动设为0
        }),
        new Devider({
          width: DEVIDER_SIZE,
          height: WINDOW_HEIGHT - FRAME_SIZE * 2
        }),
        new Section({
          width: (WINDOW_WIDTH - FRAME_SIZE * 2) / 2 - DEVIDER_SIZE / 2,
          height: WINDOW_HEIGHT - FRAME_SIZE * 2,
          type: "none" // 固定窗 - frameSize会在构造函数中自动设为0
        })
      ];
      
      root.value = {
        id: "root",
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        frameSize: FRAME_SIZE,
        splitDirection: null,
        sections: [mainSection]
      };
    }
    
    // 确保store状态更新，触发度量标注计算
    nextTick(() => {
      triggerMetricsUpdate();
    });
  }

  // 更新中挺属性
  function updateDeviderProps(deviderId: number, props: Partial<DeviderAttrs>) {
    // 查找中挺函数
    function findNestedDevider(sec: any, id: number): any {
      if (sec.nodeType === "devider" && sec.id === id) {
        return sec;
      }
      if (!sec.sections) {
        return null;
      }
      for (let i = 0; i < sec.sections.length; i++) {
        const founded = findNestedDevider(sec.sections[i], id);
        if (founded) {
          return founded;
        }
      }
      return null;
    }
    
    const devider = findNestedDevider(root.value, deviderId);
    if (!devider) {
      console.warn(`未找到ID为${deviderId}的中挺`);
      return;
    }
    
    console.log(`更新中挺 ${deviderId} 属性:`, props);
    
    // 更新属性
    if (props.thickness !== undefined) {
      devider.thickness = props.thickness;
    }
    
    // 如果中挺是垂直的(宽度小于高度)，更新宽度
    if (devider.width < devider.height && props.width !== undefined) {
      const oldWidth = devider.width;
      devider.width = props.width;
      
      // 调整相邻区域大小
      adjustAdjacentSectionsForDevider(devider.id, oldWidth, props.width, 'horizontal');
    }
    
    // 如果中挺是水平的(高度小于宽度)，更新高度
    if (devider.height < devider.width && props.height !== undefined) {
      const oldHeight = devider.height;
      devider.height = props.height;
      
      // 调整相邻区域大小
      adjustAdjacentSectionsForDevider(devider.id, oldHeight, props.height, 'vertical');
    }
    
    // 触发度量标注更新
    triggerMetricsUpdate();
  }
  
  // 调整中挺相邻区域的大小
  function adjustAdjacentSectionsForDevider(deviderId: number, oldSize: number, newSize: number, direction: 'horizontal' | 'vertical') {
    // 查找父区域以及当前中挺在父区域中的索引
    function findParentAndIndex(root: any, id: number): { parent: any, index: number } | null {
      if (!root.sections || root.sections.length === 0) return null;
      
      for (let i = 0; i < root.sections.length; i++) {
        if (root.sections[i].id === id) {
          return { parent: root, index: i };
        }
        const result = findParentAndIndex(root.sections[i], id);
        if (result) return result;
      }
      
      return null;
    }
    
    const parentInfo = findParentAndIndex(root.value, deviderId);
    if (!parentInfo) {
      console.warn('未找到中挺的父区域');
      return;
    }
    
    const { parent, index } = parentInfo;
    
    // 确保父区域有分割方向
    if (!parent.splitDirection) {
      console.warn('父区域没有分割方向');
      return;
    }
    
    // 中挺应该在两个区域之间
    if (index <= 0 || index >= parent.sections.length - 1) {
      console.warn('中挺不在两个区域之间');
      return;
    }
    
    // 获取相邻的两个区域
    const prevSection = parent.sections[index - 1];
    const nextSection = parent.sections[index + 1];
    
    // 调整大小差值
    const sizeDiff = newSize - oldSize;
    
    if (direction === 'horizontal') {
      // 水平调整 (调整左右区域的宽度)
      prevSection.width -= sizeDiff / 2;
      nextSection.width -= sizeDiff / 2;
      
      // 确保最小宽度
      prevSection.width = Math.max(prevSection.width, 10);
      nextSection.width = Math.max(nextSection.width, 10);
    } else {
      // 垂直调整 (调整上下区域的高度)
      prevSection.height -= sizeDiff / 2;
      nextSection.height -= sizeDiff / 2;
      
      // 确保最小高度
      prevSection.height = Math.max(prevSection.height, 10);
      nextSection.height = Math.max(nextSection.height, 10);
    }
  }

  return {
    root,
    selectedSectionId,
    selectedDeviderId, // 导出选中中挺ID
    selectedSection,
    selectedDevider, // 导出选中中挺
    metricsUpdateCounter,
    setSectionType,
    splitCurrentSection,
    toggleMetricsVisibility,
    isMetricsVisible,
    triggerMetricsUpdate,
    updateWindowSize,
    updateFrameSize,
    updateSectionSize,
    initializeWindowWithSections,
    updateDeviderProps, // 导出更新中挺属性的方法
  };
}); 