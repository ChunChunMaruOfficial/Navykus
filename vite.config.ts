import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const moveEntryScriptAfterRoot = () => ({
  name: 'move-entry-script-after-root',
  enforce: 'post' as const,
  transformIndexHtml(html: string) {
    const entryScriptPattern = /\n\s*<script type="module" crossorigin src="\/assets\/index-[^"]+\.js"><\/script>/;
    const entryScript = html.match(entryScriptPattern)?.[0];
    if (!entryScript || !html.includes('</body>')) return html;
    return html.replace(entryScriptPattern, '').replace('</body>', `${entryScript}\n  </body>`);
  },
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), moveEntryScriptAfterRoot()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-i18next', 'i18next'],
            ui: ['lucide-react', 'motion'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    server: {
      port: 3000,
      strictPort: true,
      host: '0.0.0.0',
      proxy: {
        '/admin': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/_next': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/graphql': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/graphql-playground': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/payload-api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/payload-graphql': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/payload-graphql-playground': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
