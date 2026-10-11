import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served from https://muhammadolim.github.io/Portfolio-V3/
export default defineConfig({
  base: '/Portfolio-V3/',
  plugins: [react()],
})
