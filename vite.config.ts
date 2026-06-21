import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { agnesAssetProxyPlugin } from './vite.agnesAssetProxy';

const agnesApiProxy = {
  target: 'https://apihub.agnes-ai.com',
  changeOrigin: true,
  secure: true,
  rewrite: (path: string) => path.replace(/^\/agnes-api/, ''),
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/agnes-api': agnesApiProxy,
        },
      },
      preview: {
        proxy: {
          '/agnes-api': agnesApiProxy,
        },
      },
      plugins: [react(), agnesAssetProxyPlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
        'process.env.AGNES_API_KEY': JSON.stringify(env.AGNES_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
