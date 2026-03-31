import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('framer-motion') || id.includes('lucide-react')) return 'vendor-ui';
            if (id.includes('firebase') || id.includes('supabase')) return 'vendor-db';
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
});
