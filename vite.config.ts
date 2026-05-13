import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/vue') || id.includes('node_modules/pinia')) {
            return 'vue-vendor'
          }
          if (id.includes('node_modules/echarts') || id.includes('node_modules/vue-echarts')) {
            return 'echarts-vendor'
          }
          if (id.includes('node_modules/@tanstack')) {
            return 'table-vendor'
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['echarts', 'vue-echarts'],
  },
})