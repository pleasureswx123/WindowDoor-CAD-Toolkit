<script setup lang="ts">
import { computed, ref } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const store = useWindowDoorStore();

// 中挺厚度限制
const minDeviderSize = 20; // 最小20mm
const maxDeviderSize = 100; // 最大100mm

// 判断是否有中挺被选中
const isEnabled = computed(() => !!store.selectedDevider);

// 中挺方向
const deviderDirection = computed(() => {
  if (!store.selectedDevider) return '';
  
  return store.selectedDevider.width < store.selectedDevider.height 
    ? '垂直中挺' 
    : '水平中挺';
});

// 中挺厚度
const thickness = computed({
  get: () => store.selectedDevider?.thickness || 40,
  set: (newThickness) => {
    if (store.selectedDevider && isValidThickness(newThickness)) {
      store.updateDeviderProps(store.selectedDevider.id, { thickness: newThickness });
    }
  }
});

// 中挺宽度 (如果是垂直中挺)
const width = computed({
  get: () => store.selectedDevider?.width || 40,
  set: (newWidth) => {
    if (store.selectedDevider && 
        store.selectedDevider.width < store.selectedDevider.height && 
        isValidSize(newWidth)) {
      store.updateDeviderProps(store.selectedDevider.id, { width: newWidth });
    }
  }
});

// 中挺高度 (如果是水平中挺)
const height = computed({
  get: () => store.selectedDevider?.height || 40,
  set: (newHeight) => {
    if (store.selectedDevider && 
        store.selectedDevider.height < store.selectedDevider.width && 
        isValidSize(newHeight)) {
      store.updateDeviderProps(store.selectedDevider.id, { height: newHeight });
    }
  }
});

// 中挺材质选项
const materialOptions = [
  { value: 'aluminum', label: '铝合金' },
  { value: 'steel', label: '钢材' },
  { value: 'vinyl', label: '乙烯基' },
  { value: 'wood', label: '木质' }
];

// 当前选择的材质
const selectedMaterial = ref('aluminum');

// 验证厚度是否在有效范围内
function isValidThickness(size: number): boolean {
  return !isNaN(size) && size >= minDeviderSize && size <= maxDeviderSize;
}

// 验证尺寸是否在有效范围内
function isValidSize(size: number): boolean {
  return !isNaN(size) && size >= 10 && size <= 200;
}

// 厚度值格式化
function formatThicknessInput(value: string): number {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return thickness.value;
  
  // 限制最大最小值
  return Math.min(Math.max(parsed, minDeviderSize), maxDeviderSize);
}

// 尺寸值格式化
function formatSizeInput(value: string): number {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return 40;
  
  // 限制最大最小值
  return Math.min(Math.max(parsed, 10), 200);
}
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
              <icon-lucide-move-horizontal v-if="deviderDirection === '水平中挺'" class="info-icon" />
              <icon-lucide-move-vertical v-else class="info-icon" />
              <span>方向: {{ deviderDirection }}</span>
            </div>
          </div>
        </template>
      </el-alert>

      <div class="settings-form">
        <el-form label-position="top">
          <!-- 垂直中挺宽度设置 -->
          <el-form-item v-if="deviderDirection === '垂直中挺'" label="中挺厚度 (mm)">
            <el-input-number v-model="width" :min="10" :max="200" :step="5" controls-position="right"
              :formatter="(val: number) => `${val}`" :parser="(val: string) => formatSizeInput(val)" size="small"
              style="width: 100%;">
              <template #suffix>
                <el-tooltip content="中挺的水平宽度" placement="top">
                  <icon-tabler-info-circle class="info-icon" />
                </el-tooltip>
              </template>
            </el-input-number>
          </el-form-item>

          <!-- 水平中挺高度设置 -->
          <el-form-item v-if="deviderDirection === '水平中挺'" label="中挺厚度 (mm)">
            <el-input-number v-model="height" :min="10" :max="200" :step="5" controls-position="right"
              :formatter="(val: number) => `${val}`" :parser="(val: string) => formatSizeInput(val)" size="small"
              style="width: 100%;">
              <template #suffix>
                <el-tooltip content="中挺的垂直高度" placement="top">
                  <icon-tabler-info-circle class="info-icon" />
                </el-tooltip>
              </template>
            </el-input-number>
          </el-form-item>

          <!-- 中挺材质选择 -->
          <el-form-item label="材质">
            <el-select v-model="selectedMaterial" placeholder="选择材质" style="width: 100%;">
              <el-option v-for="option in materialOptions" :key="option.value" :value="option.value"
                :label="option.label" />
            </el-select>
          </el-form-item>

          <!-- 中挺颜色选择 -->
          <el-form-item label="颜色">
            <el-color-picker show-alpha style="width: 100%;" />
          </el-form-item>
        </el-form>
      </div>

      <!-- 视觉展示 -->
      <div class="devider-preview">
        <div class="preview-shape"
          :class="{ 'horizontal': deviderDirection === '水平中挺', 'vertical': deviderDirection === '垂直中挺' }" :style="{ 
            width: deviderDirection === '垂直中挺' ? `${width}px` : '100px', 
            height: deviderDirection === '水平中挺' ? `${height}px` : '100px',
            background: selectedMaterial === 'aluminum' ? '#D3D3D3' : 
                        selectedMaterial === 'steel' ? '#A0A0A0' : 
                        selectedMaterial === 'vinyl' ? '#F5F5F5' : '#8B4513'
          }"></div>
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

/* 响应式样式 */
@media (max-width: 576px) {
  .devider-preview {
    height: 100px;
  }
}
</style> 