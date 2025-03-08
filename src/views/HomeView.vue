<script setup lang="ts">
// 不再需要手动导入组件，由unplugin-vue-components自动处理
// import TheWelcome from '../components/TheWelcome.vue'

// 不再需要手动导入API，由unplugin-auto-import自动处理
// import { ref, computed } from 'vue'

// 使用自动导入的Vue API
const count = ref(0)
const message = computed(() => `当前计数: ${count.value}`)

function increment() {
  count.value++
}
</script>

<template>
  <main>
    <el-container>
      <el-header>
        <h1>自动导入测试页面</h1>
      </el-header>
      
      <el-main>
        <!-- 计数器示例 -->
        <el-divider content-position="left">基础组件自动导入</el-divider>
        <div class="counter-section">
          <p>{{ message }}</p>
          <TestButton text="增加计数" @click="increment" />
        </div>
        
        <!-- 图标自动导入演示 -->
        <el-divider content-position="left">Iconify图标自动导入</el-divider>
        <IconDemo />
        
        <!-- Element Plus演示 -->
        <el-divider content-position="left">Element Plus自动导入</el-divider>
        <ElementDemo />
        
        <!-- TheWelcome组件 -->
        <el-divider content-position="left">欢迎组件</el-divider>
        <TheWelcome />
      </el-main>
      
      <el-footer>
        <p>自动导入配置演示 &copy; 2025</p>
      </el-footer>
    </el-container>
  </main>
</template>

<style scoped>
.counter-section {
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  max-width: 400px;
}

.el-header, .el-footer {
  background-color: #B3C0D1;
  color: #333;
  text-align: center;
  line-height: 60px;
}

.el-main {
  padding: 20px;
}
</style>
