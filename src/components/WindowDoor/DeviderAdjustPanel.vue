<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const store = useWindowDoorStore();

// 中挺位置和厚度的响应式引用
const position = ref(50);
const thickness = ref(40);

// 监听选中的中挺变化，更新位置和厚度
watch(() => store.selectedDevider, (newDevider) => {
  if (newDevider) {
    position.value = newDevider.position;
    thickness.value = newDevider.thickness;
  }
}, { immediate: true });

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

// 更新中挺位置
function updatePosition(value: number | number[]) {
  if (!store.selectedDevider) return;
  
  // 确保值是数字
  const newPosition = Array.isArray(value) ? value[0] : value;
  
  // 更新本地状态
  position.value = newPosition;
  
  // 更新存储中的中挺位置
  store.updateDeviderPosition(store.selectedDevider.id, newPosition);
}

// 更新中挺厚度
function updateThickness(value: number | number[]) {
  if (!store.selectedDevider) return;
  
  // 确保值是数字
  const newThickness = Array.isArray(value) ? value[0] : value;
  
  // 更新本地状态
  thickness.value = newThickness;
  
  // 更新存储中的中挺厚度
  store.updateDeviderThickness(store.selectedDevider.id, newThickness);
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
          <span>位置:</span>
          <span class="value">{{ position.toFixed(1) }}%</span>
        </div>
        <el-tooltip content="调整中挺在父容器中的相对位置" placement="top">
          <el-slider 
            v-model="position" 
            :min="10" 
            :max="90" 
            :step="0.5"
            @change="updatePosition" 
          />
        </el-tooltip>
      </div>
      
      <div class="control-group">
        <div class="control-label">
          <span>厚度:</span>
          <span class="value">{{ thickness }}mm</span>
        </div>
        <el-tooltip content="调整中挺的厚度" placement="top">
          <el-slider 
            v-model="thickness" 
            :min="30" 
            :max="100" 
            :step="1"
            @change="updateThickness" 
          />
        </el-tooltip>
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
  margin-bottom: 10px;
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
</style> 