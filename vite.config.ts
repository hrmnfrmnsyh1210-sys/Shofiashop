import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';

// Mounts the Express API as a Vite dev-server middleware so `npm run dev`
// runs frontend AND backend on a single port. In production (Vercel) the same
// Express app is wrapped by `api/[[...slug]].ts` as a serverless function.
const backendPlugin = (): Plugin => {
  let app: ((req: unknown, res: unknown, next?: (err?: unknown) => void) => void) | null = null;

  return {
    name: 'sofia-backend',
    apply: 'serve',
    async configureServer(server: ViteDevServer) {
      const loadApp = async () => {
        // Cache-busting query forces a fresh evaluation on every reload so
        // backend code edits take effect without restarting Vite.
        const mod = await server.ssrLoadModule(
          `/server/src/app.ts?t=${Date.now()}`,
        );
        return mod.buildApp();
      };

      try {
        app = await loadApp();
        console.log('[backend] mounted on /api');
      } catch (err) {
        console.error('[backend] initial load failed:', err);
      }

      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api')) return next();
        if (!app) {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: { message: 'Backend not loaded' } }));
          return;
        }
        app(req, res, next);
      });

      // Reload backend on file changes under server/src/
      const serverDir = path
        .resolve(server.config.root, 'server/src')
        .replace(/\\/g, '/');
      server.watcher.on('change', async (file) => {
        const normalized = file.replace(/\\/g, '/');
        if (!normalized.startsWith(serverDir)) return;
        try {
          app = await loadApp();
          console.log(
            '[backend] reloaded:',
            path.relative(server.config.root, file),
          );
        } catch (err) {
          console.error('[backend] reload failed:', err);
        }
      });
    },
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), backendPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    ssr: {
      // The Prisma client and other Node-native packages must not be bundled
      // by Vite's SSR transformer — they need Node's real `require` resolution.
      noExternal: [],
      external: ['@prisma/client', '.prisma/client'],
    },
  };
});
