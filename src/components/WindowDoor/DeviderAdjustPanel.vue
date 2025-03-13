<script setup lang="ts">
import { QuestionFilled } from '@element-plus/icons-vue';
// 中挺调整面板组件
import { ref, computed, watch } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const store = useWindowDoorStore();

// 中挺位置和厚度
const position = ref(50);
const thickness = ref(40);

// 监听选中中挺变化
watch(() => store.selectedDevider, (devider) => {
  if (devider) {
    position.value = devider.position || 50;
    thickness.value = devider.direction === 'vertical' ? devider.width : devider.height;
  }
}, { immediate: true, deep: true });

// 中挺方向和尺寸信息
const deviderInfo = computed(() => {
  if (!store.selectedDevider) return null;
  
  const devider = store.selectedDevider;
  const direction = devider.direction;
  
  return {
    id: devider.id,
    direction,
    directionText: direction === 'vertical' ? '垂直中挺' : '水平中挺',
    width: devider.width,
    height: devider.height,
    actualThickness: devider.actualThickness,
    position: devider.position
  };
});

// 更新位置
function updatePosition(value: number) {
  if (!store.selectedDevider) return;
  position.value = value;
  store.updateDeviderPosition(store.selectedDevider.id, value);
}

// 更新厚度
function updateThickness(value: number) {
  if (!store.selectedDevider) return;
  thickness.value = value;
  store.updateDeviderThickness(store.selectedDevider.id, value);
}
</script>

<template>
  <div class="devider-adjust-panel">
    <div v-if="store.selectedDevider" class="panel-content">
      <div class="panel-info">
        <div class="info-item">
          <span class="info-label">中挺 ID:</span>
          <span class="info-value">#{{ deviderInfo?.id }}</span>
        </div>
        
        <div class="info-item">
          <span class="info-label">方向:</span>
          <span class="info-value">{{ deviderInfo?.directionText }}</span>
        </div>
        
        <div class="info-item">
          <span class="info-label">尺寸:</span>
          <span class="info-value">{{ deviderInfo?.width }} × {{ deviderInfo?.height }} px</span>
        </div>
      </div>
      
      <div class="slider-group">
        <div class="slider-label">
          <span>位置 ({{ position }}%)</span>
          <el-tooltip content="拖动滑块调整中挺位置" placement="top">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
        <el-slider
          v-model="position"
          :min="10"
          :max="90"
          :step="1"
          show-stops
          show-input
          @change="updatePosition"
        />
      </div>
      
      <div class="slider-group">
        <div class="slider-label">
          <span>厚度 ({{ thickness }}px)</span>
          <el-tooltip content="拖动滑块调整中挺厚度" placement="top">
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
        <el-slider
          v-model="thickness"
          :min="30"
          :max="100"
          :step="5"
          show-stops
          show-input
          @change="updateThickness"
        />
      </div>
      
      <div class="tip">
        <el-alert
          type="info"
          :closable="false"
          show-icon
        >
          <template #title>调整说明</template>
          <div class="tip-content">
            <p>1. 位置百分比表示中挺在父容器中的相对位置</p>
            <p>2. 厚度表示中挺的实际宽度或高度</p>
            <p>3. 调整中挺将自动更新相邻区域的尺寸</p>
          </div>
        </el-alert>
      </div>
    </div>
    
    <div v-else class="no-selection">
      <el-empty description="未选中中挺" />
      <p class="hint-text">点击一个中挺以进行调整</p>
    </div>
  </div>
</template>

<style scoped>
.devider-adjust-panel {
  padding: 16px;
}

.panel-info {
  margin-bottom: 24px;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #606266;
  font-weight: 500;
}

.info-value {
  color: #303133;
}

.slider-group {
  margin-bottom: 24px;
}

.slider-label {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
}

.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 250px;
}

.hint-text {
  color: #909399;
  font-size: 13px;
  margin-top: 8px;
}

.tip {
  margin-top: 24px;
}

.tip-content {
  font-size: 12px;
  color: #606266;
}

.tip-content p {
  margin: 4px 0;
}
</style> 