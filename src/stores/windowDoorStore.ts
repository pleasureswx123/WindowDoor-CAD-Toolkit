import { defineStore } from 'pinia';
import { ref, computed, nextTick } from 'vue';

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
    this.frameSize = attrs.frameSize || 50;
    this.type = attrs.type || "none";
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

  constructor(attrs: DeviderAttrs) {
    this.id = generateId();
    this.width = attrs.width;
    this.height = attrs.height;
    this.sections = [];
  }
}

export const useWindowDoorStore = defineStore('windowDoor', () => {
  // 当前选中的部分ID
  const selectedSectionId = ref<number | null>(null);
  
  // 初始窗户尺寸
  const WINDOW_WIDTH = 800;
  const WINDOW_HEIGHT = 500;
  const FRAME_SIZE = 50;
  const DEVIDER_SIZE = 50;
  
  // 根窗户
  const root = ref({
    id: "root",
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    frameSize: FRAME_SIZE,
    splitDirection: null,
    sections: [
      new Section({
        width: WINDOW_WIDTH - FRAME_SIZE * 2,
        height: WINDOW_HEIGHT - FRAME_SIZE * 2,
        frameSize: FRAME_SIZE,
        type: "none" // 设置默认类型为右开
      })
    ]
  });

  // 当前选中的区域
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
    section.splitDirection = direction;
    
    // 保存当前的frameSize用于新区域
    const currentFrameSize = section.frameSize;
    // 保存当前的type，在特殊情况下继承给子区域
    const currentType = section.type;
    
    if (direction === "vertical") {
      section.sections.push(
        new Section({
          width: section.width / 2 - DEVIDER_SIZE / 2,
          height: section.height,
          frameSize: currentFrameSize,
          // 默认使用固定窗
          type: "none"
        }),
        new Devider({
          width: DEVIDER_SIZE,
          height: section.height,
        }),
        new Section({
          width: section.width / 2 - DEVIDER_SIZE / 2,
          height: section.height,
          frameSize: currentFrameSize,
          // 默认使用固定窗
          type: "none"
        })
      );
    } else {
      section.sections.push(
        new Section({
          width: section.width,
          height: section.height / 2 - DEVIDER_SIZE / 2,
          frameSize: currentFrameSize,
          // 默认使用固定窗
          type: "none"
        }),
        new Devider({
          width: section.width,
          height: DEVIDER_SIZE,
        }),
        new Section({
          width: section.width,
          height: section.height / 2 - DEVIDER_SIZE / 2,
          frameSize: currentFrameSize,
          // 默认使用固定窗
          type: "none"
        })
      );
    }
    
    // 清除选择
    selectedSectionId.value = null;
  }

  // 添加变更计数器，用于通知组件刷新
  const metricsUpdateCounter = ref(0);
  
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
      
      if (newFrameSize === selectedSection.value.frameSize) {
        console.log('窗扇框架尺寸未变化，跳过更新');
        return;
      }
      
      // 更新选中窗扇的框架尺寸
      selectedSection.value.frameSize = newFrameSize;
      
      // 保存原来的窗扇类型
      const sectionType = selectedSection.value.type;
      
      // 如果类型为"none"，则不需要框架
      if (sectionType === "none") {
        selectedSection.value.frameSize = 0;
      }
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
      // 单窗扇布局 - 固定窗
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
            frameSize: FRAME_SIZE,
            type: "none" // 固定窗
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
            frameSize: FRAME_SIZE,
            type: "none" // 固定窗
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
            frameSize: FRAME_SIZE,
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
          frameSize: FRAME_SIZE,
          type: "none" // 固定窗
        }),
        new Devider({
          width: DEVIDER_SIZE,
          height: WINDOW_HEIGHT - FRAME_SIZE * 2
        }),
        new Section({
          width: (WINDOW_WIDTH - FRAME_SIZE * 2) / 2 - DEVIDER_SIZE / 2,
          height: WINDOW_HEIGHT - FRAME_SIZE * 2,
          frameSize: FRAME_SIZE,
          type: "none" // 固定窗
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
    
    // 触发度量标注更新
    triggerMetricsUpdate();
  }

  return {
    selectedSectionId,
    root,
    selectedSection,
    setSectionType,
    splitCurrentSection,
    updateWindowSize,
    updateSectionSize,
    updateFrameSize,
    initializeWindowWithSections,
    metricsUpdateCounter,
    triggerMetricsUpdate
  };
}); 