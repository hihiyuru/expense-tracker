import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/expense-tracker/',
  plugins: [
    tailwindcss(),
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '每日記帳',
        short_name: '記帳',
        description: '個人每日記帳，同步 Google 試算表',
        theme_color: '#ffffff',
        background_color: '#f9fafb',
        display: 'standalone',
        start_url: '/expense-tracker/',
        icons: [
          { src: '/expense-tracker/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/expense-tracker/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
})
