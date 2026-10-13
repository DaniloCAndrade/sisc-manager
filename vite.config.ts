import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true, // ou '0.0.0.0'
    port: 5173,
    strictPort: true, // Se a porta estiver ocupada, não tenta outra
    open: true // Abre o navegador automaticamente
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
