import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

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
    this.frameSize = attrs.frameSize || 0;
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
  // 当前选中区域ID
  const selectedSectionId = ref<number | null>(null);
  
  // 根元素
  const root = ref({
    id: "root",
    width: 800,
    height: 1000,
    frameSize: 50,
    splitDirection: null,
    sections: [
      new Section({
        width: 800 - 50 * 2,
        height: 1000 - 50 * 2,
      }),
    ],
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

    if (direction === "vertical") {
      section.sections.push(
        new Section({
          width: section.width / 2 - DEVIDER_SIZE / 2,
          height: section.height,
        }),
        new Devider({
          width: DEVIDER_SIZE,
          height: section.height,
        }),
        new Section({
          width: section.width / 2 - DEVIDER_SIZE / 2,
          height: section.height,
        })
      );
    } else {
      section.sections.push(
        new Section({
          width: section.width,
          height: section.height / 2 - DEVIDER_SIZE / 2,
        }),
        new Devider({
          width: section.width,
          height: DEVIDER_SIZE,
        }),
        new Section({
          width: section.width,
          height: section.height / 2 - DEVIDER_SIZE / 2,
        })
      );
    }
    
    // 清除选择
    selectedSectionId.value = null;
  }

  return {
    selectedSectionId,
    root,
    selectedSection,
    setSectionType,
    splitCurrentSection
  };
}); 