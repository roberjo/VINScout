import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Run the worker locally with `npm run dev --workspace=@vinscout/worker`
      // (wrangler dev, default port 8787) alongside this dev server.
      '/api': 'http://localhost:8787',
    },
  },
})
