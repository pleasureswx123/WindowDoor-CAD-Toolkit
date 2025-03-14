/**
 * Konva助手工具
 * 提供与Konva节点交互的实用函数
 */

// 判断是否为开发环境
const isDevMode = typeof window !== 'undefined' && window.location.hostname === 'localhost';

/**
 * 安全地获取Konva节点
 * 处理多种情况：
 * 1. 直接传入Konva节点
 * 2. 传入Vue组件引用（带getNode方法）
 * 3. 传入ref对象（需要访问.value）
 * 
 * @param obj 任意对象，可能是Konva节点、Vue组件或ref引用
 * @returns Konva节点或原始对象（如果无法获取节点）
 */
export function getKonvaNode(obj: any): any {
  if (!obj) return null;
  
  // 开发环境下记录更详细的诊断信息
  if (isDevMode) {
    console.debug('获取Konva节点，输入类型:', typeof obj);
    if (obj.getNode) console.debug('- 对象有getNode方法');
    if (obj.nodeType) console.debug('- 对象有nodeType属性:', obj.nodeType);
    if (obj.value) console.debug('- 对象有value属性');
  }

  try {
    // 情况1: 对象自身就是原生Konva节点
    // Konva节点应该有类似setAttrs, getAttrs, getStage, getLayer等方法
    if (obj.attrs || obj.setAttrs || obj.getAttrs || obj.getStage || obj.getLayer) {
      return obj; // 直接返回原生Konva对象
    }
    
    // 情况2: 对象是Vue-Konva组件包装（有getNode方法）
    if (obj.getNode && typeof obj.getNode === 'function') {
      try {
        const node = obj.getNode();
        if (node) return node;
      } catch (e) {
        if (isDevMode) console.warn('调用getNode()方法失败:', e);
      }
    }
    
    // 情况3: 对象是Vue ref (有value属性)
    if (obj.value !== undefined) {
      // Ref可能指向Konva节点或Vue组件
      return getKonvaNode(obj.value);
    }
    
    // 情况4: 对象是Vue实例 (可能有$el, $refs等属性)
    if (obj.$el || obj.$refs) {
      // 尝试从Vue组件中获取Konva节点
      try {
        if (obj.$el && obj.$el.getNode && typeof obj.$el.getNode === 'function') {
          return obj.$el.getNode();
        }
      } catch (e) {
        if (isDevMode) console.warn('从Vue组件$el获取Konva节点失败:', e);
      }
    }
    
    // 找不到Konva节点，返回原始对象
    // 这允许调用代码尝试直接使用原始对象
    return obj;
  } catch (e) {
    if (isDevMode) console.error('getKonvaNode错误:', e);
    return obj; // 错误时返回原始对象
  }
}

/**
 * 安全地阻止事件默认行为
 * 处理不同事件对象类型
 * 
 * @param e 事件对象，可能是原生事件或Konva事件
 */
export function safePreventDefault(e: any): void {
  if (!e) return;
  
  try {
    // 处理Konva事件对象（带evt属性）
    if (e.evt && typeof e.evt.preventDefault === 'function') {
      e.evt.preventDefault();
    } 
    // 处理原生DOM事件
    else if (typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
  } catch (err) {
    if (isDevMode) console.warn('阻止默认行为失败:', err);
  }
}

/**
 * 从各种引用中获取Konva属性值
 * 
 * @param obj Konva对象或组件引用
 * @param attrName 属性名称
 * @param defaultValue 默认值
 */
export function getKonvaAttr(obj: any, attrName: string, defaultValue: any = null): any {
  const node = getKonvaNode(obj);
  if (!node) return defaultValue;
  
  try {
    // 处理Konva节点
    if (typeof node.getAttr === 'function') {
      return node.getAttr(attrName);
    }
    
    // 处理有attrs属性的对象
    if (node.attrs && attrName in node.attrs) {
      return node.attrs[attrName];
    }
    
    // 直接访问属性（如x, y, width等）
    if (typeof node[attrName] === 'function') {
      return node[attrName]();
    }
    
    // 属性可能是直接在对象上
    if (attrName in node) {
      return node[attrName];
    }
  } catch (e) {
    if (isDevMode) console.warn(`获取属性${attrName}失败:`, e);
  }
  
  return defaultValue;
}

/**
 * 安全地设置Konva属性
 * 
 * @param obj Konva对象或组件引用
 * @param attrName 属性名称
 * @param value 要设置的值
 * @returns 是否成功设置
 */
export function setKonvaAttr(obj: any, attrName: string, value: any): boolean {
  const node = getKonvaNode(obj);
  if (!node) return false;
  
  try {
    // 使用setAttr方法
    if (typeof node.setAttr === 'function') {
      node.setAttr(attrName, value);
      return true;
    }
    
    // 直接设置属性（如x, y, width等）
    if (typeof node[attrName] === 'function') {
      node[attrName](value);
      return true;
    }
    
    // 直接在对象上设置
    node[attrName] = value;
    return true;
  } catch (e) {
    if (isDevMode) console.warn(`设置属性${attrName}失败:`, e);
    return false;
  }
} 