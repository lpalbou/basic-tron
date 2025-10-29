import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // UNIFIED BASE PATH: Always use /basic-tron/ for consistency
    // This works for both:
    //   - Local: http://localhost:3000/basic-tron/
    //   - Production: https://www.lpalbou.info/basic-tron/
    // Override only if explicitly needed via VITE_BASE_PATH environment variable
    const base = env.VITE_BASE_PATH || '/basic-tron/';

    return {
      base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      publicDir: false, // No public folder - all assets handled by build-assets.js
      build: {
        rollupOptions: {
          output: {
            // Generate consistent filenames without hashes
            entryFileNames: 'assets/index.js',
            chunkFileNames: 'assets/[name].js',
            assetFileNames: (assetInfo) => {
              // CSS files go to assets/index.css, other assets keep their names
              if (assetInfo.name && assetInfo.name.endsWith('.css')) {
                return 'assets/index.css';
              }
              return 'assets/[name].[ext]';
            }
          }
        }
      }
    };
});
