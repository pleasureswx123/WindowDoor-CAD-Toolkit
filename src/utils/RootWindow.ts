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

import { ref, computed } from 'vue';
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
      tag: this.tag
    };
  }
  
  // 基类的render方法
  render(): KonvaRenderConfig {
    throw new Error('子类必须实现render方法');
  }
}

// 窗户结构类 - 整个窗户的根类
export class WindowStructure extends WindowComponent {
  frame: WindowFrame;
  mainArea: WindowEmptyArea;
  frameSize: number;
  width: number;
  height: number;
  
  constructor(width: number, height: number, frameSize: number = 50) {
    super({ x: 0, y: 0, width, height, tag: 'root-window', ele: 'root-window' });
    this.width = width;
    this.height = height;
    this.frameSize = frameSize;
    
    // 创建主框架
    this.frame = new WindowFrame({
      x: 0,
      y: 0,
      width,
      height,
      thickness: frameSize,
      ele: 'window-frame',
      tag: 'window-frame',
      parentId: this.id
    });
    
    // 创建主空白区域
    this.mainArea = new WindowEmptyArea({
      x: 0,
      y: 0,
      width: width - frameSize * 2,
      height: height - frameSize * 2,
      ele: 'window-empty-area',
      tag: 'window-empty-area',
      parentId: this.id
    });
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
export class WindowFrame extends WindowComponent {
  thickness: number;
  color: string;
  
  constructor(config: IDimension & { thickness: number, color?: string }) {
    super(config);
    this.thickness = config.thickness || 50;
    this.color = config.color || '#8B4513'; // 默认棕色
  }
  
  render(): KonvaRenderConfig {
    // 创建四个边框矩形
    const topFrame: KonvaRenderConfig = {
      component: 'v-rect',
      config: {
        x: 0,
        y: 0,
        width: this.width,
        height: this.thickness,
        fill: this.color,
        ele: 'top-frame',
        tag: 'top-frame',
        id: this.id
      }
    };
    
    const rightFrame: KonvaRenderConfig = {
      component: 'v-rect',
      config: {
        x: this.width - this.thickness,
        y: 0,
        width: this.thickness,
        height: this.height,
        fill: this.color,
        ele: 'right-frame',
        tag: 'right-frame',
        id: this.id
      }
    };
    
    const bottomFrame: KonvaRenderConfig = {
      component: 'v-rect',
      config: {
        x: 0,
        y: this.height - this.thickness,
        width: this.width,
        height: this.thickness,
        fill: this.color,
        ele: 'bottom-frame',
        tag: 'bottom-frame',
        id: this.id
      }
    };
    
    const leftFrame: KonvaRenderConfig = {
      component: 'v-rect',
      config: {
        x: 0,
        y: 0,
        width: this.thickness,
        height: this.height,
        fill: this.color,
        ele: 'left-frame',
        tag: 'left-frame',
        id: this.id
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
export class WindowEmptyArea extends WindowComponent {
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
    this.thickness = 0;
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
      type: type,
      ele: 'window-sash',
      tag: 'window-sash',
      parentId: this.id
    });
  }
  
  // 分割区域
  splitArea(direction: 'horizontal' | 'vertical', pointerPosition: { x: number, y: number }, thickness: number = 40) {
    if (this.sash) {
      console.error('此区域已有窗扇，无法分割');
      return;
    }
    
    this.splitDirection = direction;
    this.pointerPosition = pointerPosition;
    this.thickness = thickness;
    
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
        parentId: this.id
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
        parentId: this.id
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
        parentId: this.id
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
        parentId: this.id
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
export class WindowMuntin extends WindowComponent {
  direction: 'horizontal' | 'vertical';
  thickness: number;
  color: string;
  
  constructor(config: IDimension & { direction: 'horizontal' | 'vertical', thickness?: number, color?: string }) {
    super(config);
    this.direction = config.direction;
    this.thickness = config.thickness || 40;
    this.color = config.color || '#8B4513'; // 默认棕色
  }

  changeColor(color: string) {
    this.color = color;
  }
  
  render(): KonvaRenderConfig {
    return {
      component: 'v-rect',
      config: {
        ...this.getKonvaConfig(),
        fill: this.color,
        // stroke: '#666666',
        // strokeWidth: 1,
        direction: this.direction,
        thickness: this.thickness,
        width: this.width,
        height: this.height,
        draggable: true,
        parent: this.parent,
        dragBoundFunc(pos: { x: number, y: number }) {
          // const posInfo = this.getAbsolutePosition();
          // const parentSize = this.parent.getSize();
          // const parentSize = this.parent.getClientRect();
          // this.getPosition()
          // this.getAbsolutePosition()
          // this.getRelativePointerPosition()
          // this.getClientRect()
          // console.log('posInfo', posInfo, pos, parentSize);
          const direction = this.getAttrs().direction;
          // console.log('sss', this.absolutePosition(), this.position(), this.getClientRect());
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
          // 记录拖动开始时的位置信息
          this.startPos = this.getPosition();
          // 保存当前方向
          this.dragDirection = this.getAttrs().direction;; 
          // 获取父容器尺寸
          this.parentWidth = this.getAttrs().parent.width;
          this.parentHeight = this.getAttrs().parent.height;
          this.thickness = this.getAttrs().thickness || 10;
        },
        onDragMove(e: any) {
          // 获取当前位置
          const pos = this.getPosition();
          // 获取舞台上的相对位置
          const stage = e.target.getStage();
          const pointerPos = stage.getPointerPosition();
          
          // 根据中挺方向处理拖动
          if (this.dragDirection === 'horizontal') {
            // 水平中挺只能上下拖动，锁定x坐标
            this.x(this.startPos.x);
            
            // 计算新的y坐标，但不能小于最小安全距离或大于父容器高度减去安全距离
            const minY = this.thickness * 1.5; // 安全距离
            const maxY = this.parentHeight - minY;
            
            // 限制y的有效范围
            let newY = pos.y;
            if (newY < minY) {
              newY = minY;
            } else if (newY > maxY) {
              newY = maxY;
            }
            
            // 设置新的y坐标
            this.y(newY);
            
            // 通知父元素更新分割区域
            if (typeof this.getAttrs().parent.splitArea === 'function') {
              this.dragPos = {x: 0, y: newY};
            }
          } else if (this.dragDirection === 'vertical') {
            // 垂直中挺只能左右拖动，锁定y坐标
            this.y(this.startPos.y);
            
            // 计算新的x坐标，但不能小于最小安全距离或大于父容器宽度减去安全距离
            const minX = this.thickness * 1.5; // 安全距离
            const maxX = this.parentWidth - minX;
            
            // 限制x的有效范围
            let newX = pos.x;
            if (newX < minX) {
              newX = minX;
            } else if (newX > maxX) {
              newX = maxX;
            }
            
            // 设置新的x坐标
            this.x(newX);
            
            // 通知父元素更新分割区域
            if (typeof this.getAttrs().parent.splitArea === 'function') {
              this.dragPos = {x: newX, y: 0};
            }
          }
        },
        onDragEnd(e: any) {
          // 最后一次更新分割区域，确保数据同步
          if (typeof this.getAttrs().parent.splitArea === 'function') {
            this.getAttrs().parent.splitArea(this.dragDirection, this.dragPos);
          }
          // 清除临时状态
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
export class WindowSash extends WindowComponent {
  type: SashType;
  frame: WindowSashFrame;
  glass: WindowSashGlass;
  handle: WindowSashHandle | null;
  
  constructor(config: IDimension & { type: SashType }) {
    super(config);
    this.type = config.type;
    
    const frameSize = this.type === 'fixed' ? 0 : 40;
    
    // 创建窗扇框架
    this.frame = new WindowSashFrame({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      thickness: frameSize,
      ele: 'window-sash-frame',
      tag: 'window-sash-frame',
      parentId: this.id
    });
    
    // 创建窗扇玻璃
    this.glass = new WindowSashGlass({
      x: this.x + frameSize,
      y: this.y + frameSize,
      width: this.width - frameSize * 2,
      height: this.height - frameSize * 2,
      ele: 'window-sash-glass',
      tag: 'window-sash-glass',
      parentId: this.id
    });
    
    // 如果不是固定窗，添加把手
    this.handle = this.type !== 'fixed' ? new WindowSashHandle({
      x: this.type.includes('left') ? this.x + this.width - 20 : this.x + 10,
      y: this.y + this.height / 2 - 15,
      width: 10,
      height: 30,
      type: this.type,
      ele: 'window-sash-handle',
      tag: 'window-sash-handle',
      parentId: this.id
    }) : null;
  }
  
  render(): KonvaRenderConfig {
    const children: KonvaRenderConfig[] = [
      this.frame.render(),
      this.glass.render()
    ];
    
    if (this.handle) {
      children.push(this.handle.render());
    }
    
    return {
      component: 'v-group',
      config: this.getKonvaConfig(),
      children
    };
  }
}

// 窗户窗扇边框类
export class WindowSashFrame extends WindowComponent {
  thickness: number;
  color: string;
  
  constructor(config: IDimension & { thickness: number, color?: string }) {
    super(config);
    this.thickness = config.thickness;
    this.color = config.color || '#A0522D'; // 默认深棕色
  }
  
  render(): KonvaRenderConfig {
    // 与WindowFrame类似，创建四个边框矩形
    const topFrame: KonvaRenderConfig = {
      component: 'v-rect',
      config: {
        x: 0,
        y: 0,
        width: this.width,
        height: this.thickness,
        fill: this.color,
        id: this.id,
        type: 'top-sash-frame',
        name: 'top-sash-frame'
      }
    };
    
    const rightFrame: KonvaRenderConfig = {
      component: 'v-rect',
      config: {
        x: this.width - this.thickness,
        y: 0,
        width: this.thickness,
        height: this.height,
        fill: this.color,
        id: this.id,
        type: 'right-sash-frame',
        name: 'right-sash-frame'
      }
    };
    
    const bottomFrame: KonvaRenderConfig = {
      component: 'v-rect',
      config: {
        x: 0,
        y: this.height - this.thickness,
        width: this.width,
        height: this.thickness,
        fill: this.color,
        id: this.id,
        type: 'bottom-sash-frame',
        name: 'bottom-sash-frame'
      }
    };
    
    const leftFrame: KonvaRenderConfig = {
      component: 'v-rect',
      config: {
        x: 0,
        y: 0,
        width: this.thickness,
        height: this.height,
        fill: this.color,
        id: this.id,
        type: 'left-sash-frame',
        name: 'left-sash-frame'
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

// 窗户窗扇玻璃类
export class WindowSashGlass extends WindowComponent {
  color: string;
  opacity: number;
  
  constructor(config: IDimension & { color?: string, opacity?: number }) {
    super(config);
    this.color = config.color || '#ADD8E6'; // 默认浅蓝色
    this.opacity = config.opacity || 0.7;
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
            cornerRadius: 2
          }
        },
        {
          component: 'v-circle',
          config: {
            x: this.width / 2,
            y: this.height / 4,
            radius: this.width / 3,
            fill: '#A9A9A9'
          }
        }
      ]
    };
  }
}



