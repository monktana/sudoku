import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { svelteTesting } from '@testing-library/svelte/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: '0.0.0.0'
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
    resolve: {
      conditions: ['browser']
    },
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
      reporter: ['text', 'lcov']
    }
  },
  plugins: [
    svelte(),
    svelteTesting(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Sudoku App',
        short_name: 'Sudoku',
        description: 'A lightweight Sudoku web app built with Vite + Svelte + TypeScript.',
        theme_color: '#154360',
        background_color: '#f3f9ff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
