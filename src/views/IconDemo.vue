<script setup lang="ts">
import { ref } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';
import AppButton from '@/components/common/AppButton.vue';

// Element Plus常用图标
const elementIcons = ref([
  'ep:plus', 'ep:minus', 'ep:close', 'ep:edit', 
  'ep:search', 'ep:delete', 'ep:setting', 
  'ep:arrow-up', 'ep:arrow-down', 'ep:arrow-left', 'ep:arrow-right',
  'ep:zoom-in', 'ep:zoom-out', 'ep:refresh', 'ep:full-screen',
  'ep:download', 'ep:upload'
]);

// Material Design图标
const materialIcons = ref([
  'mdi:home', 'mdi:account', 'mdi:cog', 'mdi:pencil',
  'mdi:delete', 'mdi:magnify', 'mdi:heart', 'mdi:star'
]);

// 图标大小
const iconSize = ref(24);

// 图标颜色
const iconColor = ref('#409EFF');
</script>

<template>
  <div class="icon-demo">
    <h1>图标系统示例</h1>
    
    <div class="controls">
      <div class="control-group">
        <span>图标大小：</span>
        <el-slider v-model="iconSize" :min="16" :max="64" :step="2" />
      </div>
      
      <div class="control-group">
        <span>图标颜色：</span>
        <el-color-picker v-model="iconColor" />
      </div>
    </div>
    
    <h2>按钮中的图标</h2>
    <div class="button-demo">
      <app-button icon="ep:plus" type="primary">添加</app-button>
      <app-button icon="ep:edit" type="success">编辑</app-button>
      <app-button icon="ep:delete" type="danger">删除</app-button>
      <app-button icon="ep:search" type="info">搜索</app-button>
      <app-button icon="ep:setting" type="warning">设置</app-button>
      
      <app-button icon="ep:plus" circle type="primary"></app-button>
      <app-button icon="ep:edit" circle type="success"></app-button>
      <app-button icon="ep:delete" circle type="danger"></app-button>
      <app-button icon="ep:search" circle type="info"></app-button>
      <app-button icon="ep:setting" circle type="warning"></app-button>
    </div>
    
    <h2>Element Plus图标</h2>
    <div class="icon-grid">
      <div v-for="icon in elementIcons" :key="icon" class="icon-item">
        <app-icon :name="icon" :size="iconSize" :color="iconColor" />
        <span class="icon-name">{{ icon }}</span>
      </div>
    </div>
    
    <h2>Material Design图标</h2>
    <div class="icon-grid">
      <div v-for="icon in materialIcons" :key="icon" class="icon-item">
        <app-icon :name="icon" :size="iconSize" :color="iconColor" />
        <span class="icon-name">{{ icon }}</span>
      </div>
    </div>
    
    <h2>旋转图标</h2>
    <div class="icon-grid">
      <div class="icon-item">
        <app-icon name="ep:loading" :size="iconSize" :color="iconColor" :spin="true" />
        <span class="icon-name">ep:loading (旋转)</span>
      </div>
      <div class="icon-item">
        <app-icon name="ep:refresh" :size="iconSize" :color="iconColor" :spin="true" />
        <span class="icon-name">ep:refresh (旋转)</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1, h2 {
  color: #303133;
  margin-top: 30px;
  margin-bottom: 20px;
}

.controls {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 300px;
}

.button-demo {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 30px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.3s;
}

.icon-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-color: #c6e2ff;
}

.icon-name {
  font-size: 12px;
  color: #606266;
  margin-top: 8px;
  text-align: center;
}
</style> 