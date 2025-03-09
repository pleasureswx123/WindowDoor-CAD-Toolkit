<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useEventListener, useWindowSize } from '@vueuse/core';
import AppButton from '@/components/common/AppButton.vue';

interface Props {
  initialValue: number;
  position: { x: number, y: number };
  size: { width: number, height: number };
  unit?: string;
  min?: number;
  max?: number;
  title?: string;
  step?: number;
}

const props = withDefaults(defineProps<Props>(), {
  unit: 'mm',
  min: 10,
  max: 10000,
  title: '调整尺寸',
  step: 10
});

const emit = defineEmits<{
  (e: 'update', value: number): void;
  (e: 'close'): void;
}>();

// 使用v-model的方式处理输入值
const inputValue = ref(props.initialValue);
const inputElement = ref<HTMLInputElement | null>(null);
const dialogVisible = ref(true); // 控制对话框显示
const errorMessage = ref('');
const currentStep = ref(props.step); // 当前步长，可调整

// 保存初始值，用于显示变化量
const initialValue = props.initialValue;

// 计算尺寸变化量和百分比
const valueChange = computed(() => {
  const change = inputValue.value - initialValue;
  const percentage = initialValue > 0 ? (change / initialValue * 100).toFixed(1) : '0';
  return {
    value: change,
    percentage: percentage,
    isPositive: change >= 0
  };
});

// 获取窗口大小（使用vueuse）
const { width: windowWidth, height: windowHeight } = useWindowSize();

// 自动聚焦输入框
onMounted(() => {
  if (inputElement.value) {
    inputElement.value.focus();
    inputElement.value.select();
  }
});

// 使用vueuse的useEventListener来监听键盘事件
useEventListener(document, 'keydown', handleKeyDown);

// 确认更改
const handleSubmit = () => {
  // 验证输入值在合理范围内
  if (inputValue.value >= props.min && inputValue.value <= props.max) {
    errorMessage.value = '';
    emit('update', inputValue.value);
    emit('close');
  } else {
    if (inputValue.value < props.min) {
      errorMessage.value = `输入值不能小于 ${props.min} ${props.unit}`;
    } else {
      errorMessage.value = `输入值不能大于 ${props.max} ${props.unit}`;
    }
  }
};

// 取消更改
const handleCancel = () => {
  emit('close');
};

// 处理键盘事件
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    handleSubmit();
  } else if (e.key === 'Escape') {
    handleCancel();
  }
  // 方向键调整值
  else if (e.key === 'ArrowUp') {
    increment();
    e.preventDefault();
  }
  else if (e.key === 'ArrowDown') {
    decrement();
    e.preventDefault();
  }
  // 方向键调整步长
  else if (e.key === 'ArrowRight') {
    adjustStep(1);
    e.preventDefault();
  }
  else if (e.key === 'ArrowLeft') {
    adjustStep(-1);
    e.preventDefault();
  }
}

// 格式化输入
const formatInput = (val: string): number => {
  const parsed = parseInt(val, 10);
  if (isNaN(parsed)) return 0;
  // 这里我们不在格式化时限制范围，而是在提交时验证
  return parsed;
};

// 验证输入值
const isValidValue = computed(() => {
  return inputValue.value >= props.min && inputValue.value <= props.max;
});

// 计算步长选项，基于初始值和单位动态生成
const stepOptions = computed(() => {
  // 基础步长选项
  const baseOptions = [1, 2, 5, 10, 20, 50, 100];
  
  // 根据初始值选择合适的默认步长
  // 小值使用小步长，大值使用大步长
  if (props.initialValue < 50) {
    return [1, 2, 5, 10];
  } else if (props.initialValue < 200) {
    return [2, 5, 10, 20];
  } else if (props.initialValue < 1000) {
    return [5, 10, 20, 50];
  } else {
    return [10, 20, 50, 100];
  }
});

// 增加量
const increment = () => {
  inputValue.value += currentStep.value;
  if (inputValue.value > props.max) inputValue.value = props.max;
};

// 减少量
const decrement = () => {
  inputValue.value -= currentStep.value;
  if (inputValue.value < props.min) inputValue.value = props.min;
};

// 调整步长
const adjustStep = (change: number) => {
  // 使用计算出的步长选项
  const stepValues = stepOptions.value;
  
  // 查找当前步长索引
  let index = stepValues.indexOf(currentStep.value);
  
  // 如果没找到，寻找最近的值
  if (index === -1) {
    for (let i = 0; i < stepValues.length; i++) {
      if (currentStep.value < stepValues[i]) {
        index = i - 1;
        break;
      }
    }
    if (index === -1) index = stepValues.length - 1;
  }
  
  // 调整索引
  index = Math.max(0, Math.min(stepValues.length - 1, index + change));
  
  // 设置新步长
  currentStep.value = stepValues[index];
};

// 计算对话框样式
const dialogStyle = computed(() => {
  // 对话框宽度
  const dialogWidth = 260;

  // 计算位置，确保不会超出窗口边界
  let left = Math.max(0, Math.min(props.position.x, windowWidth.value - dialogWidth));
  let top = Math.max(0, props.position.y);

  // 如果弹出框会导致下方空间不足，则在标签上方显示
  if (top + 250 > windowHeight.value) {
    top = Math.max(0, top - 250);
  }

  return {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    margin: 0,
    transform: 'none',
    maxWidth: '90vw'
  };
});
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :append-to-body="true"
    :modal="true"
    :close-on-click-modal="true"
    :show-close="false"
    width="260px"
    :style="dialogStyle"
    @close="handleCancel"
  >
    <template #header>
      <div class="dialog-title">{{ props.title }}</div>
    </template>
    
    <div class="popup-input-content">
      <div class="current-value">
        <span>当前值: {{ initialValue }} {{ props.unit }}</span>
        <span v-if="valueChange.value !== 0" class="change-indicator" :class="{'positive': valueChange.isPositive, 'negative': !valueChange.isPositive}">
          <el-icon :size="14"><component :is="valueChange.isPositive ? 'ep:top' : 'ep:bottom'" /></el-icon>
          {{ valueChange.isPositive ? '+' : '' }}{{ valueChange.value }} {{ props.unit }} ({{ valueChange.isPositive ? '+' : '' }}{{ valueChange.percentage }}%)
        </span>
      </div>
      
      <div class="input-with-buttons">
        <app-button
          size="small" 
          @click="decrement"
          :disabled="inputValue <= props.min"
          circle
          icon="ep:minus"
        />
        
        <el-input-number
          ref="inputElement"
          v-model="inputValue"
          :min="props.min"
          :max="props.max"
          :precision="0"
          :step="props.step"
          size="large"
          :controls="false"
          :formatter="(val: number) => `${val}`"
          :parser="formatInput"
          :class="{ 'is-error': !isValidValue }"
        >
          <template #suffix>
            <span class="unit">{{ props.unit }}</span>
          </template>
        </el-input-number>
        
        <app-button
          size="small" 
          @click="increment"
          :disabled="inputValue >= props.max"
          circle
          icon="ep:plus"
        />
      </div>
      
      <div class="step-adjustment">
        <span class="step-label">步长: {{ currentStep }} {{ props.unit }}</span>
        <div class="step-buttons">
          <el-button-group size="small">
            <app-button
              size="small" 
              :disabled="currentStep <= Math.min(...stepOptions)" 
              @click="adjustStep(-1)"
              icon="ep:zoom-out"
            />
            <app-button
              size="small" 
              :disabled="currentStep >= Math.max(...stepOptions)"
              @click="adjustStep(1)"
              icon="ep:zoom-in"
            />
          </el-button-group>
        </div>
      </div>
      
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      
      <div class="button-container">
        <app-button
          size="small" 
          @click="handleCancel"
        >
          取消
        </app-button>
        <app-button
          type="primary" 
          size="small" 
          @click="handleSubmit"
          :disabled="!isValidValue"
        >
          确定
        </app-button>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.dialog-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.popup-input-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.current-value {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #606266;
}

.change-indicator {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
}

.change-indicator.positive {
  color: #67c23a;
}

.change-indicator.negative {
  color: #f56c6c;
}

.input-with-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.step-adjustment {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #606266;
}

.step-label {
  margin-right: 10px;
}

.adjust-button {
  min-width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.unit {
  margin-left: 5px;
  font-size: 14px;
  color: #666;
}

.error-message {
  color: #f56c6c;
  font-size: 12px;
  margin: 0;
}

.button-container {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 10px;
}

:deep(.el-input-number) {
  flex: 1;
  margin: 0 8px;
}

:deep(.el-input-number.is-error .el-input__wrapper) {
  border-color: #f56c6c;
  box-shadow: 0 0 0 1px #f56c6c inset;
}

/* 优化dialog位置和样式 */
:deep(.el-dialog) {
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style> 