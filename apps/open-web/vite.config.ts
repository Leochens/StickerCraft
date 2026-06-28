import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { agnesAssetProxyPlugin } from './vite.agnesAssetProxy';

const agnesApiProxy = {
  target: 'https://apihub.agnes-ai.com',
  changeOrigin: true,
  secure: true,
  rewrite: (path: string) => path.replace(/^\/agnes-api/, ''),
};

export default defineConfig(({ mode }) => {
    const workspaceRoot = path.resolve(__dirname, '../..');
    const env = loadEnv(mode, workspaceRoot, '');
    return {
      root: __dirname,
      publicDir: path.resolve(workspaceRoot, 'public'),
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: ['.dev.frptube.site'],
        proxy: {
          '/agnes-api': agnesApiProxy,
        },
      },
      preview: {
        proxy: {
          '/agnes-api': agnesApiProxy,
        },
      },
      plugins: [react(), tailwindcss(), agnesAssetProxyPlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
        'process.env.AGNES_API_KEY': JSON.stringify(env.AGNES_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@stickercraft/core/browser': path.resolve(workspaceRoot, 'packages/core/src/browser.ts'),
          '@stickercraft/core': path.resolve(workspaceRoot, 'packages/core/src/index.ts'),
          '@stickercraft/ui': path.resolve(workspaceRoot, 'packages/ui/src/index.ts'),
        }
      }
    };
});
