import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5173, // Or any free port (e.g., 3001, 5174)
  },
  plugins: [react()],
})
