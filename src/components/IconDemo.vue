<template>
  <div class="icon-demo">
    <h2>Iconify图标自动导入演示</h2>
    
    <div class="icon-section">
      <div class="icon-item">
        <icon-mdi-home class="icon" />
        <p>Home图标 (MDI)</p>
      </div>
      
      <div class="icon-item">
        <icon-carbon-user class="icon" />
        <p>User图标 (Carbon)</p>
      </div>
      
      <div class="icon-item">
        <icon-tabler-settings class="icon" />
        <p>Settings图标 (Tabler)</p>
      </div>
      
      <div class="icon-item">
        <icon-ant-design-github-filled class="icon" />
        <p>Github图标 (Ant Design)</p>
      </div>
    </div>
    
    <div class="icon-usage">
      <h3>使用方法</h3>
      <pre>
        &lt;icon-[collection]-[name] /&gt;
        例如: &lt;icon-mdi-home /&gt;
      </pre>
    </div>
  </div>
</template>

<style scoped>
.icon-demo {
  padding: 2rem;
  border-radius: 8px;
  background-color: #f9f9f9;
  margin-top: 2rem;
}

.icon-section {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  margin: 2rem 0;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
  min-width: 120px;
}

.icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.icon-usage {
  background-color: #f1f1f1;
  padding: 1rem;
  border-radius: 4px;
}

pre {
  white-space: pre-wrap;
  background-color: #e9e9e9;
  padding: 0.5rem;
  border-radius: 4px;
}
</style> 