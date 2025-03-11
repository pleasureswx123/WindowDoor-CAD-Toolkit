<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import { ElMessage } from 'element-plus';

const store = useWindowDoorStore();

// 判断是否有中挺被选中
const isEnabled = computed(() => !!store.selectedDevider);

// 中挺方向和类型
const splitDirection = computed(() => store.selectedDevider?.splitDirection);
const deviderDirection = computed(() => {
  const temp = { 'horizontal': '水平中挺', 'vertical': '垂直中挺' }
  return temp[splitDirection.value as keyof typeof temp] || '';
});

// 中挺厚度 - 根据方向选择对应的属性
const temp = { 'horizontal': 'height', 'vertical': 'width' }
const thicknessVal = computed({
  get: () => { 
    return store.selectedDevider?.[temp[splitDirection.value as keyof typeof temp]] || 0;
  },
  set: (newVal) => {
    // 更新中挺厚度，同时更新相邻元素
    if (store.selectedDevider) {
      const prevThickness = store.selectedDevider[temp[splitDirection.value as keyof typeof temp]];
      store.selectedDevider[temp[splitDirection.value as keyof typeof temp]] = newVal;
      
      // 更新相邻元素尺寸 - 使用Konva API
      updateAdjacentElements(prevThickness, newVal);
    }
  }
});

// 中挺相对坐标 - 根据方向约束移动
const relativeX = computed({
  get: () => store.selectedDevider?.x ?? 0,
  set: (newVal) => {
    if (store.selectedDevider) {
      // 垂直中挺才能改变X坐标
      if (splitDirection.value === 'vertical') {
        const prevX = store.selectedDevider.x;
        store.selectedDevider.x = newVal;
        
        // 更新相邻元素 - 水平方向的影响
        updateAdjacentElementsPosition('x', prevX, newVal);
      }
    }
  }
});

const relativeY = computed({
  get: () => store.selectedDevider?.y ?? 0,
  set: (newVal) => {
    if (store.selectedDevider) {
      // 水平中挺才能改变Y坐标
      if (splitDirection.value === 'horizontal') {
        const prevY = store.selectedDevider.y;
        store.selectedDevider.y = newVal;
        
        // 更新相邻元素 - 垂直方向的影响
        updateAdjacentElementsPosition('y', prevY, newVal);
      }
    }
  }
});

// 获取中挺节点的Konva引用
const getDeviderNode = () => {
  if (!store.selectedDevider) return null;
  
  const stages = document.querySelectorAll('.konvajs-content canvas');
  for (const canvas of stages) {
    const stage = (canvas as any)?.__vue_app__?.__instance?.parent?.parent?.ctx?.getStage?.();
    if (!stage) continue;
    
    // 查找所有图层
    const layers = stage.getLayers();
    for (const layer of layers) {
      // 递归查找中挺节点
      const deviderNode = findNodeById(layer, store.selectedDevider.id);
      if (deviderNode) return deviderNode;
    }
  }
  return null;
};

// 递归查找指定ID的节点
const findNodeById = (container: any, id: string): any => {
  // 先检查容器本身
  if (container.id() === id) return container;
  
  // 递归查找子节点
  const children = container.getChildren();
  if (!children) return null;
  
  for (const child of children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  
  return null;
};

// 查找相邻的元素节点
const findAdjacentElements = (deviderNode: any): any[] => {
  if (!deviderNode) return [];
  
  const parentGroup = deviderNode.getParent();
  if (!parentGroup) return [];
  
  // 获取同级节点，排除当前中挺节点
  return parentGroup.getChildren((node: any) => node.id() !== deviderNode.id());
};

// 更新相邻元素尺寸
const updateAdjacentElements = (prevThickness: number, newThickness: number) => {
  if (!store.selectedDevider) return;
  
  const deviderNode = getDeviderNode();
  if (!deviderNode) {
    console.warn('未找到中挺节点');
    return;
  }
  
  const adjacentElements = findAdjacentElements(deviderNode);
  if (adjacentElements.length === 0) {
    console.warn('未找到相邻元素');
    return;
  }
  
  // 计算需要调整的尺寸差值
  const diffThickness = newThickness - prevThickness;
  if (diffThickness === 0) return;
  
  // 根据中挺方向调整相邻元素
  if (splitDirection.value === 'vertical') {
    // 垂直中挺影响左右元素的宽度
    for (const element of adjacentElements) {
      // 获取元素位置，决定是增加还是减少宽度
      const elementX = element.x();
      
      // 依据相对位置决定如何调整宽度
      if (elementX < deviderNode.x()) {
        // 左侧元素
        // 保持宽度，仅将多余的宽度传递给数据模型
        const newWidth = element.width() - diffThickness;
        element.width(newWidth);
        
        // 更新数据模型
        store.updateElementSize(element.id(), {
          width: newWidth
        });
      } else {
        // 右侧元素
        // 调整位置和宽度
        const newX = element.x() + diffThickness;
        element.x(newX);
        
        // 更新数据模型
        store.updateElementPosition(element.id(), newX, element.y());
      }
    }
  } else {
    // 水平中挺影响上下元素的高度
    for (const element of adjacentElements) {
      // 获取元素位置，决定是增加还是减少高度
      const elementY = element.y();
      
      // 依据相对位置决定如何调整高度
      if (elementY < deviderNode.y()) {
        // 上方元素
        // 保持高度，仅将多余的高度传递给数据模型
        const newHeight = element.height() - diffThickness;
        element.height(newHeight);
        
        // 更新数据模型
        store.updateElementSize(element.id(), {
          height: newHeight
        });
      } else {
        // 下方元素
        // 调整位置和高度
        const newY = element.y() + diffThickness;
        element.y(newY);
        
        // 更新数据模型
        store.updateElementPosition(element.id(), element.x(), newY);
      }
    }
  }
  
  // 更新Stage以反映变化
  const stage = deviderNode.getStage();
  if (stage) {
    stage.batchDraw();
  }
};

// 更新相邻元素位置
const updateAdjacentElementsPosition = (axis: 'x' | 'y', prevValue: number, newValue: number) => {
  if (!store.selectedDevider) return;
  
  const deviderNode = getDeviderNode();
  if (!deviderNode) {
    console.warn('未找到中挺节点');
    return;
  }
  
  const adjacentElements = findAdjacentElements(deviderNode);
  if (adjacentElements.length === 0) {
    console.warn('未找到相邻元素');
    return;
  }
  
  // 计算位置差值
  const posDiff = newValue - prevValue;
  if (posDiff === 0) return;
  
  const isVertical = splitDirection.value === 'vertical';
  
  // 根据中挺方向调整相邻元素
  for (const element of adjacentElements) {
    const elementPos = isVertical ? element.x() : element.y();
    
    // 中挺是垂直的，处理左右元素
    if (isVertical && axis === 'x') {
      if (elementPos > prevValue) {
        // 右侧元素跟随中挺移动
        const newX = element.x() + posDiff;
        element.x(newX);
        
        // 同时调整宽度
        const newWidth = element.width() - posDiff;
        element.width(newWidth);
        
        // 更新数据模型
        store.updateElementPosition(element.id(), newX, element.y());
        store.updateElementSize(element.id(), {
          width: newWidth
        });
      } else {
        // 左侧元素宽度调整
        const newWidth = element.width() + posDiff;
        element.width(newWidth);
        
        // 更新数据模型
        store.updateElementSize(element.id(), {
          width: newWidth
        });
      }
    }
    
    // 中挺是水平的，处理上下元素
    if (!isVertical && axis === 'y') {
      if (elementPos > prevValue) {
        // 下方元素跟随中挺移动
        const newY = element.y() + posDiff;
        element.y(newY);
        
        // 同时调整高度
        const newHeight = element.height() - posDiff;
        element.height(newHeight);
        
        // 更新数据模型
        store.updateElementPosition(element.id(), element.x(), newY);
        store.updateElementSize(element.id(), {
          height: newHeight
        });
      } else {
        // 上方元素高度调整
        const newHeight = element.height() + posDiff;
        element.height(newHeight);
        
        // 更新数据模型
        store.updateElementSize(element.id(), {
          height: newHeight
        });
      }
    }
  }
  
  // 更新中挺位置
  deviderNode.position({
    x: isVertical ? newValue : deviderNode.x(),
    y: !isVertical ? newValue : deviderNode.y()
  });
  
  // 更新Stage以反映变化
  const stage = deviderNode.getStage();
  if (stage) {
    stage.batchDraw();
  }
};

// 应用坐标按钮事件处理
const applyPosition = () => {
  // 更新中挺节点位置，并同步更新相邻元素
  const deviderNode = getDeviderNode();
  if (!deviderNode || !store.selectedDevider) {
    ElMessage.warning('未找到中挺节点，无法更新位置');
    return;
  }
  
  // 获取之前的位置
  const prevX = deviderNode.x();
  const prevY = deviderNode.y();
  
  // 设置新位置，根据中挺方向约束移动
  if (splitDirection.value === 'vertical') {
    // 垂直中挺只能左右移动
    deviderNode.x(relativeX.value);
    updateAdjacentElementsPosition('x', prevX, relativeX.value);
  } else {
    // 水平中挺只能上下移动
    deviderNode.y(relativeY.value);
    updateAdjacentElementsPosition('y', prevY, relativeY.value);
  }
  
  // 更新数据模型
  store.updateDeviderPosition(
    store.selectedDevider.id,
    deviderNode.x(),
    deviderNode.y()
  );
  
  ElMessage.success('已应用新坐标并调整相邻元素');
};

// 推导最佳中挺位置
const inferOptimalPosition = () => {
  if (!store.selectedDevider) return;
  
  const deviderNode = getDeviderNode();
  if (!deviderNode) {
    ElMessage.warning('未找到中挺节点');
    return;
  }
  
  const adjacentElements = findAdjacentElements(deviderNode);
  if (adjacentElements.length < 2) {
    ElMessage.warning('未找到足够的相邻元素以推导位置');
    return;
  }
  
  // 根据中挺方向计算最佳位置
  if (splitDirection.value === 'vertical') {
    // 垂直中挺最佳位置：平分左右宽度
    
    // 对元素按X坐标排序
    adjacentElements.sort((a: any, b: any) => a.x() - b.x());
    
    // 找到最左和最右的元素
    const leftMost = adjacentElements[0];
    const rightMost = adjacentElements[adjacentElements.length - 1];
    
    // 计算中点位置
    const optimalX = leftMost.x() + leftMost.width() + 
                    (rightMost.x() - (leftMost.x() + leftMost.width())) / 2 - 
                    deviderNode.width() / 2;
    
    // 更新X坐标
    const prevX = deviderNode.x();
    relativeX.value = Math.round(optimalX);
    
    // 应用新位置
    updateAdjacentElementsPosition('x', prevX, relativeX.value);
    
  } else {
    // 水平中挺最佳位置：平分上下高度
    
    // 对元素按Y坐标排序
    adjacentElements.sort((a: any, b: any) => a.y() - b.y());
    
    // 找到最上和最下的元素
    const topMost = adjacentElements[0];
    const bottomMost = adjacentElements[adjacentElements.length - 1];
    
    // 计算中点位置
    const optimalY = topMost.y() + topMost.height() + 
                    (bottomMost.y() - (topMost.y() + topMost.height())) / 2 - 
                    deviderNode.height() / 2;
    
    // 更新Y坐标
    const prevY = deviderNode.y();
    relativeY.value = Math.round(optimalY);
    
    // 应用新位置
    updateAdjacentElementsPosition('y', prevY, relativeY.value);
  }
  
  // 更新数据模型
  store.updateDeviderPosition(
    store.selectedDevider.id,
    deviderNode.x(),
    deviderNode.y()
  );
  
  ElMessage.success('已推导并应用最佳中挺位置');
};

// 尺寸值格式化
function formatSizeInput(value: string): number {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return 40;
  
  // 限制最大最小值
  return Math.min(Math.max(parsed, 10), 200);
}

// 坐标值格式化
function formatCoordinateInput(value: string): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// 监听中挺选择变化
watch(() => store.selectedDevider, (newDevider) => {
  if (!newDevider) return;
  
  // 当中挺被选中时，更新UI显示
  console.log('中挺已选中:', newDevider);
}, { immediate: true });

// 检查Konva节点是否存在的函数 - 用于UI禁用状态控制
const konvaNodeExists = computed(() => {
  return !!getDeviderNode();
});
</script>

<template>
  <div :class="{ 'devider-edit-disabled': !isEnabled }">
    <!-- 未选择中挺时的提示 -->
    <el-empty v-if="!isEnabled" description="请先选择一个中挺以编辑" :image-size="100" />

    <!-- 已选择中挺时的设置面板 -->
    <div v-else class="devider-settings">
      <el-alert type="info" :closable="false" class="devider-info" show-icon>
        <template #title>
          <span>{{ deviderDirection }}</span>
        </template>
        <template #default>
          <div class="devider-info-content">
            <div class="info-item">
              <icon-tabler-id class="info-icon" />
              <span>ID: {{ store.selectedDevider?.id }}</span>
            </div>
            <div class="info-item">
              <icon-lucide-move-horizontal v-if="splitDirection === 'horizontal'" class="info-icon" />
              <icon-lucide-move-vertical v-else class="info-icon" />
              <span>方向: {{ deviderDirection }}</span>
            </div>
          </div>
        </template>
      </el-alert>

      <div class="settings-form">
        <el-form label-position="top">
          <el-form-item label="中挺厚度 (mm)">
            <el-input-number 
              v-model="thicknessVal" 
              :min="10" 
              :max="200" 
              :step="5"
              controls-position="right"
              :formatter="(val: number) => `${val}`"
              :parser="(val: string) => formatSizeInput(val)"
              size="small"
              style="width: 100%;"
            >
              <template #suffix>
                <el-tooltip content="中挺的厚度，调整后会影响相邻元素" placement="top">
                  <icon-tabler-info-circle class="info-icon" />
                </el-tooltip>
              </template>
            </el-input-number>
          </el-form-item>

          <!-- 坐标设置分组 -->
          <el-divider>坐标位置</el-divider>
          
          <!-- 相对坐标设置 -->
          <div class="coordinate-controls">
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="相对X坐标 (px)">
                  <el-input-number 
                    v-model="relativeX" 
                    :step="1"
                    controls-position="right"
                    :formatter="(val: number) => `${val}`"
                    :parser="(val: string) => formatCoordinateInput(val)"
                    size="small"
                    style="width: 100%;"
                    :disabled="splitDirection !== 'vertical'"
                  >
                    <template #suffix>
                      <el-tooltip :content="splitDirection === 'vertical' ? '垂直中挺可左右移动' : '水平中挺不能左右移动'" placement="top">
                        <icon-tabler-info-circle class="info-icon" />
                      </el-tooltip>
                    </template>
                  </el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="相对Y坐标 (px)">
                  <el-input-number 
                    v-model="relativeY" 
                    :step="1"
                    controls-position="right"
                    :formatter="(val: number) => `${val}`"
                    :parser="(val: string) => formatCoordinateInput(val)"
                    size="small"
                    style="width: 100%;"
                    :disabled="splitDirection !== 'horizontal'"
                  >
                    <template #suffix>
                      <el-tooltip :content="splitDirection === 'horizontal' ? '水平中挺可上下移动' : '垂直中挺不能上下移动'" placement="top">
                        <icon-tabler-info-circle class="info-icon" />
                      </el-tooltip>
                    </template>
                  </el-input-number>
                </el-form-item>
              </el-col>
            </el-row>
            
            <!-- 坐标说明 -->
            <div class="coordinate-hint">
              <icon-tabler-alert-circle class="hint-icon" />
              <span v-if="splitDirection === 'vertical'">垂直中挺只能左右移动(X坐标)，调整后会影响相邻元素</span>
              <span v-else>水平中挺只能上下移动(Y坐标)，调整后会影响相邻元素</span>
            </div>
            
            <div class="coordinate-actions">
              <el-button 
                type="primary" 
                size="small" 
                @click="applyPosition"
                :disabled="!konvaNodeExists"
              >
                应用坐标
              </el-button>
              <el-button
                type="success"
                size="small"
                @click="inferOptimalPosition"
                :disabled="!konvaNodeExists"
              >
                <icon-lucide-zap class="button-icon" />
                推导最佳位置
              </el-button>
            </div>
          </div>
          
          <!-- 中挺预览 -->
          <el-divider>中挺预览</el-divider>
          <div class="devider-preview">
            <div :class="['preview-shape', splitDirection]" :style="{
              width: splitDirection === 'vertical' ? `${thicknessVal}px` : '100px',
              height: splitDirection === 'horizontal' ? `${thicknessVal}px` : '100px',
            }">
              <icon-lucide-move-horizontal v-if="splitDirection === 'horizontal'" class="preview-icon" />
              <icon-lucide-move-vertical v-else class="preview-icon" />
            </div>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.devider-edit-disabled {
  opacity: 0.7;
  padding: 20px;
  text-align: center;
}

.devider-settings {
  padding: 0;
}

.devider-info {
  margin-bottom: 16px;
  font-weight: 500;
}

.devider-info-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.info-icon {
  color: #909399;
}

.settings-form {
  margin-bottom: 16px;
}

.coordinate-controls {
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
}

.coordinate-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0;
  padding: 8px;
  background-color: #f0f9ff;
  border-radius: 4px;
  border-left: 3px solid #409eff;
  font-size: 13px;
  color: #606266;
}

.hint-icon {
  color: #409eff;
}

.coordinate-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  gap: 8px;
}

.button-icon {
  margin-right: 4px;
}

.devider-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 16px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
  height: 150px;
}

.preview-shape {
  background-color: #d3d3d3;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-icon {
  color: #606266;
}

.preview-shape.horizontal {
  width: 100px;
  min-height: 20px;
}

.preview-shape.vertical {
  height: 100px;
  min-width: 20px;
}

/* 自定义表单样式 */
:deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
  font-size: 14px;
  padding-bottom: 4px;
}

:deep(.el-input-number .el-input__wrapper) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

:deep(.el-input-number:focus-within .el-input__wrapper) {
  box-shadow: 0 0 0 1px #4a90e2 inset;
}

:deep(.el-divider__text) {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

/* 响应式样式 */
@media (max-width: 576px) {
  .devider-preview {
    height: 100px;
  }
  
  .coordinate-actions {
    flex-direction: column;
  }
}
</style> 