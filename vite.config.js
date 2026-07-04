import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Served from https://yannitan11.github.io/not-blue/ (project Pages), so assets
// must be referenced under /not-blue/. Local `npm run dev` uses base '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/not-blue/' : '/',
  plugins: [react()],
}))
