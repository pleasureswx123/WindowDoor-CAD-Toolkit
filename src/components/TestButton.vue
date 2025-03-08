<template>
  <button class="test-button" @click="handleClick">
    {{ text }}
  </button>
</template>

<script setup lang="ts">
// 这里不需要手动导出组件，因为组件会被自动注册
defineProps<{
  text: string
}>()

const emit = defineEmits<{
  click: [void]
}>()

function handleClick() {
  emit('click')
}
</script>

<style scoped>
.test-button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.test-button:hover {
  background-color: #45a049;
}
</style> 