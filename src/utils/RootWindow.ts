/**
 * 帮我写一个js类，这个类是用来描述一个窗户的结构的。
 * 一个窗户的基本属性宽度与高度，这个宽度与高度指的是窗户的洞口宽度与洞口高度。
 * 一个窗户只能有一个主框架（窗户四条外边框组成的），这四条边框组成了一个大的空白区域，
 * 这个空白区域可以由中挺将其分割，也只能由中挺将其分割，中挺可以将大空白区域分割成多个小的空白区域，
 * 大的空白区域可由中挺、小空白区域组成。用来放置窗扇的区域叫做小空白区域。大空白区域里可以只有一个窗扇，也可以有多个中挺与多个小空白区域。
 * 大的空白区域由中挺分割分变成，大的空白区域由中挺分割后，大的空白区域就多了子内容，内容就变成了一个中挺与两个小空白区域。
 * 此时，中挺还可以对小空白区域进行分割，小空白区域分割后也就多了子内容，内容就变成了一个中挺与更小的两个小空白区域。
 * 任何空白区域都可以进行分割，分割后也就多了子内容，内容就变成了一个中挺与更小的两个小空白区域。
 * 任何空白区域都可以直接放置窗扇。
 * 空白区域有两种作用：一种是用来放置窗扇的，一种是用来由中挺对其分割的，分割之后就多了子内容，子内容就包含对其分割的那个中挺与两个小空白区域。
 * 这些若干个空白区域与若干个中挺以及四条边外框就组成了一个窗户的主体，这个就是窗户的主体。
 * 这个小的空白区域就是用来安装窗扇用的，窗扇分两种，一种是固定窗扇，一种是开启窗扇，固定窗扇顾名思义就是不能打开的窗扇，开启窗扇就是可以打开的窗扇。打开的方向有四种，分别是左开、右开、倾斜左开、倾斜右开。窗扇是由窗扇四条边框与玻璃及把手（固定是没有把手的 ）组成的。
 * 帮我写一些js类: 窗户WindowStructure、窗户边框WindowFrame、窗户空白区域WindowEmptyArea、窗户中挺WindowMuntin、窗户窗扇WindowSash、窗户窗扇边框WindowSashFrame、窗户窗扇玻璃WindowSashGlass、窗户窗扇把手WindowSashHandle
 * 请结合 /vue-konva.min.js 文件中的代码，将这些类写出来。
 */

import { ref, computed, reactive } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import Konva from 'konva';

// 定义渲染配置接口
interface KonvaRenderConfig {
  component: string;
  config: Record<string, any>;
  children?: KonvaRenderConfig[];
}

// 基础位置和尺寸接口
interface IDimension {
  x: number;
  y: number;
  width: number;
  height: number;
  ele: string;
  tag: string;
  parentId?: string;
  parent?: WindowComponent;
  thickness?: number;
  frameStrokeWidth?: number | string;
  frameStrokeColor?: string; // 边框颜色
  frameColor?: string; // 边框颜色
  sashType?: SashType;
}

export const elementIdMap = reactive(new Map());
// 根据ID快速查找元素
export function getElementById(id: string) {
  return elementIdMap.get(id);
}

// 窗户基本组件基类
class WindowComponent {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  ele: string; // 元素类型 window-frame、window-empty-area、window-muntin、window-sash、window-sash-frame、window-sash-glass、window-sash-handle
  tag: string; // 元素标签 window-frame、window-empty-area、window-muntin、window-sash、window-sash-frame、window-sash-glass、window-sash-handle
  parentId?: string; // 父元素ID
  parent?: any; // 父元素
  thickness?: number; // 厚度

  constructor(config: IDimension) {
    const id = uuidv4();
    this.id = id;
    elementIdMap.set(id, this);
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width || 0;
    this.height = config.height || 0;
    this.ele = config.ele || '';
    this.tag = config.tag || '';
    this.parentId = config.parentId || '';
    this.parent = config.parent || null;
    this.thickness = config.thickness || 0;
  }
  
  // 获取konva配置
  getKonvaConfig(): Record<string, any> {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      id: this.id,
      ele: this.ele,
      tag: this.tag,
      parentId: this.parentId || '' ,
      parent: this.parent || null
    };
  }
  
  // 基类的render方法
  render(): KonvaRenderConfig {
    throw new Error('子类必须实现render方法');
  }
}

export const defaultConfigValue = reactive({
  frameColor: '#8B4513', // 默认棕色
  frameStrokeColor: '#000000',
  frameStrokeWidth: 2,
  muntinColor: '#8B4513', // 与窗框一致
  sashColor: '#A0522D', // 默认深棕色
  sashStrokeColor: '#000000',
  sashStrokeWidth: 1,
  glassColor: '#ADD8E6', // 默认浅蓝色
  glassOpacity: 0.7,
  muntinThickness: 50,
  sashFrameThickness: 50,
  frameSize: 50
})

class GlobalDefaultConfig extends WindowComponent {
  // 全局默认配置
  defaultConfig: {
    frameSize: number; // 窗框宽度
    frameColor: string; // 窗框默认颜色
    frameStrokeColor: string; // 窗框边线颜色
    frameStrokeWidth: number; // 窗框边线宽度
    muntinColor: string; // 中挺默认颜色
    sashColor: string; // 窗扇默认颜色
    sashStrokeColor: string; // 窗扇边线颜色
    sashStrokeWidth: number; // 窗扇边线宽度
    glassColor: string; // 玻璃默认颜色
    glassOpacity: number; // 玻璃默认透明度
    muntinThickness: number; // 中挺宽度
    sashFrameThickness: number; // 窗扇框架宽度
  };
  constructor(config: IDimension) {
    super(config);
    // 初始化默认配置
    this.defaultConfig = defaultConfigValue
  }
}

// 窗户结构类 - 整个窗户的根类
export class WindowStructure extends GlobalDefaultConfig {
  frame: WindowFrame;
  mainArea: WindowEmptyArea;
  frameSize: number;
  width: number;
  height: number;
  
  constructor(width: number, height: number, frameSize: number = 50) {
    super({ x: 0, y: 0, width, height, tag: 'root-window', ele: 'root-window' });
    this.width = width;
    this.height = height;
    this.frameSize = frameSize || this.defaultConfig.frameSize;
    
    // 创建主框架
    this.frame = new WindowFrame({
      x: 0,
      y: 0,
      width,
      height,
      thickness: this.frameSize,
      color: this.defaultConfig.frameColor,
      frameStrokeColor: this.defaultConfig.frameStrokeColor,
      frameStrokeWidth: this.defaultConfig.frameStrokeWidth,
      ele: 'window-frame',
      tag: 'window-frame',
      parentId: this.id
    });
    
    // 创建主空白区域
    this.mainArea = new WindowEmptyArea({
      x: 0,
      y: 0,
      width: width - this.frameSize * 2,
      height: height - this.frameSize * 2,
      ele: 'window-empty-area',
      tag: 'window-empty-area',
      parentId: this.id
    });
  }
  
  // 应用默认配置到所有元素
  applyDefaultConfigToAll() {
    // 应用到窗框
    if (this.frame) {
      this.frame.color = this.defaultConfig.frameColor;
      this.frame.frameStrokeColor = this.defaultConfig.frameStrokeColor;
      this.frame.frameStrokeWidth = this.defaultConfig.frameStrokeWidth;
    }
    
    // 递归应用到所有子元素
    this.applyConfigToEmptyArea(this.mainArea);
    
    // 重新渲染
    this.render();
  }
  
  // 递归应用配置到空白区域及其子元素
  private applyConfigToEmptyArea(area: WindowEmptyArea) {
    // 如果有窗扇，应用配置
    if (area.sash) {
      // 应用到窗扇框架
      if (area.sash.frame) {
        area.sash.frame.frameColor = this.defaultConfig.sashColor;
        area.sash.frame.frameStrokeColor = this.defaultConfig.sashStrokeColor;
        area.sash.frame.frameStrokeWidth = this.defaultConfig.sashStrokeWidth;
      }
      
      // 应用到玻璃
      if (area.sash.glass) {
        area.sash.glass.color = this.defaultConfig.glassColor;
        area.sash.glass.opacity = this.defaultConfig.glassOpacity;
      }
    }
    
    // 如果有子元素，递归应用
    if (area.children && area.children.length > 0) {
      for (const child of area.children) {
        // 应用到中挺
        if (child instanceof WindowMuntin) {
          child.color = this.defaultConfig.muntinColor;
          if (typeof child.updateColor === 'function') {
            child.updateColor(this.defaultConfig.muntinColor);
          }
        }
        
        // 递归应用到子空白区域
        if (child instanceof WindowEmptyArea) {
          this.applyConfigToEmptyArea(child);
        }
      }
    }
  }
  
  // 渲染方法 - 返回vue-konva配置
  render(): KonvaRenderConfig {
    return {
      component: 'v-group',
      config: this.getKonvaConfig(),
      children: [
        this.frame.render(),
        { 
          component: 'v-rect',
          config: {
            id: 'main-area',
            x: this.frameSize,
            y: this.frameSize,
            width: this.width - this.frameSize * 2,
            height: this.height - this.frameSize * 2,
            fill: 'transparent'
          },
          children: [
            this.mainArea.render()
          ]
        }
      ]
    };
  }
}

// 窗户边框类
export class WindowFrame extends GlobalDefaultConfig {
  thickness: number;
  color: string;
  frameStrokeWidth: number;
  frameStrokeColor: string;
  constructor(config: IDimension & { thickness: number, color?: string }) {
    super(config);
    this.thickness = config.thickness || this.defaultConfig.frameSize;
    this.color = config.color || this.defaultConfig.frameColor; // 默认棕色
    this.frameStrokeWidth = this.defaultConfig.frameStrokeWidth;
    this.frameStrokeColor = this.defaultConfig.frameStrokeColor;
  }
  
  // 更新窗框颜色
  updateColor(color: string, strokeColor?: string, strokeWidth?: number) {
    this.color = color;
    
    // 如果提供了边线颜色，更新它
    if (strokeColor !== undefined) {
      this.frameStrokeColor = strokeColor;
    }
    
    // 如果提供了边线宽度，更新它
    if (strokeWidth !== undefined) {
      this.frameStrokeWidth = strokeWidth;
    }
    this.render();
  }
  
  render(): KonvaRenderConfig {
    // 创建四个边框线条，形成立体效果
    const topFrame: KonvaRenderConfig = {
      component: 'v-line',
      config: {
        points: [
          0, 0,                               // 左上外角
          this.width, 0,                      // 右上外角
          this.width - this.thickness, this.thickness, // 右上内角
          this.thickness, this.thickness      // 左上内角
        ],
        closed: true,
        fill: this.color,
        stroke: this.frameStrokeColor,
        strokeWidth: this.frameStrokeWidth,
        id: this.id,
        ele: 'top-frame',
        tag: 'top-frame'
      }
    };
    
    const rightFrame: KonvaRenderConfig = {
      component: 'v-line',
      config: {
        points: [
          this.width, 0,                        // 右上外角
          this.width, this.height,              // 右下外角
          this.width - this.thickness, this.height - this.thickness, // 右下内角
          this.width - this.thickness, this.thickness // 右上内角
        ],
        closed: true,
        fill: this.color,
        stroke: this.frameStrokeColor,
        strokeWidth: this.frameStrokeWidth,
        id: this.id,
        ele: 'right-frame',
        tag: 'right-frame'
      }
    };
    
    const bottomFrame: KonvaRenderConfig = {
      component: 'v-line',
      config: {
        points: [
          0, this.height,                         // 左下外角
          this.width, this.height,                // 右下外角
          this.width - this.thickness, this.height - this.thickness, // 右下内角
          this.thickness, this.height - this.thickness  // 左下内角
        ],
        closed: true,
        fill: this.color,
        stroke: this.frameStrokeColor,
        strokeWidth: this.frameStrokeWidth,
        id: this.id,
        ele: 'bottom-frame',
        tag: 'bottom-frame'
      }
    };
    
    const leftFrame: KonvaRenderConfig = {
      component: 'v-line',
      config: {
        points: [
          0, 0,                                // 左上外角
          this.thickness, this.thickness,      // 左上内角
          this.thickness, this.height - this.thickness, // 左下内角
          0, this.height                        // 左下外角
        ],
        closed: true,
        fill: this.color,
        stroke: this.frameStrokeColor,
        strokeWidth: this.frameStrokeWidth,
        id: this.id,
        ele: 'left-frame',
        tag: 'left-frame'
      }
    };
    
    return {
      component: 'v-group',
      config: this.getKonvaConfig(),
      children: [
        topFrame,
        rightFrame,
        bottomFrame,
        leftFrame
      ]
    };
  }
}

// 窗户空白区域类
export class WindowEmptyArea extends GlobalDefaultConfig {
  children: Array<WindowEmptyArea | WindowMuntin | WindowSash>;
  sash: WindowSash | null;
  splitDirection: 'horizontal' | 'vertical' | null;
  thickness: number;
  pointerPosition: { x: number, y: number };
  constructor(config: IDimension) {
    super(config);
    this.children = [];
    this.sash = null;
    this.splitDirection = null;
    this.thickness = this.defaultConfig.muntinThickness;
    this.pointerPosition = { x: 0, y: 0 };
  }
  
  // 添加窗扇
  addSash(type: 'fixed' | 'left' | 'right' | 'tiltLeft' | 'tiltRight') {
    if (this.children.length > 0 || this.sash) {
      console.error('此区域已有内容，无法添加窗扇');
      return;
    }
    
    this.sash = new WindowSash({
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
      sashType: type,
      ele: 'window-sash',
      tag: 'window-sash',
      parentId: this.id,
      parent: this
    });
  }
  
  // 分割区域
  splitArea(direction: 'horizontal' | 'vertical', pointerPosition: { x: number, y: number }, thickness?: number) {
    if (this.sash) {
      console.error('此区域已有窗扇，无法分割');
      return;
    }
    
    this.splitDirection = direction;
    this.pointerPosition = pointerPosition;
    this.thickness = thickness || this.thickness || this.defaultConfig.muntinThickness;
    
    let area1: WindowEmptyArea, area2: WindowEmptyArea, muntin: WindowMuntin;

    const x = 0;
    const y = 0;
    
    if (direction === 'vertical') {
      // 垂直分割 - 创建左右两个区域
      area1 = new WindowEmptyArea({
        x: x,
        y: y,
        width: pointerPosition.x - this.thickness/2,
        height: this.height,
        ele: 'window-empty-area',
        tag: 'window-empty-area',
        parentId: this.id,
        parent: this
      });
      
      muntin = new WindowMuntin({
        x: x + pointerPosition.x - this.thickness/2,
        y: y,
        width: this.thickness,
        height: this.height,
        thickness: this.thickness,
        direction: 'vertical',
        ele: 'window-muntin',
        tag: 'window-muntin',
        parentId: this.id,
        parent: this
      });
      
      area2 = new WindowEmptyArea({
        x: x + pointerPosition.x + this.thickness/2,
        y: y,
        width: this.width - pointerPosition.x - this.thickness/2,
        height: this.height,
        ele: 'window-empty-area',
        tag: 'window-empty-area',
        parentId: this.id,
        parent: this
      });
    } else {
      // 水平分割 - 创建上下两个区域
      area1 = new WindowEmptyArea({
        x: x,
        y: y,
        width: this.width,
        height: pointerPosition.y - this.thickness/2,
        ele: 'window-empty-area',
        tag: 'window-empty-area',
        parentId: this.id,
        parent: this
      });
      
      muntin = new WindowMuntin({
        x: x,
        y: y + pointerPosition.y - this.thickness/2,
        width: this.width,
        height: this.thickness,
        thickness: this.thickness,
        direction: 'horizontal',
        ele: 'window-muntin',
        tag: 'window-muntin',
        parentId: this.id,
        parent: this
      });
      
      area2 = new WindowEmptyArea({
        x: x,
        y: y + pointerPosition.y + this.thickness/2,
        width: this.width,
        height: this.height - pointerPosition.y - this.thickness/2,
        ele: 'window-empty-area',
        tag: 'window-empty-area',
        parentId: this.id,
        parent: this
      });
    }
    
    this.children = [area1, muntin, area2];
    this.render();
  }

  // 删除中挺和相应的区域结构
  removeMuntin(muntinId: string) {
    // 如果没有子元素，直接返回
    if (!this.children || this.children.length === 0) {
      return false;
    }
    
    // 查找中挺在children中的索引
    const muntinIndex = this.children.findIndex(child => 
      child instanceof WindowMuntin && child.id === muntinId
    );
    
    // 未找到中挺
    if (muntinIndex === -1) {
      return false;
    }
    
    // 找到对应的中挺和相邻的两个区域
    const muntin = this.children[muntinIndex] as WindowMuntin;
    
    // 确保中挺的前后是两个空白区域
    if (muntinIndex === 0 || muntinIndex === this.children.length - 1) {
      console.error('中挺位置错误，无法删除');
      return false;
    }
    
    const area1 = this.children[muntinIndex - 1] as WindowEmptyArea;
    const area2 = this.children[muntinIndex + 1] as WindowEmptyArea;
    
    // 计算合并后的尺寸
    if (muntin.direction === 'vertical') {
      // 如果是垂直中挺，合并后的宽度是两个区域的宽度加上中挺的宽度
      this.width = area1.width + muntin.width + area2.width;
      this.height = Math.max(area1.height, area2.height);
    } else {
      // 如果是水平中挺，合并后的高度是两个区域的高度加上中挺的高度
      this.width = Math.max(area1.width, area2.width);
      this.height = area1.height + muntin.height + area2.height;
    }
    
    // 从Map中移除元素引用
    elementIdMap.delete(muntin.id);
    elementIdMap.delete(area1.id);
    elementIdMap.delete(area2.id);
    
    // 清空子元素列表
    this.children = [];
    
    // 清除分割方向
    this.splitDirection = null;
    
    // 重置为空白区域
    this.sash = null;
    
    return true;
  }

  removeSash(sashId: string) {
    // 如果没有sash，直接返回
    if (!this.sash) {
      return false;
    }
    
    // 检查sash ID是否匹配
    if (this.sash.id !== sashId) {
      // 如果有子元素，尝试在子元素中查找
      if (this.children && this.children.length > 0) {
        for (const child of this.children) {
          if (child instanceof WindowEmptyArea) {
            if (child.removeSash(sashId)) {
              return true;
            }
          }
        }
      }
      return false;
    }
    
    // 从Map中移除窗扇及其子元素的引用
    elementIdMap.delete(this.sash.id);
    
    // 如果窗扇有框架，移除框架
    if (this.sash.frame) {
      elementIdMap.delete(this.sash.frame.id);
    }
    
    // 如果窗扇有玻璃，移除玻璃
    if (this.sash.glass) {
      elementIdMap.delete(this.sash.glass.id);
    }
    
    // 如果窗扇有把手，移除把手
    if (this.sash.handle) {
      elementIdMap.delete(this.sash.handle.id);
    }
    
    // 清空窗扇引用
    this.sash = null;
    
    // 重新渲染
    this.render();
    
    return true;
  }
  
  render(): KonvaRenderConfig {
    // 如果有窗扇，渲染窗扇
    if (this.sash) {
      return {  
        component: 'v-group',
        config: this.getKonvaConfig(),
        children: [this.sash.render()]
      };
    }
    
    // 如果有子元素，渲染子元素
    if (this.children.length > 0) {
      return {
        component: 'v-group',
        config: this.getKonvaConfig(),
        children: this.children.map(child => child.render())
      };
    }
    
    // 否则渲染空白区域
    return {
      component: 'v-rect',
      config: {
        ...this.getKonvaConfig(),
        // fill: '#F0F0F0',
        fill: 'transparent',
        self: this,
        // fill: Konva.Util.getRandomColor(),
        // stroke: '#CCCCCC',
        // strokeWidth: 1
      }
    };
  }
}

// 窗户中挺类
export class WindowMuntin extends GlobalDefaultConfig {
  direction: 'horizontal' | 'vertical';
  thickness: number;
  color: string;
  
  constructor(config: IDimension & { direction: 'horizontal' | 'vertical', thickness?: number, color?: string }) {
    super(config);
    this.direction = config.direction;
    this.thickness = config.thickness || this.defaultConfig.muntinThickness;
    this.color = config.color || this.defaultConfig.muntinColor; // 默认棕色
  }

  changeColor(color: string) {
    this.color = color;
  }
  
  // 更新颜色和边框样式
  updateColor(color: string) {
    this.color = color;
    this.render();
  }
  
  render(): KonvaRenderConfig {
    return {
      component: 'v-rect',
      config: {
        ...this.getKonvaConfig(),
        fill: this.color,
        direction: this.direction,
        thickness: this.thickness,
        width: this.width,
        height: this.height,
        draggable: true,
        parent: this.parent,
        dragBoundFunc(pos: { x: number, y: number }) {
          const direction = this.getAttrs().direction;
          if (direction === 'horizontal') {
            return {
              x: this.absolutePosition().x,
              y: pos.y
            }
          } else {
            return {
              x: pos.x,
              y: this.absolutePosition().y
             }
           }
        },
        onDragStart(e: any) {
          this.startPos = this.getPosition();
          this.dragDirection = this.getAttrs().direction;; 
          this.parentWidth = this.getAttrs().parent.width;
          this.parentHeight = this.getAttrs().parent.height;
          this.thickness = this.getAttrs().thickness || 10;
        },
        onDragMove(e: any) {
          const pos = this.getPosition();
          const stage = e.target.getStage();
          const pointerPos = stage.getPointerPosition();
          
          if (this.dragDirection === 'horizontal') {
            this.x(this.startPos.x);
            
            const minY = this.thickness * 1.5;
            const maxY = this.parentHeight - minY;
            
            let newY = pos.y;
            if (newY < minY) {
              newY = minY;
            } else if (newY > maxY) {
              newY = maxY;
            }
            
            this.y(newY);
            
            if (typeof this.getAttrs().parent.splitArea === 'function') {
              this.dragPos = {x: 0, y: newY};
            }
          } else if (this.dragDirection === 'vertical') {
            this.y(this.startPos.y);
            
            const minX = this.thickness * 1.5;
            const maxX = this.parentWidth - minX;
            
            let newX = pos.x;
            if (newX < minX) {
              newX = minX;
            } else if (newX > maxX) {
              newX = maxX;
            }
            
            this.x(newX);
            
            if (typeof this.getAttrs().parent.splitArea === 'function') {
              this.dragPos = {x: newX, y: 0};
            }
          }
        },
        onDragEnd(e: any) {
          if (typeof this.getAttrs().parent.splitArea === 'function') {
            this.getAttrs().parent.splitArea(this.dragDirection, this.dragPos);
          }
          delete this.startPos;
          delete this.dragDirection;
          delete this.parentWidth;
          delete this.parentHeight;
          delete this.dragPos;
        }
      }
    }
  }
}

// 窗户窗扇类型
type SashType = 'fixed' | 'left' | 'right' | 'tiltLeft' | 'tiltRight';

// 窗户窗扇类
export class WindowSash extends GlobalDefaultConfig {
  sashType: SashType;
  frame: WindowSashFrame | null;
  glass: WindowSashGlass | null;
  handle: WindowSashHandle | null;
  frameSize: number;
  frameStrokeWidth: number;
  frameStrokeColor: string;
  frameColor: string;
  constructor(config: IDimension & { sashType: SashType }) {
    super(config);
    this.sashType = config.sashType;
    this.frameSize = 0;
    this.frame = null;
    this.glass = null;
    this.handle = null;
    this.frameStrokeWidth = this.defaultConfig.sashStrokeWidth;
    this.frameStrokeColor = this.defaultConfig.sashStrokeColor;
    this.frameColor = this.defaultConfig.sashColor;
    this.initData();
  }

  initData() {
    this.frameSize = this.sashType === 'fixed' ? 0 : this.defaultConfig.sashFrameThickness;

    // 创建窗扇框架
    this.frame = new WindowSashFrame({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      sashType: this.sashType,
      thickness: this.frameSize,
      frameStrokeColor: this.frameStrokeColor,
      frameStrokeWidth: this.frameStrokeWidth,
      frameColor: this.frameColor,
      ele: 'window-sash-frame',
      tag: 'window-sash-frame',
      parentId: this.id
    });
    
    // 创建窗扇玻璃
    this.glass = new WindowSashGlass({
      x: this.x + this.frameSize,
      y: this.y + this.frameSize,
      width: this.width - this.frameSize * 2,
      height: this.height - this.frameSize * 2,
      ele: 'window-sash-glass',
      tag: 'window-sash-glass',
      parentId: this.id,
      parent: this
    });
    
    // 如果不是固定窗，添加把手
    this.handle = this.sashType !== 'fixed' ? new WindowSashHandle({
      x: this.sashType.includes('left') ? this.x + this.width - 20 : this.x + 10,
      y: this.y + this.height / 2 - 15,
      width: 10,
      height: 30,
      type: this.sashType,
      ele: 'window-sash-handle',
      tag: 'window-sash-handle',
      parentId: this.id,
      parent: this
    }) : null;
  }

  updateFrameSize(frameSize: number) {
    this.frameSize = frameSize;
    if (this.frame) {
      this.frame.thickness = frameSize;
    }
    if (this.glass) {
      this.glass.x = this.x + frameSize;
      this.glass.y = this.y + frameSize;
      this.glass.width = this.width - frameSize * 2;
      this.glass.height = this.height - frameSize * 2;
    }
    this.render();
  }

  updateSashType(sashType: SashType) {
    this.sashType = sashType;
    this.initData();
    this.render();
  }

  updateFrameData(color: string, strokeColor?: string, strokeWidth?: number) {
    if (this.frame && typeof this.frame.updateData === 'function') {
      this.frame.updateData(color, strokeColor, strokeWidth);
    }
  }

  updateGlassData(color: string, opacity?: number) {
    if (this.glass && typeof this.glass.updateData === 'function') {
      this.glass.updateData(color, opacity);
    }
  }
  
  render(): KonvaRenderConfig {
    const children: any[] = [
      this.frame ? this.frame.render() : null,
      this.glass ? this.glass.render() : null
    ];
    
    if (this.handle) {
      children.push(this.handle.render());
    }
    
    return {
      component: 'v-group',
      config: Object.assign({}, this.getKonvaConfig(), {
        frameSize: this.frameSize
      }),
      children
    };
  }
}

// 窗户窗扇边框类
export class WindowSashFrame extends GlobalDefaultConfig {
  thickness: number;
  frameStrokeWidth: number | string;
  frameStrokeColor: string;
  frameColor: string;
  sashType?: SashType;
  
  constructor(config: IDimension & { thickness: number, color?: string}) {
    super(config);
    this.thickness = config.thickness;
    this.frameColor = config.frameColor || this.defaultConfig.sashColor; // 默认深棕色
    this.frameStrokeWidth = config.frameStrokeWidth || this.defaultConfig.sashStrokeWidth;
    this.frameStrokeColor = config.frameStrokeColor || this.defaultConfig.sashStrokeColor;
    this.sashType = config.sashType;
  }
  
  // 更新窗扇边框颜色
  updateData(color: string, strokeColor?: string, strokeWidth?: number) {
    this.frameColor = color;
    
    // 如果提供了边线颜色，更新它
    if (strokeColor !== undefined) {
      this.frameStrokeColor = strokeColor;
    }
    
    // 如果提供了边线宽度，更新它
    if (strokeWidth !== undefined) {
      this.frameStrokeWidth = strokeWidth;
    }
    this.render();
  }
  
  render(): KonvaRenderConfig {
    // 使用线条创建立体边框效果，而非简单矩形
    return {
      component: 'v-group',
      config: this.getKonvaConfig(),
      children: [
        // 上边框 - 立体效果
        {
          component: 'v-line',
          config: {
            points: [
              0, 0,                                 // 左上角
              this.width, 0,                        // 右上角
              this.width - this.thickness, this.thickness, // 右上内角
              this.thickness, this.thickness        // 左上内角
            ],
            closed: true,
            fill: this.frameColor,
            stroke: this.frameStrokeColor,
            strokeWidth: this.frameStrokeWidth,
            id: this.id,
            parentId: this.parentId,
            ele: 'window-sash-top-frame',
            tag: 'window-sash-top-frame'
          }
        },
        // 左边框 - 立体效果
        {
          component: 'v-line',
          config: {
            points: [
              0, 0,                                 // 左上角
              this.thickness, this.thickness,       // 左上内角
              this.thickness, this.height - this.thickness, // 左下内角
              0, this.height                         // 左下角
            ],
            closed: true,
            fill: this.frameColor,
            stroke: this.frameStrokeColor,
            strokeWidth: this.frameStrokeWidth,
            id: this.id,
            parentId: this.parentId,
            ele: 'window-sash-left-frame',
            tag: 'window-sash-left-frame'
          }
        },
        // 下边框 - 立体效果
        {
          component: 'v-line',
          config: {
            points: [
              0, this.height,                       // 左下角
              this.width, this.height,              // 右下角
              this.width - this.thickness, this.height - this.thickness, // 右下内角
              this.thickness, this.height - this.thickness // 左下内角
            ],
            closed: true,
            fill: this.frameColor,
            stroke: this.frameStrokeColor,
            strokeWidth: this.frameStrokeWidth,
            id: this.id,
            parentId: this.parentId,
            ele: 'window-sash-bottom-frame',
            tag: 'window-sash-bottom-frame'
          }
        },
        // 右边框 - 立体效果
        {
          component: 'v-line',
          config: {
            points: [
              this.width, 0,                        // 右上角
              this.width, this.height,              // 右下角
              this.width - this.thickness, this.height - this.thickness, // 右下内角
              this.width - this.thickness, this.thickness // 右上内角
            ],
            closed: true,
            fill: this.frameColor,
            stroke: this.frameStrokeColor,
            strokeWidth: this.frameStrokeWidth,
            id: this.id,
            parentId: this.parentId,
            ele: 'window-sash-right-frame',
            tag: 'window-sash-right-frame'
          }
        },
        // 玻璃边缘框 - 形成窗扇的内部轮廓（仅对非固定窗扇添加）
        // {
        //   component: 'v-rect',
        //   config: {
        //     x: this.thickness,
        //     y: this.thickness,
        //     width: this.width - this.thickness * 2,
        //     height: this.height - this.thickness * 2,
        //     stroke: '#555555',
        //     strokeWidth: 1,
        //     id: this.id + '-glass-border',
        //     parentId: this.parentId,
        //     ele: 'window-sash-glass-border',
        //     tag: 'window-sash-glass-border'
        //   }
        // }
      ]
    };
  }
}

// 窗户窗扇玻璃类
export class WindowSashGlass extends GlobalDefaultConfig {
  color: string;
  opacity: number;
  
  constructor(config: IDimension & { color?: string, opacity?: number }) {
    super(config);
    this.color = config.color || this.defaultConfig.glassColor; // 默认浅蓝色
    this.opacity = config.opacity || this.defaultConfig.glassOpacity;
  }
  
  // 更新玻璃颜色和透明度
  updateData(color: string, opacity?: number) {
    this.color = color;
    
    // 如果提供了透明度，更新它
    if (opacity !== undefined) {
      this.opacity = opacity;
    }
    
    this.render();
  }
  
  render(): KonvaRenderConfig {
    return {
      component: 'v-rect',
      config: {
        ...this.getKonvaConfig(),
        fill: this.color,
        opacity: this.opacity,
        strokeWidth: 0
      }
    };
  }
}

// 窗户窗扇把手类
export class WindowSashHandle extends WindowComponent {
  type: SashType;
  color: string;
  
  constructor(config: IDimension & { type: SashType, color?: string }) {
    super(config);
    this.type = config.type;
    this.color = config.color || '#C0C0C0'; // 默认银色
  }
  
  render(): KonvaRenderConfig {
    return {
      component: 'v-group',
      config: this.getKonvaConfig(),
      children: [
        {
          component: 'v-rect',
          config: {
            x: 0,
            y: 0,
            width: this.width,
            height: this.height,
            fill: this.color,
            cornerRadius: 2,
            id: this.id,
            parentId: this.parentId,
            ele: 'window-sash-handle',
            tag: 'window-sash-handle'
          }
        },
        {
          component: 'v-circle',
          config: {
            x: this.width / 2,
            y: this.height / 4,
            radius: this.width / 3,
            fill: '#A9A9A9',
            id: this.id,
            parentId: this.parentId,
            ele: 'window-sash-handle',
            tag: 'window-sash-handle'
          }
        }
      ]
    };
  }
}



