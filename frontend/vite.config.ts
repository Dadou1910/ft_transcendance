import { defineConfig } from "vite";

export default defineConfig({
  css: {
    postcss: './postcss.config.js', // Explicitly use PostCSS config
  },
  build: {
    outDir: 'dist',
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
