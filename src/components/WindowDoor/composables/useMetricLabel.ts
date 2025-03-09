import { ref, computed, nextTick, watch } from 'vue';
import type { Ref } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import { getNodePageRect } from '../utils/konvaUtils';

// 默认尺寸约束
const DEFAULT_MIN_SIZE = 10; // 最小尺寸
const DEFAULT_MAX_SIZE = 10000; // 最大尺寸

// 分隔条默认尺寸
const DEVIDER_DEFAULT_SIZE = 40; // 分隔条默认尺寸
const DEVIDER_MIN_SIZE = 10; // 分隔条最小尺寸
const DEVIDER_MAX_SIZE = 200; // 分隔条最大尺寸

/**
 * 度量标签Composable - 处理度量标签的点击、悬停和尺寸更新逻辑
 * @param sectionId 区域ID，可能是数字或字符串
 * @param dimension 尺寸类型 ('width' | 'height')
 * @param currentValue 当前尺寸值
 * @param nodeType 节点类型，用于确定样式和尺寸约束
 * @returns 标签相关的状态和方法
 */
export function useMetricLabel(
  sectionId: number | string,
  dimension: 'width' | 'height',
  currentValue: number,
  nodeType?: string
) {
  const store = useWindowDoorStore();
  
  // 弹出输入框控制
  const showPopup = ref(false);
  const popupPosition = ref({ x: 0, y: 0 });
  const popupSize = ref({ width: 100, height: 40 });
  
  // 鼠标悬停状态
  const isHovered = ref(false);
  
  // 判断是否为特殊类型节点
  const isFrameMetric = computed(() => sectionId === 'root-width' || sectionId === 'root-height');
  const isRootSection = computed(() => sectionId === store.root.sections[0]?.id);
  const isDevider = computed(() => nodeType === 'devider');

  // 计算尺寸限制
  const sizeConstraints = computed(() => {
    // 基础约束 - 使用当前值作为参考
    let constraints = {
      min: Math.max(DEFAULT_MIN_SIZE, Math.round(currentValue * 0.5)), // 最小值为当前值的一半，不小于默认最小值
      max: Math.min(DEFAULT_MAX_SIZE, currentValue * 2), // 最大值为当前值的2倍，不大于默认最大值
      title: dimension === 'width' ? '调整宽度' : '调整高度',
      step: 10 // 默认步长
    };
    
    // 为整体窗户设置特殊约束
    if (isFrameMetric.value) {
      constraints = {
        min: 500, // 整体窗户最小尺寸
        max: 10000, // 整体窗户最大尺寸
        title: dimension === 'width' ? '调整窗户总宽度' : '调整窗户总高度',
        step: 50 // 整体尺寸使用较大步长
      };
    }
    // 为根窗户内部区域设置特殊约束
    else if (isRootSection.value) {
      constraints = {
        min: 400, // 根区域最小尺寸
        max: 10000, // 根区域最大尺寸
        title: dimension === 'width' ? '调整窗户内部宽度' : '调整窗户内部高度',
        step: 20 // 内部区域使用中等步长
      };
    }
    // 为分隔条设置特殊约束
    else if (isDevider.value) {
      constraints = {
        min: DEVIDER_MIN_SIZE, // 分隔条最小尺寸
        max: DEVIDER_MAX_SIZE, // 分隔条最大尺寸
        title: dimension === 'width' ? '调整分隔条宽度' : '调整分隔条高度',
        step: 2 // 分隔条使用较小步长
      };
    }
    // 普通区域
    else {
      constraints.title = dimension === 'width' ? '调整区域宽度' : '调整区域高度';
    }
    
    return constraints;
  });
  
  // 处理标签点击
  const handleLabelClick = (e: any) => {
    // 使用工具函数获取节点在页面上的位置和尺寸
    const nodeRect = getNodePageRect(e.currentTarget);
    
    // 设置弹出框位置
    popupPosition.value = {
      x: nodeRect.x,
      y: nodeRect.y
    };
    
    // 设置弹出框大小
    popupSize.value = {
      width: nodeRect.width,
      height: nodeRect.height
    };
    
    // 显示弹出框
    showPopup.value = true;
  };
  
  // 鼠标进入标签
  const handleMouseEnter = () => {
    isHovered.value = true;
    document.body.style.cursor = 'pointer';
  };
  
  // 鼠标离开标签
  const handleMouseLeave = () => {
    isHovered.value = false;
    document.body.style.cursor = 'default';
  };
  
  // 更新尺寸
  const updateValue = (newValue: number) => {
    // 验证尺寸是否在合理范围内
    const min = sizeConstraints.value.min;
    const max = sizeConstraints.value.max;
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    
    // 如果尺寸没有变化，不进行任何操作
    if (newValue === currentValue) {
      console.log('数值未变化，不执行更新');
      return;
    }
    
    console.log(`更新${dimension}：${currentValue} -> ${newValue}`);
    
    // 特殊框架度量标记
    if (sectionId === 'root-width') {
      store.updateWindowSize(newValue, store.root.height);
      store.triggerMetricsUpdate(); // 确保触发更新
      return;
    } else if (sectionId === 'root-height') {
      store.updateWindowSize(store.root.width, newValue);
      store.triggerMetricsUpdate(); // 确保触发更新
      return;
    }
    
    // 根区域内部
    if (isRootSection.value) {
      if (dimension === 'width') {
        const height = store.root.height - store.root.frameSize * 2;
        store.updateWindowSize(newValue + store.root.frameSize * 2, store.root.height);
      } else {
        const width = store.root.width;
        store.updateWindowSize(width, newValue + store.root.frameSize * 2);
      }
      store.triggerMetricsUpdate(); // 确保触发更新
      return;
    }
    
    // 普通区域和分隔条
    if (typeof sectionId === 'number') {
      if (dimension === 'width') {
        store.updateSectionSize(sectionId, newValue);
      } else {
        store.updateSectionSize(sectionId, undefined, newValue);
      }
      
      // 确保在尺寸更新后一定触发度量标注更新
      nextTick(() => {
        console.log('在nextTick中触发度量更新');
        store.triggerMetricsUpdate();
        
        // 再次延迟执行一次更新，确保所有变化都被捕获
        setTimeout(() => {
          console.log('在setTimeout中进行最终度量更新');
          store.triggerMetricsUpdate();
        }, 100);
      });
    }
  };
  
  // 关闭弹出框
  const closePopup = () => {
    showPopup.value = false;
  };
  
  return {
    showPopup,
    popupPosition,
    popupSize,
    isHovered,
    handleLabelClick,
    handleMouseEnter,
    handleMouseLeave,
    updateValue,
    closePopup,
    sizeConstraints,
    isDevider,
    isFrameMetric,
    isRootSection
  };
} 