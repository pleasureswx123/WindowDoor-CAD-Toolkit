<script setup lang="ts">
// 窗扇类型控制组件
import { ref, computed } from 'vue';
import { useWindowDoorStore } from '@/stores/windowDoorStore';

const store = useWindowDoorStore();

// 窗扇类型选项
const typeOptions = [
  { value: 'none', label: '固定窗' },
  { value: 'left', label: '左开窗' },
  { value: 'right', label: '右开窗' },
  { value: 'tilt', label: '倾斜窗' },
  { value: 'tilt-left', label: '倾斜左开窗' },
  { value: 'tilt-right', label: '倾斜右开窗' }
];

// 当前选中的窗扇
const selectedSection = computed(() => store.selectedSection);

// 当前窗扇类型
const currentType = computed(() => {
  if (!selectedSection.value) return 'none';
  return selectedSection.value.type || 'none';
});

// 更改窗扇类型
const changeType = (type: string | number | boolean | undefined) => {
  if (!selectedSection.value || typeof type !== 'string') return;
  store.setSectionType(type);
};

// 是否显示控制面板
const showControls = computed(() => !!selectedSection.value);

// 判断是否为当前类型
const isCurrentType = (type: string) => currentType.value === type;
</script>

<template>
  <div class="section-type-control" v-if="showControls">
    <h3>窗扇类型</h3>
    <div class="type-buttons">
      <el-radio-group v-model="currentType" @change="changeType">
        <el-radio v-for="option in typeOptions" :key="option.value" :label="option.value">
          {{ option.label }}
        </el-radio>
      </el-radio-group>
    </div>
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
  padding: 10px;
  z-index: 1000;
}

h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  color: #303133;
}

.type-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style> 