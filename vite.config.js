import { defineConfig } from 'vite'
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import react from '@vitejs/plugin-react'

function resolveVersion() {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
    )
    const semver = pkg.version || '0.0.0'
    const sha = execSync('git rev-parse --short HEAD').toString().trim()
    return {
      semver,
      build: sha,
      label: `v${semver}`,
      full: `v${semver}+${sha}`,
    }
  } catch {
    return { semver: '0.0.0', build: 'dev', label: 'v0.0.0', full: 'v0.0.0+dev' }
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
