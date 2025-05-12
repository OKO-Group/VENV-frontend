import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import vuetify from "vite-plugin-vuetify";
import { templateCompilerOptions } from '@tresjs/core'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [
    vue({ ...templateCompilerOptions}),
    vueDevTools(),
    vuetify({ autoImport: true }), // Enabled by default
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'three': path.resolve(__dirname, 'node_modules/three') // force single copy
    },
  },
  server : {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['app.oko.com',]
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['app.oko.com']
  },
  optimizeDeps: {
    include: ["validator"]
  }
});

