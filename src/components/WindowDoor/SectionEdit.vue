<script setup lang="ts">
// 区域编辑组件 - 对应React版本中的SectionEdit.jsx
import { computed } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import { Edit } from '@element-plus/icons-vue';

const store = useWindowDoorStore();

// 当前选中的区域
const selectedSection = computed(() => store.selectedSection || {});

// 判断是否有区域被选中
const isEnabled = computed(() => !!store.selectedSection);

// 判断是否为空区域
const isEmptySection = computed(() => selectedSection.value.type === 'empty');

// 窗扇类型选项
const typeOptions = [
  { value: 'none', label: '固定窗', description: '无法开启，无框架' },
  { value: 'left', label: '向左开窗', description: '向左侧开启' },
  { value: 'right', label: '向右开窗', description: '向右侧开启' },
  { value: 'tilt,left', label: '倾斜并向左开', description: '可倾斜和向左开启' },
  { value: 'tilt,right', label: '倾斜并向右开', description: '可倾斜和向右开启' }
];

// 处理类型选择变更
const handleTypeSelect = (value: string | number | boolean | undefined) => {
  if (store.selectedSection && typeof value === 'string') {
    store.setSectionType(value);
  }
};

// 处理框架尺寸变更
const handleFrameSizeChange = (value: number | undefined) => {
  if (store.selectedSection && typeof value === 'number') {
    store.updateFrameSize(value, 'section');
  }
};

// 处理垂直分割
const handleVerticalSplit = () => {
  store.splitCurrentSection('vertical');
};

// 处理水平分割
const handleHorizontalSplit = () => {
  store.splitCurrentSection('horizontal');
};
</script>

<template>
  <div :class="{ 'section-edit-disabled': !isEnabled }">
    <!-- 未选择区域时的提示 -->
    <el-empty v-if="!isEnabled" description="请先选择一个窗户区域" :image-size="100" />

    <!-- 空区域状态 -->
    <div v-else-if="isEmptySection" class="section-options">
      <el-alert type="info" :closable="false" class="empty-section-alert" show-icon>
        <template #title>
          <span>空白区域 - 请配置窗扇类型</span>
        </template>
        <template #default>
          <div class="operation-options">
            <div class="operation-option">
              <el-icon>
                <Edit />
              </el-icon>
              <span>选择下方窗扇类型或进行区域分割</span>
            </div>
          </div>
        </template>
      </el-alert>



      <!-- 空区域分割操作 -->
      <el-divider>分割操作</el-divider>

      <div class="split-buttons">
        <el-button type="primary" plain @click="handleVerticalSplit">
          垂直分割
        </el-button>
        <el-button type="success" plain @click="handleHorizontalSplit">
          水平分割
        </el-button>
      </div>

      <!-- 窗扇类型选择 -->
      <el-divider>窗扇类型选择</el-divider>

      <div class="type-options">
        <el-radio-group v-model="selectedSection.type" @change="handleTypeSelect" class="type-radio-group">
          <div v-for="option in typeOptions" :key="option.value" class="type-option-item">
            <el-radio :value="option.value" border>
              <div class="option-content">
                <span class="option-label">{{ option.label }}</span>
                <span class="option-description">{{ option.description }}</span>
              </div>
            </el-radio>
          </div>
        </el-radio-group>
      </div>
    </div>

    <!-- 已配置区域的编辑选项 -->
    <div v-else class="section-options">
      <el-form label-position="top" :model="selectedSection" class="section-form">
        <el-form-item label="窗扇类型">
          <el-select v-model="selectedSection.type" @change="handleTypeSelect" placeholder="选择窗扇类型" style="width: 100%">
            <el-option value="none" label="固定窗" />
            <el-option value="left" label="向左开窗" />
            <el-option value="right" label="向右开窗" />
            <el-option value="tilt,left" label="倾斜并向左开" />
            <el-option value="tilt,right" label="倾斜并向右开" />
          </el-select>
        </el-form-item>

        <el-form-item label="框架尺寸 (mm)">
          <el-input-number v-model="selectedSection.frameSize" :min="1" :max="200" :step="5"
            @change="handleFrameSizeChange" style="width: 100%" />
        </el-form-item>
      </el-form>

      <el-divider>分割操作</el-divider>

      <div class="split-buttons">
        <el-button type="primary" plain @click="handleVerticalSplit">
          垂直分割
        </el-button>
        <el-button type="success" plain @click="handleHorizontalSplit">
          水平分割
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-edit-disabled {
  opacity: 0.6;
  padding: 20px;
  text-align: center;
}

.section-options {
  padding: 10px;
}

.section-form {
  margin-bottom: 20px;
}

.empty-section-alert {
  margin-bottom: 15px;
}

.operation-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.operation-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-text {
  font-weight: bold;
  color: #67c23a;
}

.split-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
}

.el-divider {
  margin: 15px 0;
}

/* 窗扇类型选择样式 */
.type-options {
  margin-top: 15px;
  margin-bottom: 15px;
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
</style> 