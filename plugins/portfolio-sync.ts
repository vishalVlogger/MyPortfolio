import type { Plugin } from 'vite';

/** Development only: read the published database, never silently use a local copy. */
export function portfolioSync(remoteOrigin: string | undefined): Plugin {
  const origin = remoteOrigin ? new URL(remoteOrigin) : null;
  if (origin && (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/')) {
    throw new Error('PORTFOLIO_REMOTE_ORIGIN must be an HTTPS origin without credentials or a path.');
  }
  return {
    name: 'portfolio-shared-content',
    apply: 'serve',
    enforce: 'pre',
    configureServer(server) {
      if (!origin) return;
      server.middlewares.use(async (request, response, next) => {
        const path = request.url?.split('?')[0];
        if (path !== '/api/content' && path !== '/api/session') return next();
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Cache-Control', 'no-store');
        if (path === '/api/session') {
          response.end(JSON.stringify({ canEdit: false, contentSource: 'hosted' }));
          return;
        }
        // A read-through preview must never save into the unrelated local database.
        // Remote editing needs an authenticated bridge, not forged owner headers.
        if (request.method !== 'GET') {
          response.statusCode = 403;
          response.end(JSON.stringify({ error: 'Local publishing is not connected yet. No changes were saved.' }));
          return;
        }
        try {
          const upstream = await fetch(new URL('/api/content', origin), {
            headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
            redirect: 'error',
            signal: AbortSignal.timeout(15000),
          });
          if (!upstream.ok || !upstream.headers.get('content-type')?.includes('application/json')) {
            throw new Error('Published content unavailable');
          }
          const content = await upstream.json() as { hero?: { name?: string }; projects?: unknown[] };
          if (!content?.hero?.name || !Array.isArray(content.projects)) throw new Error('Invalid published content');
          response.end(JSON.stringify(content));
        } catch {
          response.statusCode = 502;
          response.end(JSON.stringify({ error: 'Cannot reach the published portfolio. Check your internet connection and try again.' }));
        }
      });
    },
  };
}
