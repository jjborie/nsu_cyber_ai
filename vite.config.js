import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const pathFromRoot = path => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  root: pathFromRoot('./src/ClientApp/'),
  build: {
    // This directory contains generated frontend output only.
    outDir: pathFromRoot('./src/StudentLab/wwwroot/'),
    emptyOutDir: true,
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: { '/api': 'http://localhost:5080' },
  },
});
