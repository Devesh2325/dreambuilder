import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // An explicit IPv4 address makes both localhost and 127.0.0.1 work on Windows, where
  // the default listens on IPv6 only. strictPort reports a busy port instead of
  // silently moving to another one.
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // @ts-ignore
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Browser tests in e2e/ run with Playwright instead.
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
