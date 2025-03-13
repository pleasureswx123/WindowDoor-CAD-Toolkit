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

// 分隔线类，这个是中挺，是将大的空白区域按照尺寸按比例分隔成多个小的空白区域
// 明确概念：中挺厚度指的是，水平中挺的厚度对应的是中挺的高度，垂直中挺的厚度指的是中挺的宽度
// 由中挺的位置及厚度的变化来决定其相邻的空白区域的大小
// 空白区域是用来放置并配置窗扇的预留区域
// 重构窗户中的所有数据store化，都能保证做到响应式与stage、layer中的数据即时响应。
// 尤其是对splitCurrentSection所产生的数据，应始终保持是响应数据，
// 修改某一中挺的厚度或位置数据，保证能够响应到其它数据的改变，也就是某一部分数据如用ref、reactive、computed、watch、watchEffect计算得出，比如当用户修改中挺宽度或位置时，要做到其相邻或关联的部分直接响应变化到stage中去
// 父元素的宽度是固定的，也就是说当用户调整中挺的厚度或位置移动时，要即时改变其相邻的节点的尺寸及位置，但限制父元素的宽度不能超过父元素的宽度或高度
// 垂直的中挺只能左右移动，不能超出父元素的宽度
// 水平的中挺只能上下移动，不能超出父元素的高度

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

  watch(selectedDevider, (newDevider) => {
    console.log('selectedDevider', newDevider);
  }, { deep: true });
  
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
    if (selectedSection.value) {
      // 为选中的区域设置新的类型
      selectedSection.value.type = type;
      console.log(`设置区域 ${selectedSection.value.id} 的类型为 ${type}`);
      
      // 根据类型调整框架尺寸
      if (type === 'none') {
        // 固定窗没有框架
        selectedSection.value.frameSize = 0;
      } else {
        // 其他类型使用默认框架尺寸
        selectedSection.value.frameSize = 50;
      }
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
        new Devider({ // 中挺
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
        new Devider({ // 中挺
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

  // 更新窗户尺寸
  function updateWindowSize(width: number, height: number) {
    if (width === root.value.width && height === root.value.height) { 
      return;
    }
    console.log(`更新窗户尺寸: ${root.value.width}x${root.value.height} -> ${width}x${height}`);

    // 保存旧尺寸，用于计算缩放比例
    const oldWidth = root.value.width;
    const oldHeight = root.value.height;
    
    // 确保窗户尺寸不小于最小值
    width = Math.max(width, root.value.frameSize * 2 + 10);
    height = Math.max(height, root.value.frameSize * 2 + 10);
    
    // 计算缩放比例
    const widthRatio = width / oldWidth;
    const heightRatio = height / oldHeight;
    
    // 更新根窗户尺寸
    root.value.width = width;
    root.value.height = height;
    
    // 递归调整所有子元素的尺寸和位置
    adjustChildrenSizesAndPositions(root.value, widthRatio, heightRatio, 0);
  }

  // 递归调整子元素尺寸和位置
  function adjustChildrenSizesAndPositions(section: any, widthRatio: number, heightRatio: number, index: number) {
    if (!section.sections || section.sections.length === 0) {
      return;
    }
    
    // 遍历所有子元素
    for (let i = 0; i < section.sections.length; i++) {
      const child = section.sections[i];
      if (index === 0 && i === 0 && child.nodeType === 'section' && child.type === 'empty') {
        child.width = root.value.width - root.value.frameSize * 2;
        child.height = root.value.height - root.value.frameSize * 2;
        child.x = 0;
        child.y = 0;
      } else {
        // 调整尺寸
        child.width = Math.round(child.width * widthRatio);
        child.height = Math.round(child.height * heightRatio);
        // 调整位置（如果有）
        if (typeof child.x === 'number') {
          child.x = Math.round(child.x * widthRatio);
        }
        if (typeof child.y === 'number') {
          child.y = Math.round(child.y * heightRatio);
        }
      }
      // 递归处理子元素
      adjustChildrenSizesAndPositions(child, widthRatio, heightRatio, index + 1);
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
  }
  
  // 更新元素尺寸（包括区域和中挺）
  function updateElementSize(elementId: number | string, sizeData: { width?: number, height?: number }) {
    // 递归查找元素
    function findElementAndUpdate(sec: any, id: any): boolean {
      if (sec.id == id) {
        // 更新找到的元素尺寸
        if (sizeData.width !== undefined) {
          sec.width = sizeData.width;
        }
        if (sizeData.height !== undefined) {
          sec.height = sizeData.height;
        }
        return true;
      }
      
      if (!sec.sections) {
        return false;
      }
      
      for (let i = 0; i < sec.sections.length; i++) {
        if (findElementAndUpdate(sec.sections[i], id)) {
          return true;
        }
      }
      
      return false;
    }
    
    findElementAndUpdate(root.value, elementId);
  }

  // 更新元素位置
  function updateElementPosition(elementId: number | string, x: number, y: number) {
    // 递归查找元素
    function findElementAndUpdate(sec: any, id: any): boolean {
      if (sec.id == id) {
        // 更新找到的元素位置
        sec.x = x;
        sec.y = y;
        return true;
      }
      
      if (!sec.sections) {
        return false;
      }
      
      for (let i = 0; i < sec.sections.length; i++) {
        if (findElementAndUpdate(sec.sections[i], id)) {
          return true;
        }
      }
      
      return false;
    }
    
    findElementAndUpdate(root.value, elementId);
  }

  // 更新中挺位置
  function updateDeviderPosition(deviderId: number | string, x: number, y: number) {
    // ... existing code ...
  }

  const stageDraggable = ref(true);

  return {
    stageDraggable,
    root,
    selectedSectionId,
    selectedDeviderId,
    selectedSection,
    selectedDevider,
    setSectionType,
    splitCurrentSection,
    updateWindowSize,
    updateDeviderPosition,
    updateFrameSize,
    initializeWindowWithSections,
    updateElementSize,
    updateElementPosition,
  };
}); 