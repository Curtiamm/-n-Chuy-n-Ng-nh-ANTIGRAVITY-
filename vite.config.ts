import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: [
          '**/*.json',
          '**/live_chats.json',
          '**/registrations.json',
          '**/majors.json',
          '**/faqs.json',
          '**/users.json',
          '**/posts.json',
          '**/documents.json',
          '**/cached_links.json'
        ]
      },
      allowedHosts: true as any,
    },
  };
});
