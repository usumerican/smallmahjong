/* globals process */

import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        en: 'en/index.html',
        ja: 'ja/index.html',
      },
    },
  },
});
