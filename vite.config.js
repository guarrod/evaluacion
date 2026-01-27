import { defineConfig } from 'vite'
import { execSync } from 'node:child_process'
import react from '@vitejs/plugin-react'

function resolveVersion() {
  try {
    const count = execSync('git rev-list --count HEAD').toString().trim()
    const sha = execSync('git rev-parse --short HEAD').toString().trim()
    return `push-${count}+${sha}`
  } catch {
    return 'dev-local'
  }
}

const APP_VERSION = resolveVersion()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/evaluacion/',
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
})
