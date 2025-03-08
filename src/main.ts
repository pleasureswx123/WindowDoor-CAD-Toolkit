import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { Icon } from '@iconify/vue';
import VueKonva from 'vue-konva'

const app = createApp(App)

// 创建和使用Pinia存储
const pinia = createPinia()
app.use(pinia)

// 全局注册 Icon 组件
app.component('Icon', Icon);

// 引入VueKonva
app.use(VueKonva)

// 应用路由
app.use(router)

app.mount('#app')
