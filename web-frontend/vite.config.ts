import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  resolve: {
    alias: {
      "@": "/src",
      "cropperjs/dist/cropper.css": require.resolve(
        "react-cropper/node_modules/cropperjs/dist/cropper.css"
      ),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});