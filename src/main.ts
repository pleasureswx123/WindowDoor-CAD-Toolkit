import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { Icon } from '@iconify/vue';
import VueKonva from 'vue-konva'

// 引入Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 使用类型断言解决类型问题
// @ts-ignore 忽略zh-cn.mjs的类型声明
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const app = createApp(App)

// 创建和使用Pinia存储
const pinia = createPinia()
app.use(pinia)

// 配置Element Plus，使用中文
// @ts-ignore 忽略类型检查
app.use(ElementPlus, {
  locale: zhCn,
})

// 全局注册 Icon 组件
app.component('Icon', Icon);

// 引入VueKonva
app.use(VueKonva)

// 应用路由
app.use(router)

app.mount('#app')
