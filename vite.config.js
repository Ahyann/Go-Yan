import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Penanda versi yang tampil di tab Akun, buat mastiin HP lagi jalanin build
// yang mana (di Vercel pakai env commit, lokal pakai git).
function idBuild() {
  let sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)
  if (!sha) {
    try {
      sha = execSync('git rev-parse --short HEAD').toString().trim()
    } catch {
      sha = 'lokal'
    }
  }
  return `${sha} · ${new Date().toISOString().slice(5, 16).replace('T', ' ')} UTC`
}

export default defineConfig({
  plugins: [react()],
  define: { __ID_BUILD__: JSON.stringify(idBuild()) },
})
