<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';
import { ElMessage } from 'element-plus';

const store = useWindowDoorStore();

// 判断是否有中挺被选中
const isEnabled = computed(() => !!store.selectedDevider);

const splitDirection = computed(() => store.selectedDevider?.splitDirection);
// 中挺方向
const deviderDirection = computed(() => {
  const temp = { 'horizontal': '水平中挺', 'vertical': '垂直中挺' }
  return temp[splitDirection.value as keyof typeof temp] || '';
});
const temp = { 'horizontal': 'height', 'vertical': 'width' }
const thicknessVal = computed({
  get: () => { 
    return store.selectedDevider?.[temp[splitDirection.value as keyof typeof temp]] || 0;
  },
  set: (newVal) => {
    store.selectedDevider[temp[splitDirection.value as keyof typeof temp]] = newVal;
  }
})
const relativeX = computed({
  get: () => store.selectedDevider?.x,
  set: (newVal) => {
    store.selectedDevider.x = newVal;
  }
})
const relativeY = computed({
  get: () => store.selectedDevider?.y,
  set: (newVal) => {
    store.selectedDevider.y = newVal;
  }
})

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
                <el-tooltip content="中挺的厚度" placement="top">
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
                <el-form-item label="X坐标 (px)">
                  <el-input-number 
                    v-model="relativeX" 
                    :step="1"
                    controls-position="right"
                    :formatter="(val: number) => `${val}`"
                    :parser="(val: string) => formatCoordinateInput(val)"
                    size="small"
                    style="width: 100%;"
                  >
                  </el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Y坐标 (px)">
                  <el-input-number 
                    v-model="relativeY" 
                    :step="1"
                    controls-position="right"
                    :formatter="(val: number) => `${val}`"
                    :parser="(val: string) => formatCoordinateInput(val)"
                    size="small"
                    style="width: 100%;"
                  >
                  </el-input-number>
                </el-form-item>
              </el-col>
            </el-row>
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
</style> 