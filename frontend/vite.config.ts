import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// In dev the Vite server mimics the nginx routing used in Docker, so the
// frontend always talks to same-origin `/api/<service>/...` paths (no CORS).
const calculatorTarget = process.env.CALCULATOR_URL ?? 'http://localhost:8081'
const historyTarget = process.env.HISTORY_URL ?? 'http://localhost:8082'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/calc': {
        target: calculatorTarget,
        rewrite: (path) => path.replace(/^\/api\/calc/, '/api'),
      },
      '/api/history': {
        target: historyTarget,
        rewrite: (path) => path.replace(/^\/api\/history/, '/api'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}', 'src/vite-env.d.ts'],
      reporter: ['text', 'html', 'lcov'],
    },
  },
})
