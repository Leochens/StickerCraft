import { defineConfig } from 'vite';

const externalPackages = [
  '@stickercraft/core',
  '@stickercraft/core/browser',
  'jszip',
  'lucide-react',
  'react',
  'react-dom',
  'react/jsx-runtime',
];

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: externalPackages,
    },
  },
});
