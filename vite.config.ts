import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served from https://muhammadolim.github.io/ (the main address; v1 and v2 live in /Portfolio-V1/ and /Portfolio-V2/)
export default defineConfig({
  base: '/',
  plugins: [react()],
})
