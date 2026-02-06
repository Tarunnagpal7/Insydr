import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'InsydrWidget',
      fileName: () => 'widget.js',
      formats: ['iife'], // IIFE is best for direct script tag usage
    },
    rollupOptions: {
      output: {
        assetFileNames: 'widget.css',
      },
    },
    cssCodeSplit: false, 
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  server: {
    port: 5173
  }
});
