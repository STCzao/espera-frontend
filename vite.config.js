import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    watch: {
      // Artefactos que escribe Cypress mientras corre contra este servidor.
      // En Windows, el .crdownload de una descarga en curso está bloqueado:
      // el watcher recibe EBUSY, el error no se maneja y el dev server se
      // cae a mitad de la suite (todos los specs siguientes fallan).
      ignored: ['**/cypress/downloads/**', '**/cypress/screenshots/**', '**/cypress/videos/**'],
    },
  },
})
