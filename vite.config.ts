import { defineConfig } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tanstackStart(),
    react({
      jsxImportSource: 'react',
    }),
    tailwindcss(),
  ],
  build: {
    minify: 'esbuild',
    target: 'ES2020',
    chunkSizeWarningLimit: 800,
    cssMinify: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-router',
      'zod',
      'lucide-react',
    ],
    // Mark heavy libraries to load on-demand
    exclude: ['jspdf', 'xlsx', '@supabase/supabase-js'],
  },
})
