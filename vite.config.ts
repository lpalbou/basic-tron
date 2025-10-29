import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // CRITICAL: Base path configuration for deployment
    // Use VITE_BASE_PATH environment variable or default based on mode
    // Examples:
    //   npm run build                    -> base: '/' (local/preview)
    //   VITE_BASE_PATH=/basic-tron/ npm run build -> base: '/basic-tron/' (GitHub Pages)
    //   VITE_BASE_PATH=/ npm run build   -> base: '/' (custom domain)
    const base = env.VITE_BASE_PATH || (mode === 'production' ? '/basic-tron/' : '/');
    
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
