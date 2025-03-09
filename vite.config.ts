import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
// import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VueUseComponentsResolver } from 'unplugin-vue-components/resolvers'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    // vueDevTools(),
    // 图标自动导入
    Icons({
      // 禁用自动安装图标集，改为预先安装
      autoInstall: false,
      compiler: 'vue3',
      // 添加Element Plus图标集
      scale: 1.2, // 放大比例
    }),
    AutoImport({
      // 自动导入 Vue 相关函数，如：ref, reactive, toRef 等
      imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
      // 自动导入 Element Plus 相关函数
      resolvers: [
        ElementPlusResolver(),
        // 自动导入图标组件
        IconsResolver({
          prefix: 'Icon',
        }),
      ],
      dts: 'src/auto-imports.d.ts',
      // 使用类型声明文件的全局声明
      vueTemplate: true,
    }),
    Components({
      dts: 'src/components.d.ts',
      // 自动导入组件
      resolvers: [
        // Element Plus组件自动导入
        ElementPlusResolver(),
        // Iconify图标组件自动导入
        IconsResolver({
          // 前缀，用于使用图标的时候，图标名称前缀
          enabledCollections: ['mdi', 'carbon', 'ant-design', 'tabler', 'ep'],
        }),
        VueUseComponentsResolver()
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
