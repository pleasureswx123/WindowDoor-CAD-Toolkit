/**
 * Konva属性配置工具
 * 用于生成正确类型的Konva组件属性配置
 */

// 基础形状样式
export const shapeStyles = {
  // 填充颜色
  fills: {
    transparent: 'transparent',
    white: 'white',
    black: 'black',
    blue: 'lightblue',
    green: 'green',
    highlight: {
      color: 'green',
      opacity: 0.3
    }
  },
  
  // 线条样式
  strokes: {
    black: {
      color: 'black',
      width: 1
    },
    highlight: {
      color: 'blue',
      width: 2
    }
  },
  
  // 文本样式
  text: {
    padding: 10,
    fontSize: 12
  },
  
  // 交互相关
  interaction: {
    hitStrokeWidth: 0,
    listening: true
  }
};

// 合并多个配置对象
export function mergeKonvaConfigs(...configs: Object[]): Object {
  return Object.assign({}, ...configs);
}

// 创建高亮矩形配置
export function createHighlightConfig(width: number, height: number) {
  return {
    width,
    height,
    fill: shapeStyles.fills.highlight.color,
    opacity: shapeStyles.fills.highlight.opacity,
    listening: shapeStyles.interaction.listening
  };
}

// 创建线条配置
export function createLineConfig(points: number[], options: any = {}) {
  return mergeKonvaConfigs(
    {
      points,
      stroke: shapeStyles.strokes.black.color,
      strokeWidth: shapeStyles.strokes.black.width,
      listening: shapeStyles.interaction.listening
    },
    options
  );
} 