import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main-process entry file of the Electron App.
        entry: 'src/main/main.ts',
        onstart(options) {
          options.startup();
        },
      },
      {
        entry: 'src/preload/preload.ts',
        onstart(options) {
          options.reload();
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
    },
  },
});
