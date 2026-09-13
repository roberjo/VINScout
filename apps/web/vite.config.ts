import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { cloudflare } from "@cloudflare/vite-plugin";

// The cloudflare() plugin runs src/worker.ts (see wrangler.jsonc's "main")
// inside Vite's own dev server, so /api/* is proxied by that script itself —
// no separate Vite server.proxy needed. Point it at your local backend via
// apps/web/.dev.vars's BACKEND_URL (copy .dev.vars.example); without that
// override it defaults to wrangler.jsonc's production URL.
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
})
