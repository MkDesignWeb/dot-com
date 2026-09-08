import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Porta propria: o painel (dot-com-adm-main) usa a 5173.
// strictPort evita o vite cair em outra porta em silencio e o electron abrir o app errado.
const DEV_SERVER_PORT = 5174

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  server: {
    port: DEV_SERVER_PORT,
    strictPort: true,
  },
  build: {
    outDir: "dist-react",
    emptyOutDir: true,
  },
  plugins: [react()],
})
