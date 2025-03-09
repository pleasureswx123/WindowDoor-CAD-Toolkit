<script setup lang="ts">
// 窗扇类型控制组件
import { ref, computed, watch } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import { Edit } from '@element-plus/icons-vue';

const store = useWindowDoorStore();

// 窗扇类型选项
const typeOptions = [
  { value: 'none', label: '固定窗', icon: 'none', description: '无法开启，无框架' },
  { value: 'left', label: '左开窗', icon: 'left', description: '向左侧开启' },
  { value: 'right', label: '右开窗', icon: 'right', description: '向右侧开启' },
  { value: 'tilt,left', label: '倾斜左开窗', icon: 'tilt-left', description: '可倾斜和向左开启' },
  { value: 'tilt,right', label: '倾斜右开窗', icon: 'tilt-right', description: '可倾斜和向右开启' }
];

// 当前选中的窗扇
const selectedSection = computed(() => store.selectedSection);

// 是否正显示引导界面(选择类型)
const showTypeSelection = ref(false);

// 当用户选择一个空区域时，自动显示类型选择界面
watch(() => selectedSection.value, (newSection) => {
  if (newSection && newSection.type === 'empty') {
    showTypeSelection.value = true;
  } else {
    showTypeSelection.value = false;
  }
});

// 当前窗扇类型
const currentType = computed({
  get: () => {
    if (!selectedSection.value) return '';
    return selectedSection.value.type || '';
  },
  set: (value) => {
    if (!selectedSection.value || typeof value !== 'string') return;
    store.setSectionType(value);
    // 选择类型后自动关闭选择界面
    showTypeSelection.value = false;
  }
});

// 显示类型友好名称
const typeLabel = computed(() => {
  const option = typeOptions.find(opt => opt.value === currentType.value);
  return option ? option.label : '未配置';
});

// 是否显示控制面板
const showControls = computed(() => !!selectedSection.value);

// 是否为空区域
const isEmptySection = computed(() => selectedSection.value?.type === 'empty');

// 显示类型选择界面
const showTypeSelectionPanel = () => {
  showTypeSelection.value = true;
};

// 取消类型选择
const cancelTypeSelection = () => {
  showTypeSelection.value = false;
};

// 分割区域函数
const splitSectionVertical = () => {
  store.splitCurrentSection('vertical');
  // 分割后关闭类型选择面板
  showTypeSelection.value = false;
};

const splitSectionHorizontal = () => {
  store.splitCurrentSection('horizontal');
  // 分割后关闭类型选择面板
  showTypeSelection.value = false;
};
</script>

<template>
  <div class="section-type-control" v-if="showControls">
    <!-- 空区域状态提示 -->
    <div v-if="isEmptySection" class="empty-section-notice">
      <el-alert
        type="warning"
        :closable="false"
        show-icon
      >
        <template #title>
          <span class="alert-title">此区域需要配置或分割</span>
        </template>
        <template #default>
          <div class="alert-content">
            您可以为此区域选择窗扇类型或直接进行分割。空区域可以保持未配置状态，直到需要时再配置。
          </div>
        </template>
      </el-alert>
      
      <!-- 添加分割操作选项 -->
      <div class="action-buttons">
        <el-button type="primary" @click="showTypeSelectionPanel" class="select-type-btn">
          <el-icon><Edit /></el-icon>
          配置窗扇类型
        </el-button>
        
        <div class="split-buttons">
          <el-button type="success" size="small" @click="splitSectionVertical">
            垂直分割
          </el-button>
          <el-button type="success" size="small" @click="splitSectionHorizontal">
            水平分割
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 已配置窗扇显示当前类型 -->
    <div v-else class="current-type-display">
      <h3>当前窗扇类型</h3>
      <div class="type-info">
        <div class="type-label">{{ typeLabel }}</div>
        <el-button type="primary" link @click="showTypeSelectionPanel">
          修改类型
        </el-button>
      </div>
    </div>
    
    <!-- 类型选择面板 -->
    <transition name="slide-fade">
      <div v-if="showTypeSelection" class="type-selection-panel">
        <div class="panel-header">
          <h3>选择窗扇类型</h3>
          <el-button type="text" @click="cancelTypeSelection">关闭</el-button>
        </div>
        
        <el-divider />
        
        <div class="type-options">
          <el-radio-group v-model="currentType" class="type-radio-group">
            <div 
              v-for="option in typeOptions" 
              :key="option.value" 
              class="type-option-item"
            >
              <el-radio :value="option.value" border>
                <div class="option-content">
                  <span class="option-label">{{ option.label }}</span>
                  <span class="option-description">{{ option.description }}</span>
                </div>
              </el-radio>
            </div>
          </el-radio-group>
          
          <!-- 添加保持空区域选项 -->
          <div class="keep-empty-option">
            <el-button type="info" plain @click="cancelTypeSelection">
              保持空区域状态 (稍后再配置)
            </el-button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.section-type-control {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  padding: 15px;
  z-index: 1000;
  min-width: 300px;
  max-width: 400px;
}

h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  color: #303133;
}

.empty-section-notice {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.alert-title {
  font-weight: bold;
}

.alert-content {
  margin-top: 5px;
  color: #8c6e3d;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.select-type-btn {
  margin-top: 5px;
}

.split-buttons {
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.current-type-display {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.type-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.type-label {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
}

.type-selection-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  padding: 15px;
  z-index: 1010;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-options {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.type-radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.type-option-item {
  width: 100%;
}

.option-content {
  display: flex;
  flex-direction: column;
  padding: 5px 0;
}

.option-label {
  font-weight: bold;
  margin-bottom: 3px;
}

.option-description {
  font-size: 12px;
  color: #909399;
}

.keep-empty-option {
  margin-top: 10px;
  text-align: center;
}

/* 过渡动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style> 