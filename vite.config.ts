import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "/hanabi-test/",
  build: {
    outDir: "./dist",
  },
  plugins: [react()]
})
