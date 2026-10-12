import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

function injectSwBuildId(): Plugin {
  return {
    name: 'inject-sw-build-id',
    closeBundle() {
      const distSwPath = path.resolve(__dirname, 'dist/sw.js');
      if (fs.existsSync(distSwPath)) {
        const buildId = new Date().toISOString().replace(/[^0-9a-zA-Z]/g, '');
        let content = fs.readFileSync(distSwPath, 'utf-8');
        content = content.replace(/__BUILD_ID__/g, buildId);
        fs.writeFileSync(distSwPath, content, 'utf-8');
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), injectSwBuildId()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
});
