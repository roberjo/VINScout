import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { cloudflare } from "@cloudflare/vite-plugin";

// The cloudflare() plugin runs src/worker.ts (see wrangler.jsonc's "main")
// inside Vite's own dev server, so /api/* is proxied by that script itself —
// no separate Vite server.proxy needed. It reaches the backend via the
// BACKEND service binding (wrangler.jsonc), which auto-connects to apps/worker's
// local `wrangler dev` session by name — just run `npm run dev:worker` alongside this.
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
})
