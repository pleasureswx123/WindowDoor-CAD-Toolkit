<template>
  <div class="element-demo">
    <h2>Element Plus自动导入演示</h2>
    
    <el-card class="demo-card">
      <template #header>
        <div class="card-header">
          <span>基础组件演示</span>
          <el-button type="primary">操作按钮</el-button>
        </div>
      </template>
      
      <div class="component-row">
        <div class="component-item">
          <h4>按钮 (Button)</h4>
          <div class="demo-buttons">
            <el-button>默认按钮</el-button>
            <el-button type="primary">主要按钮</el-button>
            <el-button type="success">成功按钮</el-button>
            <el-button type="warning">警告按钮</el-button>
            <el-button type="danger">危险按钮</el-button>
          </div>
        </div>
        
        <div class="component-item">
          <h4>开关 (Switch)</h4>
          <el-switch v-model="switchValue" />
          <p>开关状态: {{ switchValue ? '开启' : '关闭' }}</p>
        </div>
      </div>
      
      <div class="component-row">
        <div class="component-item">
          <h4>输入框 (Input)</h4>
          <el-input v-model="inputValue" placeholder="请输入内容" />
          <p>输入内容: {{ inputValue }}</p>
        </div>
        
        <div class="component-item">
          <h4>单选框 (Radio)</h4>
          <el-radio-group v-model="radioValue">
            <el-radio :value="1" label="选项1" />
            <el-radio :value="2" label="选项2" />
            <el-radio :value="3" label="选项3" />
          </el-radio-group>
          <p>选中值: {{ radioValue }}</p>
        </div>
      </div>
      
      <div class="component-row">
        <div class="component-item full-width">
          <h4>表格 (Table)</h4>
          <el-table :data="tableData" style="width: 100%">
            <el-table-column prop="date" label="日期" width="180" />
            <el-table-column prop="name" label="姓名" width="180" />
            <el-table-column prop="address" label="地址" />
          </el-table>
        </div>
      </div>
    </el-card>
    
    <div class="usage-description">
      <h3>使用方法</h3>
      <p>无需导入，直接使用Element Plus组件：</p>
      <pre>&lt;el-button type="primary"&gt;主要按钮&lt;/el-button&gt;</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
// 无需导入Element Plus组件，它们会被自动注册

// 定义响应式状态
const switchValue = ref(true)
const inputValue = ref('')
const radioValue = ref(1)

// 表格数据
const tableData = [
  {
    date: '2023-01-01',
    name: '张三',
    address: '北京市朝阳区芍药居'
  },
  {
    date: '2023-01-02',
    name: '李四',
    address: '上海市浦东新区金科路'
  },
  {
    date: '2023-01-03',
    name: '王五',
    address: '广州市天河区天河路'
  }
]
</script>

<style scoped>
.element-demo {
  padding: 1rem;
  margin-top: 2rem;
}

.demo-card {
  margin-bottom: 2rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.component-row {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  margin-bottom: 2rem;
}

.component-item {
  flex: 1;
  min-width: 300px;
}

.full-width {
  width: 100%;
}

.demo-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.usage-description {
  background-color: #f5f7fa;
  padding: 1rem;
  border-radius: 4px;
}

pre {
  background-color: #e6e8eb;
  padding: 0.5rem;
  border-radius: 4px;
  overflow-x: auto;
}
</style> 