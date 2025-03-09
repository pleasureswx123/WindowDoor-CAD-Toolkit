/**
 * Konva事件和坐标处理工具函数
 */

/**
 * 获取Konva节点在页面上的绝对位置和尺寸
 * @param node Konva节点
 * @return 返回节点的页面绝对位置和尺寸
 */
export function getNodePageRect(node: any): { x: number; y: number; width: number; height: number } {
  if (!node) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  // 获取舞台对象
  const stage = node.getStage();
  if (!stage) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  // 获取节点在舞台上的绝对位置
  const absPos = node.getAbsolutePosition();

  // 获取节点尺寸（不同的Konva节点可能有不同的API获取尺寸）
  const nodeWidth = node.width ? node.width() : (node.getWidth ? node.getWidth() : 100);
  const nodeHeight = node.height ? node.height() : (node.getHeight ? node.getHeight() : 40);

  // 获取舞台容器的位置
  const stageContainer = stage.container();
  const stageRect = stageContainer.getBoundingClientRect();

  // 计算缩放和变换
  const scaleX = stage.scaleX();
  const scaleY = stage.scaleY();

  // 计算节点在页面上的绝对位置
  const pageX = stageRect.left + absPos.x * scaleX;
  const pageY = stageRect.top + absPos.y * scaleY;

  return {
    x: pageX,
    y: pageY,
    width: nodeWidth * scaleX,
    height: nodeHeight * scaleY
  };
}

/**
 * 获取舞台在特定点的缩放因子
 * @param stage Konva Stage实例
 * @returns 舞台的缩放因子
 */
export function getStageScale(stage: any): { x: number; y: number } {
  if (!stage) {
    return { x: 1, y: 1 };
  }
  
  return {
    x: stage.scaleX(),
    y: stage.scaleY()
  };
}

/**
 * 转换舞台坐标到页面坐标
 * @param stage Konva Stage实例
 * @param stageX 舞台X坐标
 * @param stageY 舞台Y坐标
 * @returns 页面坐标
 */
export function stageToPageCoordinates(stage: any, stageX: number, stageY: number): { x: number; y: number } {
  if (!stage) {
    return { x: stageX, y: stageY };
  }
  
  const stageContainer = stage.container();
  const stageRect = stageContainer.getBoundingClientRect();
  const scale = getStageScale(stage);
  
  return {
    x: stageRect.left + stageX * scale.x,
    y: stageRect.top + stageY * scale.y
  };
}

/**
 * 将页面坐标转换为舞台坐标
 * @param stage Konva Stage实例
 * @param pageX 页面X坐标
 * @param pageY 页面Y坐标
 * @returns 舞台坐标
 */
export function pageToStageCoordinates(stage: any, pageX: number, pageY: number): { x: number; y: number } {
  if (!stage) {
    return { x: pageX, y: pageY };
  }
  
  const stageContainer = stage.container();
  const stageRect = stageContainer.getBoundingClientRect();
  const scale = getStageScale(stage);
  
  return {
    x: (pageX - stageRect.left) / scale.x,
    y: (pageY - stageRect.top) / scale.y
  };
} 