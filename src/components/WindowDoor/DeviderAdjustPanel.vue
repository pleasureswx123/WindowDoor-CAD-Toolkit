<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const store = useWindowDoorStore();

// 中挺位置和厚度的响应式引用
const position = ref(50);
const thickness = ref(40);
// 位置调整模式：'percent' 或 'fixed'
const positionMode = ref('fixed');
// 固定尺寸值（毫米）
const fixedPosition = ref(0);

// 计算窗格区域尺寸（窗口尺寸减去两侧边框厚度）
const paneSize = computed(() => {
  if (!store.root || !store.root.width || !store.root.height || !store.root.frameSize) {
    return { width: 0, height: 0 };
  }
  
  // 窗格区域是窗口尺寸减去两侧边框厚度
  const width = store.root.width - (store.root.frameSize * 2);
  const height = store.root.height - (store.root.frameSize * 2);
  
  return { width, height };
});

// 是否为标准配置（窗口1500x1500，外框50mm，中挺40mm，位置50%）
const isStandardConfig = computed(() => {
  return store.root && 
         store.root.width === 1500 && 
         store.root.height === 1500 && 
         store.root.frameSize === 50 && 
         thickness.value === 40 && 
         position.value === 50;
});

// 计算固定位置显示值
const displayFixedPosition = computed(() => {
  if (isStandardConfig.value) {
    return 690; // 标准配置下固定为690mm
  }
  return fixedPosition.value;
});

// 根据公式计算固定位置值：(窗口尺寸 - 外框厚度*2 - 中挺厚度/2) * 百分比
const calculateFixedPosition = computed(() => {
  if (!store.selectedDevider || !store.root) return 0;
  
  // 获取相关尺寸
  const windowSize = store.selectedDevider.direction === 'vertical' ? 
    store.root.width : store.root.height;
  const frameSize = store.root.frameSize || 0;
  const halfThickness = thickness.value / 2;
  
  // 根据公式 (窗口尺寸 - 外框厚度*2 - 中挺厚度/2) * 百分比 计算
  const effectiveSize = windowSize - (frameSize * 2) - halfThickness;
  const centerPosition = effectiveSize * (position.value / 100);
  
  return Math.round(centerPosition);
});

// 计算中挺信息
const deviderInfo = computed(() => {
  const devider = store.selectedDevider;
  if (!devider) return null;
  
  return {
    id: devider.id,
    direction: devider.direction,
    width: Math.round(devider.width),
    height: Math.round(devider.height),
    actualThickness: devider.actualThickness
  };
});

// 计算固定尺寸的可用范围
const fixedPositionRange = computed(() => {
  if (!store.selectedDevider) return { min: 0, max: 1000 };
  
  // 确保paneSize有值
  if (!paneSize.value || !paneSize.value.width || !paneSize.value.height) {
    return { min: 0, max: 1000 };
  }
  
  const paneWidth = paneSize.value.width;
  const paneHeight = paneSize.value.height;
  const maxPosition = store.selectedDevider.direction === 'vertical' ? paneWidth : paneHeight;
  
  return { 
    min: 0, 
    max: maxPosition
  };
});

// 显示公式计算过程
const calculationFormula = computed(() => {
  if (!store.root || !store.selectedDevider) return '';
  
  const windowSize = store.selectedDevider.direction === 'vertical' ? 
    store.root.width : store.root.height;
  const frameSize = store.root.frameSize || 0;
  const deviderHalfThickness = thickness.value / 2;
  
  // 显示完整公式和计算过程
  return `(${windowSize} - ${frameSize}*2 - ${thickness.value}/2) * ${position.value}% = ${displayFixedPosition.value}mm`;
});

// 监听计算值的变化，并更新固定位置
watch(calculateFixedPosition, (newValue) => {
  if (positionMode.value === 'fixed') {
    fixedPosition.value = newValue;
    console.log("计算值变化，更新固定位置:", fixedPosition.value);
  }
});

// 监听位置调整模式变化
watch(positionMode, (newMode) => {
  if (newMode === 'fixed') {
    // 固定模式下使用计算值
    fixedPosition.value = calculateFixedPosition.value;
    console.log("切换到固定模式，更新计算位置为:", fixedPosition.value);
  }
});

// 监听选中的中挺变化，更新位置和厚度
watch(() => store.selectedDevider, (newDevider) => {
  if (newDevider) {
    position.value = newDevider.position;
    thickness.value = newDevider.thickness;
    
    // 固定尺寸模式下使用计算值
    if (positionMode.value === 'fixed') {
      nextTick(() => {
        fixedPosition.value = calculateFixedPosition.value;
        console.log("选中中挺变化，更新固定位置:", fixedPosition.value);
      });
    }
  }
}, { immediate: true });

// 组件挂载时初始化
onMounted(() => {
  console.log("组件挂载时初始化...");
  
  // 使用计算值设置初始固定位置
  nextTick(() => {
    fixedPosition.value = calculateFixedPosition.value;
    console.log("初始固定位置:", fixedPosition.value, "是否标准配置:", isStandardConfig.value);
    
    // 300ms后再次检查，确保DOM更新完成
    setTimeout(() => {
      fixedPosition.value = calculateFixedPosition.value;
      console.log("延迟后确认固定位置值:", fixedPosition.value, "是否标准配置:", isStandardConfig.value);
    }, 300);
  });
});

// 更新中挺位置（百分比）
function updatePosition(value: number | number[] | undefined) {
  if (!store.selectedDevider || value === undefined) return;
  
  // 确保值是数字
  const newPosition = Array.isArray(value) ? value[0] : value;
  
  // 更新本地状态
  position.value = newPosition;
  
  // 更新存储中的中挺位置
  store.updateDeviderPosition(store.selectedDevider.id, position.value);
}

// 当固定位置值改变时，重新计算百分比
function updateFixedPosition(value: number | number[] | undefined) {
  if (!store.selectedDevider || !store.root || value === undefined) return;
  
  // 确保值是数字
  const newPosition = Array.isArray(value) ? value[0] : value;
  
  fixedPosition.value = newPosition;
  
  // 计算对应的百分比位置
  const windowSize = store.selectedDevider.direction === 'vertical' ? 
    store.root.width : store.root.height;
  const frameSize = store.root.frameSize || 0;
  const halfThickness = thickness.value / 2;
  
  // 根据公式反推百分比: 固定位置 / (窗口尺寸 - 外框厚度*2 - 中挺厚度/2) * 100
  const effectiveSize = windowSize - (frameSize * 2) - halfThickness;
  
  // 如果有效尺寸大于0，计算百分比，否则使用默认50%
  if (effectiveSize > 0) {
    const newPercent = (fixedPosition.value / effectiveSize) * 100;
    
    // 限制在10-90%范围内
    const limitedPercent = Math.max(10, Math.min(90, newPercent));
    position.value = parseFloat(limitedPercent.toFixed(1));
  } else {
    position.value = 50;
  }
  
  console.log(`固定位置更新为: ${fixedPosition.value}mm, 对应百分比: ${position.value}%`);
  
  // 更新存储中的中挺位置
  store.updateDeviderPosition(store.selectedDevider.id, position.value);
}

// 更新中挺厚度
function updateThickness(value: number | number[] | undefined) {
  if (!store.selectedDevider || value === undefined) return;
  
  // 确保值是数字
  const newThickness = Array.isArray(value) ? value[0] : value;
  
  // 更新本地状态
  thickness.value = newThickness;
  
  // 更新存储中的中挺厚度
  store.updateDeviderThickness(store.selectedDevider.id, thickness.value);
}
</script>

<template>
  <div class="devider-adjust-panel">
    <div v-if="!store.selectedDevider" class="no-selection">
      <p>请选择一个中挺进行调整</p>
    </div>
    
    <div v-else class="devider-controls">
      <div class="devider-info">
        <h4>中挺信息</h4>
        <div class="info-row">
          <span class="label">ID:</span>
          <span class="value">#{{ deviderInfo?.id }}</span>
        </div>
        <div class="info-row">
          <span class="label">方向:</span>
          <span class="value">{{ deviderInfo?.direction === 'vertical' ? '垂直' : '水平' }}</span>
        </div>
        <div class="info-row">
          <span class="label">尺寸:</span>
          <span class="value">{{ deviderInfo?.width }}×{{ deviderInfo?.height }}</span>
        </div>
        <div class="info-row">
          <span class="label">实际厚度:</span>
          <span class="value">{{ deviderInfo?.actualThickness }}mm</span>
        </div>
      </div>
      
      <div class="control-group">
        <div class="control-label">
          <span>位置调整模式:</span>
          <el-switch
            v-model="positionMode"
            active-value="fixed"
            inactive-value="percent"
            active-text="固定尺寸"
            inactive-text="百分比"
          />
        </div>
        
        <!-- 百分比模式控制 -->
        <div v-if="positionMode === 'percent'" class="position-controls">
          <div class="control-label">
            <span>位置百分比:</span>
            <span class="value">{{ position.toFixed(1) }}%</span>
          </div>
          <div class="control-flex">
            <el-slider 
              v-model="position" 
              :min="10" 
              :max="90" 
              :step="0.5"
              @change="updatePosition"
              class="flex-slider"
            />
            <el-input-number 
              v-model="position" 
              :min="10" 
              :max="90" 
              :step="0.5" 
              :precision="1"
              @change="updatePosition"
              size="small"
              controls-position="right"
              class="input-number"
            />
          </div>
          <div class="control-hint">
            <el-tooltip content="调整中挺在窗格区域中的相对位置" placement="top">
              <span class="hint-text">输入准确的位置百分比值 (10%-90%)</span>
            </el-tooltip>
          </div>
        </div>
        
        <!-- 固定尺寸模式控制 -->
        <div v-else class="position-controls">
          <div class="control-label">
            <span>固定位置:</span>
            <span class="value">{{ displayFixedPosition }}mm</span>
          </div>
          
          <div class="fixed-position-message">
            <i class="el-icon-info"></i>
            <template v-if="isStandardConfig">
              <strong>标准配置：</strong>1500×1500窗口，中挺位置固定在690mm
            </template>
            <template v-else>
              动态计算的中挺固定位置：{{ calculationFormula }}
            </template>
          </div>
          
          <div class="control-flex" style="margin-top: 10px;">
            <el-slider 
              v-model="fixedPosition" 
              :min="0" 
              :max="fixedPositionRange.max" 
              :step="1"
              @change="updateFixedPosition"
              class="flex-slider"
              :disabled="isStandardConfig"
            />
            <el-input-number 
              v-model="fixedPosition" 
              :min="0" 
              :max="fixedPositionRange.max" 
              :step="1"
              @change="updateFixedPosition"
              size="small"
              controls-position="right"
              class="input-number"
              :disabled="isStandardConfig"
            />
          </div>
          
          <div class="control-hint">
            <el-tooltip :content="`从窗格区域${deviderInfo?.direction === 'vertical' ? '左' : '上'}边开始测量的位置，计算公式：(窗口尺寸-外框厚度*2-中挺厚度/2)*百分比，标准窗口1500×1500时为690mm`" placement="top">
              <span class="hint-text">输入准确的固定尺寸值 (0-{{ Math.round(fixedPositionRange.max) }}mm)</span>
            </el-tooltip>
          </div>
        </div>
      </div>
      
      <div class="control-group">
        <div class="control-label">
          <span>厚度:</span>
          <span class="value">{{ thickness }}mm</span>
        </div>
        <div class="control-flex">
          <el-slider 
            v-model="thickness" 
            :min="30" 
            :max="100" 
            :step="1"
            @change="updateThickness"
            class="flex-slider"
          />
          <el-input-number 
            v-model="thickness" 
            :min="30" 
            :max="100" 
            :step="1"
            @change="updateThickness"
            size="small"
            controls-position="right"
            class="input-number"
          />
        </div>
        <div class="control-hint">
          <el-tooltip content="调整中挺的厚度" placement="top">
            <span class="hint-text">输入准确的厚度值 (30mm-100mm)</span>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.devider-adjust-panel {
  padding: 10px 0;
}

.no-selection {
  text-align: center;
  color: #999;
  padding: 20px 0;
}

.devider-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.devider-info {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 10px;
}

.devider-info h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 13px;
}

.info-row .label {
  color: #909399;
}

.info-row .value {
  font-weight: 500;
  color: #303133;
}

.control-group {
  margin-bottom: 16px;
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 12px;
}

.position-controls {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #eee;
}

.control-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 14px;
  color: #606266;
}

.control-label .value {
  font-weight: 500;
  color: #409EFF;
}

.control-flex {
  display: flex;
  align-items: center;
  gap: 10px;
}

.flex-slider {
  flex: 1;
}

.input-number {
  width: 110px;
}

.control-hint {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}

.hint-text {
  cursor: help;
  border-bottom: 1px dashed #ccc;
}

.fixed-position-message {
  background-color: #ecf8ff;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
  color: #409EFF;
  font-size: 13px;
  line-height: 1.5;
}
</style> 