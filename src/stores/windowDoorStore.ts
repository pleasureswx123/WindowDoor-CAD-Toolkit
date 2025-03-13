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
  x?: number;
  y?: number;
  type?: string;
  frameSize?: number;
  parentSection?: Section | null; // 父区域引用
}

// 分隔线类型接口
export interface DeviderAttrs {
  width: number;
  height: number;
  thickness?: number; // 中挺厚度，默认为40
  parentSection?: Section | null; // 父区域引用
  position?: number; // 中挺在父容器中的相对位置(百分比)
  x?: number;
  y?: number;
}

// 区域类
// 重构窗户中的所有数据store化，都能保证做到响应式与stage、layer中的数据即时响应。
// 当section的type为empty时，这时的section更像是一个容器。可以往这个容器里放置组件，比如小的容器、中挺、窗扇等。
// 窗扇是由窗框、玻璃、窗扇类型、开启方向、把手等组件组成的。
// 当section的type为empty时，可以直接更改容器的type变成窗扇，也可以由中挺对其进行分割，分割成多个小的容器。
// 准确的来说section描述的数据有点杂，有指区域容器的，有指固定窗扇，也有指有方向的窗扇的。
// 如果指区域容器时里面可以包含其他子组件。
// 如果只是更改类型时指的可能是固定窗扇，也可能是可开启的窗扇
// 所以section的数据有点复杂，需要仔细分析理解，或者你有什么好的改进建议或方案，请告诉我。
// 很好，然后我们继续在确保中挺位置变化时相邻区域尺寸同步更新这个功能的基础上帮忙实现以下功能：
// 如果相邻的区域中有包含的组件，那么这些内部所有组件也需要同步更新信息。
// 也就是说所有的数据都是环环相扣的，当我更改了中挺的位置或厚度数据时，不仅仅是同步更新其相邻区域的尺寸与位置，而且与其相邻区域内部的所有内容都需要进行相应的调整。
// 也就是相邻的这个sections的尺寸及位置发生了变化，那么将同步更新这个sections内部组件（窗扇、中挺、小区域等）的尺寸与位置信息。
// 也就是说当sections的尺寸及位置发生变化时，将同步更新sections内部组件的尺寸与位置信息。
// 请认真分析理解问题，并给出解决方案。
export class Section {
  nodeType = "section";
  id: number;
  width: number;
  height: number;
  frameSize: number;
  type: string;
  splitDirection: string | null;
  sections: Array<Section | Devider>;
  parentSection: Section | null = null; // 记录父区域引用
  x: number = 0; // 在父容器中的X坐标
  y: number = 0; // 在父容器中的Y坐标

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
    this.parentSection = attrs.parentSection || null;
    this.x = attrs.x || 0;
    this.y = attrs.y || 0;
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
  parentSection: Section | null = null; // 记录父区域引用
  thickness: number = 40; // 中挺厚度
  position: number = 50; // 中挺在父容器中的相对位置(百分比)
  x: number = 0; // 在父容器中的x坐标
  y: number = 0; // 在父容器中的y坐标
  sections: any[] = [];

  constructor(attrs: DeviderAttrs) {
    this.id = generateId();
    this.width = attrs.width || 0;
    this.height = attrs.height || 0;
    this.thickness = attrs.thickness || 40;
    this.parentSection = attrs.parentSection || null;
    this.position = attrs.position || 50; // 默认居中(50%)
    this.x = attrs.x || 0;
    this.y = attrs.y || 0;
  }
  
  // 获取中挺方向 - 宽度小于高度为垂直中挺，否则为水平中挺
  get direction(): 'vertical' | 'horizontal' {
    return this.width < this.height ? 'vertical' : 'horizontal';
  }
  
  // 获取中挺实际厚度 - 根据方向返回对应的宽度或高度
  get actualThickness(): number {
    return this.direction === 'vertical' ? this.width : this.height;
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
    
    // 默认使用均等分割(50/50)
    // 以后将根据实际需要（如钢笔工具计算的位置）来调整这个比例
    let splitPosition = 50; // 百分比位置，默认50%
    
    if (direction === "vertical") {
      // 创建中挺及左右区域
      const leftSection = new Section({
        width: Math.round(section.width * (splitPosition / 100)) - DEVIDER_SIZE / 2,
        height: section.height,
        type: "empty",
        parentSection: section, // 记录父区域引用
        x: 0,
        y: 0
      });
      
      const devider = new Devider({
        width: DEVIDER_SIZE,
        height: section.height,
        parentSection: section, // 记录父区域引用
        position: splitPosition, // 默认位置
        x: leftSection.width,
        y: 0
      });
      
      const rightSection = new Section({
        width: section.width - leftSection.width - DEVIDER_SIZE,
        height: section.height,
        type: "empty",
        parentSection: section, // 记录父区域引用
        x: leftSection.width + DEVIDER_SIZE,
        y: 0
      });
      
      // 添加到父区域
      section.sections = [leftSection, devider, rightSection];
    } else {
      // 创建中挺及上下区域
      const topSection = new Section({
        width: section.width,
        height: Math.round(section.height * (splitPosition / 100)) - DEVIDER_SIZE / 2,
        type: "empty",
        parentSection: section, // 记录父区域引用
        x: 0,
        y: 0
      });
      
      const devider = new Devider({
        width: section.width,
        height: DEVIDER_SIZE,
        parentSection: section, // 记录父区域引用
        position: splitPosition, // 默认位置
        x: 0,
        y: topSection.height
      });
      
      const bottomSection = new Section({
        width: section.width,
        height: section.height - topSection.height - DEVIDER_SIZE,
        type: "empty",
        parentSection: section, // 记录父区域引用
        x: 0,
        y: topSection.height + DEVIDER_SIZE
      });
      
      // 添加到父区域
      section.sections = [topSection, devider, bottomSection];
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

  // 查找中挺及其父区域和索引位置
  function findDeviderAndParent(section: any, deviderId: number): {devider: Devider, parent: Section, index: number} | null {
    if (!section || !section.sections) return null;
    
    // 在当前层级查找
    for (let i = 0; i < section.sections.length; i++) {
      const child = section.sections[i];
      if (child.nodeType === 'devider' && child.id === deviderId) {
        return { devider: child, parent: section, index: i };
      }
    }
    
    // 递归查找子区域
    for (let i = 0; i < section.sections.length; i++) {
      const child = section.sections[i];
      if (child.nodeType === 'section') {
        const result = findDeviderAndParent(child, deviderId);
        if (result) return result;
      }
    }
    
    return null;
  }

  // 更新区域内子元素的布局
  function updateChildrenLayout(section: Section) {
    if (!section.sections || section.sections.length === 0) return;
    
    // 计算子元素位置和尺寸
    if (section.splitDirection === 'vertical') {
      // 水平排列的子元素
      let offsetX = section.x; // 从区域的x坐标开始
      for (const child of section.sections) {
        child.x = offsetX;
        child.y = section.y; // 对齐父区域的顶部
        
        // 保持子元素高度与父区域一致
        if (child.nodeType === 'section') {
          (child as Section).height = section.height;
        } else if (child.nodeType === 'devider') {
          (child as Devider).height = section.height;
        }
        
        // 更新偏移量
        offsetX += child.width;
        
        // 递归更新子元素的内部布局
        if (child.nodeType === 'section') {
          updateChildrenLayout(child as Section);
        }
      }
    } else {
      // 垂直排列的子元素
      let offsetY = section.y; // 从区域的y坐标开始
      for (const child of section.sections) {
        child.x = section.x; // 对齐父区域的左侧
        child.y = offsetY;
        
        // 保持子元素宽度与父区域一致
        if (child.nodeType === 'section') {
          (child as Section).width = section.width;
        } else if (child.nodeType === 'devider') {
          (child as Devider).width = section.width;
        }
        
        // 更新偏移量
        offsetY += child.height;
        
        // 递归更新子元素的内部布局
        if (child.nodeType === 'section') {
          updateChildrenLayout(child as Section);
        }
      }
    }
  }

  // 缩放比例
  const scale = ref(1);

  // 更新中挺位置 - 同步更新相邻区域及其子元素
  function updateDeviderPosition(deviderId: number, newPosition: number) {
    // 查找中挺及其父容器
    const result = findDeviderAndParent(root.value, deviderId);
    if (!result) {
      console.error(`找不到中挺及其父容器，ID: ${deviderId}`);
      return;
    }
    
    const { devider, parent, index } = result;
    if (!parent || !parent.sections) {
      console.error(`中挺父容器无效，ID: ${deviderId}`);
      return;
    }
    
    // 确保新位置在有效范围内 (10%-90%)
    newPosition = Math.max(10, Math.min(90, newPosition));
    
    // 打印更新信息
    console.log(`更新中挺 #${deviderId} 位置: ${devider.position}% -> ${newPosition}%`);
    
    // 保存新的相对位置
    devider.position = newPosition;
    
    // 如果索引无效，无法更新相邻区域
    if (index <= 0 || index >= parent.sections.length - 1) {
      console.error(`中挺索引无效，无法更新相邻区域: index=${index}, length=${parent.sections.length}`);
      return;
    }
    
    // 前后相邻的区域
    const prevSection = parent.sections[index - 1] as Section;
    const nextSection = parent.sections[index + 1] as Section;
    
    if (!prevSection || !nextSection) {
      console.error(`中挺相邻的区域未找到 (prev: ${!!prevSection}, next: ${!!nextSection})`);
      return;
    }
    
    console.log(`相邻区域: 前(${index-1})=${prevSection.width}x${prevSection.height}, 后(${index+1})=${nextSection.width}x${nextSection.height}`);
    
    if (devider.direction === 'vertical') {
      // 垂直中挺：调整左右区域宽度
      const totalWidth = prevSection.width + nextSection.width;
      
      // 计算新的宽度分配 - 考虑newPosition是基于父节点的百分比
      const prevWidthPercent = newPosition;
      prevSection.width = Math.round(totalWidth * prevWidthPercent / 100);
      nextSection.width = totalWidth - prevSection.width;
      
      // 更新中挺的实际宽度 - 保持不变
      devider.width = devider.thickness;
      
      // 更新中挺和nextSection的x坐标
      devider.x = prevSection.x + prevSection.width;
      nextSection.x = devider.x + devider.width;
      
      console.log(`垂直中挺更新: 位置百分比=${newPosition.toFixed(2)}%, 中挺x坐标=${devider.x}, 左区域宽度=${prevSection.width}, 右区域宽度=${nextSection.width}`);
    } else {
      // 水平中挺：调整上下区域高度
      const totalHeight = prevSection.height + nextSection.height;
      
      // 计算新的高度分配 - 考虑newPosition是基于父节点的百分比
      const prevHeightPercent = newPosition;
      prevSection.height = Math.round(totalHeight * prevHeightPercent / 100);
      nextSection.height = totalHeight - prevSection.height;
      
      // 更新中挺的实际高度 - 保持不变
      devider.height = devider.thickness;
      
      // 更新中挺和nextSection的y坐标
      devider.y = prevSection.y + prevSection.height;
      nextSection.y = devider.y + devider.height;
      
      console.log(`水平中挺更新: 位置百分比=${newPosition.toFixed(2)}%, 中挺y坐标=${devider.y}, 上区域高度=${prevSection.height}, 下区域高度=${nextSection.height}`);
    }
    
    // 递归更新相邻区域内的所有子元素
    updateChildrenLayout(prevSection);
    updateChildrenLayout(nextSection);
  }

  // 更新中挺厚度 - 同步更新相邻区域及其子元素
  function updateDeviderThickness(deviderId: number, newThickness: number) {
    // 查找中挺及其父容器
    const result = findDeviderAndParent(root.value, deviderId);
    if (!result) return;
    
    const { devider, parent, index } = result;
    if (!parent || !parent.sections) return;
    
    // 限制厚度范围(30-100)
    newThickness = Math.max(30, Math.min(100, newThickness));
    
    // 获取原厚度
    const oldThickness = devider.direction === 'vertical' ? devider.width : devider.height;
    
    console.log(`更新中挺 #${deviderId} 厚度: ${oldThickness} -> ${newThickness}`);
    
    // 计算厚度差值
    const thicknessDiff = newThickness - oldThickness;
    
    // 更新中挺厚度
    if (devider.direction === 'vertical') {
      devider.width = newThickness;
    } else {
      devider.height = newThickness;
    }
    
    // 保存中挺新的厚度
    devider.thickness = newThickness;
    
    // 如果索引无效，无法更新相邻区域
    if (index <= 0 || index >= parent.sections.length - 1) return;
    
    // 获取相邻区域
    const prevSection = parent.sections[index - 1] as Section;
    const nextSection = parent.sections[index + 1] as Section;
    
    if (devider.direction === 'vertical') {
      // 垂直中挺：根据位置比例调整左右区域宽度
      const reductionFromPrev = Math.round(thicknessDiff * (devider.position / 100));
      const reductionFromNext = thicknessDiff - reductionFromPrev;
      
      // 更新宽度，确保最小宽度为50
      prevSection.width = Math.max(50, prevSection.width - reductionFromPrev);
      nextSection.width = Math.max(50, nextSection.width - reductionFromNext);
      
      // 更新nextSection的位置
      nextSection.x = prevSection.x + prevSection.width + devider.width;
    } else {
      // 水平中挺：根据位置比例调整上下区域高度
      const reductionFromPrev = Math.round(thicknessDiff * (devider.position / 100));
      const reductionFromNext = thicknessDiff - reductionFromPrev;
      
      // 更新高度，确保最小高度为50
      prevSection.height = Math.max(50, prevSection.height - reductionFromPrev);
      nextSection.height = Math.max(50, nextSection.height - reductionFromNext);
      
      // 更新nextSection的位置
      nextSection.y = prevSection.y + prevSection.height + devider.height;
    }
    
    // 递归更新相邻区域内的所有子元素
    updateChildrenLayout(prevSection);
    updateChildrenLayout(nextSection);
  }

  const stageDraggable = ref(true);

  // ===== 钢笔工具状态 =====
  const isPenToolActive = ref(false);
  const penToolMode = ref<'idle' | 'drawing' | 'confirming'>('idle');
  const penStartPoint = ref<{x: number, y: number} | null>(null);
  const penEndPoint = ref<{x: number, y: number} | null>(null);
  const penDirection = ref<'vertical' | 'horizontal' | null>(null);
  const isSnapping = ref(false);
  const snapPercentage = ref<number | null>(null);
  
  // 激活/停用钢笔工具
  function togglePenTool(active: boolean) {
    console.log('togglePenTool 状态变更:', active, '当前状态:', isPenToolActive.value);
    isPenToolActive.value = active;
    console.log('新状态设置后:', isPenToolActive.value);
    
    if (!active) {
      console.log('钢笔工具停用，重置状态');
      resetPenToolState();
    } else {
      penToolMode.value = 'idle';
      console.log('钢笔工具已激活，模式设置为idle');
    }
  }
  
  // 重置钢笔工具状态
  function resetPenToolState() {
    console.log('重置钢笔工具状态，当前模式:', penToolMode.value);
    penToolMode.value = 'idle';
    penStartPoint.value = null;
    penEndPoint.value = null;
    penDirection.value = null;
    isSnapping.value = false;
    snapPercentage.value = null;
  }
  
  // 获取吸附百分比值
  function getSnapPercentages(): number[] {
    // 返回常用的吸附百分比值
    return [25, 33.33, 50, 66.67, 75];
  }
  
  // 计算吸附值
  function calculateSnapValue(value: number, min: number, max: number): number | null {
    // 计算当前百分比
    const range = max - min;
    const percentage = ((value - min) / range) * 100;
    
    // 获取吸附百分比列表
    const snapPercentages = getSnapPercentages();
    
    // 查找最近的吸附点
    let closestSnap = null;
    let minDistance = Infinity;
    
    for (const snapPercent of snapPercentages) {
      const distance = Math.abs(percentage - snapPercent);
      if (distance < minDistance && distance < 5) { // 5%的吸附阈值
        minDistance = distance;
        closestSnap = snapPercent;
      }
    }
    
    return closestSnap;
  }
  
  // 应用吸附
  function applySnapping(point: {x: number, y: number}, section: Section): {x: number, y: number, isSnapping: boolean, snapPercentage: number | null} {
    if (!penDirection.value || !penStartPoint.value) {
      return { ...point, isSnapping: false, snapPercentage: null };
    }
    
    // 获取窗框宽度
    const frameSize = root.value.frameSize;
    
    // 计算区域边界，考虑窗框宽度偏移
    const left = section.x + frameSize;
    const right = left + section.width;
    const top = section.y + frameSize; // 添加frameSize偏移
    const bottom = top + section.height;
    
    let snappedPoint = { ...point };
    let isSnapping = false;
    let snapPerc = null;
    
    // 首先约束到正确的方向
    if (penDirection.value === 'vertical') {
      // 垂直中挺 - Y坐标固定为起点Y
      snappedPoint.y = penStartPoint.value.y;
      
      // 检查X方向吸附
      const snapPercents = getSnapPercentages();
      const relX = (point.x - left) / (right - left) * 100; // 相对百分比位置
      
      // 寻找最近的吸附百分比
      let minDistance = 5; // 5%的吸附阈值
      for (const percent of snapPercents) {
        const distance = Math.abs(relX - percent);
        if (distance < minDistance) {
          minDistance = distance;
          snapPerc = percent;
          isSnapping = true;
          
          // 计算吸附后的X坐标
          snappedPoint.x = left + (right - left) * (percent / 100);
        }
      }
    } else {
      // 水平中挺 - X坐标固定为起点X
      snappedPoint.x = penStartPoint.value.x;
      
      // 检查Y方向吸附
      const snapPercents = getSnapPercentages();
      const relY = (point.y - top) / (bottom - top) * 100; // 相对百分比位置
      
      // 寻找最近的吸附百分比
      let minDistance = 5; // 5%的吸附阈值
      for (const percent of snapPercents) {
        const distance = Math.abs(relY - percent);
        if (distance < minDistance) {
          minDistance = distance;
          snapPerc = percent;
          isSnapping = true;
          
          // 计算吸附后的Y坐标
          snappedPoint.y = top + (bottom - top) * (percent / 100);
        }
      }
    }
    
    return { 
      x: snappedPoint.x, 
      y: snappedPoint.y, 
      isSnapping, 
      snapPercentage: snapPerc 
    };
  }
  
  // 根据点查找区域
  function findSectionByPoint(point: {x: number, y: number}): Section | null {
    // 递归查找函数
    function findInSection(section: any): Section | null {
      // 如果不是区域，直接返回null
      if (section.nodeType !== 'section') return null;
      
      // 获取窗框宽度
      const frameSize = root.value.frameSize;
      
      // 计算区域边界（对于子节点，不需要再次添加偏移，因为它们的坐标已经包含了偏移）
      let left = section.x;
      let right = section.x + section.width;
      let top = section.y;
      let bottom = section.y + section.height;
      
      // 检查点是否在区域内
      if (point.x >= left && point.x <= right && 
          point.y >= top && point.y <= bottom) {
        
        // 如果有子区域，优先检查子区域
        if (section.sections && section.sections.length > 0) {
          for (const child of section.sections) {
            if (child.nodeType === 'section') {
              const found = findInSection(child);
              if (found) return found;
            }
          }
        }
        
        // 只返回类型为empty的区域，这些区域才能分割
        if (section.type === 'empty') {
          return section;
        }
      }
      
      return null;
    }
    
    // 从根区域开始查找
    if (!root.value.sections || root.value.sections.length === 0) return null;
    return findInSection(root.value.sections[0]);
  }
  
  // 计算中挺创建信息
  function calculateDeviderInfo(startPoint: {x: number, y: number}, endPoint: {x: number, y: number}) {
    // 确定中挺方向（重要：这里的方向是指创建的中挺的方向，不是绘制线条的方向）
    // dx > dy 说明水平移动距离大，应该绘制水平线条，但这表示创建垂直中挺
    // dy > dx 说明垂直移动距离大，应该绘制垂直线条，但这表示创建水平中挺
    const dx = Math.abs(endPoint.x - startPoint.x);
    const dy = Math.abs(endPoint.y - startPoint.y);
    
    // 重要修复：确保方向与penDirection保持一致
    // 钢笔工具中：horizontal = 水平线 = 创建水平中挺
    //           vertical = 垂直线 = 创建垂直中挺
    const direction = penDirection.value || (dx > dy ? 'horizontal' : 'vertical');
    
    console.log("计算中挺信息 - 绘制方向:", direction, "dx:", dx, "dy:", dy);
    
    // 计算中点
    const midPoint = {
      x: (startPoint.x + endPoint.x) / 2,
      y: (startPoint.y + endPoint.y) / 2
    };
    
    // 查找所在区域
    const section = findSectionByPoint(midPoint);
    if (!section) return null;
    
    // 计算相对位置百分比
    let position = 50; // 默认位置
    
    if (direction === 'vertical') {
      // 垂直线(垂直中挺) - 计算X方向位置百分比
      position = ((midPoint.x - section.x) / section.width) * 100;
    } else {
      // 水平线(水平中挺) - 计算Y方向位置百分比
      position = ((midPoint.y - section.y) / section.height) * 100;
    }
    
    // 限制位置范围在10%-90%
    position = Math.max(10, Math.min(90, position));
    
    return {
      section,
      direction,
      position
    };
  }
  
  /**
   * 使用钢笔工具创建分隔线
   * @returns 
   */
  function createDeviderWithPenTool() {
    try {
      console.log('创建分隔线 - 起点:', penStartPoint.value, '终点:', penEndPoint.value, '方向:', penDirection.value);

      if (!penStartPoint.value || !penEndPoint.value || !penDirection.value) {
        console.error('创建分隔线失败：没有起点、终点或方向数据');
        return false;
      }

      // 获取指定位置的区域
      const start = penStartPoint.value;
      const end = penEndPoint.value;
      
      // 约束终点确保水平或垂直
      let constrainedEnd = { ...end };
      if (penDirection.value === 'vertical') {
        // 垂直中挺 - 固定X坐标
        constrainedEnd.x = start.x;
      } else {
        // 水平中挺 - 固定Y坐标
        constrainedEnd.y = start.y;
      }

      // 计算中点以确定所在区域
      const midX = (start.x + constrainedEnd.x) / 2;
      const midY = (start.y + constrainedEnd.y) / 2;

      // 根据中点寻找所在区域
      const targetSection = findSectionByPoint({x: midX, y: midY});
      if (!targetSection) {
        console.error('创建分隔线失败：找不到目标区域');
        return false;
      }

      console.log('找到目标区域:', targetSection, '位置:', targetSection.x, targetSection.y, '尺寸:', targetSection.width, targetSection.height);

      // 获取窗框宽度
      const frameSize = root.value.frameSize;

      // 基于约束后的终点计算位置百分比
      let position = 50;

      if (penDirection.value === 'vertical') {
        // 垂直中挺 - 计算X位置百分比
        // 计算参考坐标（添加窗框宽度偏移）
        const referenceX = targetSection.x + frameSize;
        position = ((constrainedEnd.x - referenceX) / targetSection.width) * 100;
        // 计算中挺的中心X坐标，确保与预览线一致
        const axisX = referenceX + (targetSection.width * (position / 100));
        console.log('垂直中挺位置计算:', axisX, referenceX, targetSection.width, '结果:', position);
      } else {
        // 水平中挺 - 计算Y位置百分比
        // 计算参考坐标（添加窗框高度偏移）
        const referenceY = targetSection.y + frameSize;
        position = ((constrainedEnd.y - referenceY) / targetSection.height) * 100;
        // 计算中挺的中心Y坐标，确保与预览线一致
        const axisY = referenceY + (targetSection.height * (position / 100));
        console.log('水平中挺位置计算:', axisY, referenceY, targetSection.height, '结果:', position);
      }

      // 限制在有效范围内 (10%-90%)
      position = Math.max(10, Math.min(90, position));

      console.log(`计算位置百分比: ${position}%`);

      // 选中目标区域并保存目标区域ID
      const targetSectionId = targetSection.id;
      selectedSectionId.value = targetSectionId;
      console.log('选中目标区域ID:', targetSectionId);
      
      // 执行分割
      // 注意这里需要使用正确的参数格式，splitCurrentSection接受一个方向字符串而非对象
      const direction = penDirection.value === 'vertical' ? 'vertical' : 'horizontal';
      splitCurrentSection(direction);
      
      // 分割后直接通过目标区域ID获取更新后的区域，而不是通过selectedSection
      // 递归查找分割后更新的区域
      function findSectionById(node: any, id: number): any {
        if (node.id === id) {
          return node;
        }
        
        if (!node.sections) {
          return null;
        }
        
        for (const child of node.sections) {
          const found = findSectionById(child, id);
          if (found) {
            return found;
          }
        }
        
        return null;
      }
      
      // 从根节点查找目标区域
      const updatedSection = findSectionById(root.value, targetSectionId);
      
      if (!updatedSection || !updatedSection.sections) {
        console.error("创建中挺失败：无法获取更新后的区域", targetSectionId);
        return false;
      }
      
      console.log("找到更新后的区域:", updatedSection);
      
      // 查找新创建的中挺
      const newDevider = updatedSection.sections.find((item: any) => 
        item.nodeType === 'devider'
      );
      
      if (!newDevider) {
        console.error("创建中挺失败：无法找到新创建的中挺");
        return false;
      }
      
      // 更新中挺位置 - 使用我们之前计算的position确保与预览一致
      console.log(`设置中挺位置：${position}%`);
      updateDeviderPosition(newDevider.id, position);
      
      // 选中新创建的中挺
      selectedDeviderId.value = newDevider.id;

      // 重置钢笔工具状态
      resetPenToolState();

      console.log('创建分隔线成功!');
      return true;
    } catch (error) {
      console.error('创建分隔线时发生错误:', error);
      return false;
    }
  }

  // 拖动时的临时状态
  const dragStartPos = ref<{x: number, y: number} | null>(null);
  const dragParentSection = ref<Section | null>(null);
  
  return {
    stageDraggable,
    root,
    selectedSectionId,
    selectedDeviderId,
    selectedSection,
    selectedDevider,
    scale,
    setSectionType,
    splitCurrentSection,
    updateWindowSize,
    updateDeviderPosition,
    updateDeviderThickness,
    updateFrameSize,
    initializeWindowWithSections,
    updateElementSize,
    updateElementPosition,
    
    // 钢笔工具相关
    isPenToolActive,
    penToolMode,
    penStartPoint,
    penEndPoint,
    penDirection,
    isSnapping,
    snapPercentage,
    togglePenTool,
    resetPenToolState,
    findSectionByPoint,
    calculateDeviderInfo,
    createDeviderWithPenTool,
    getSnapPercentages,
    applySnapping,
    
    // 拖动相关状态
    dragStartPos,
    dragParentSection,
    
    // 方法
    findDeviderAndParent
  };
}); 