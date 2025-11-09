import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Enable polyfills for specific modules
      include: ['buffer', 'process'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    })
  ],
  resolve: {
    alias: {
      buffer: 'buffer'
    }
  },
  define: {
    'global': 'globalThis',
  },
  server: {
    port: 3000,
    open: true
  }
})

