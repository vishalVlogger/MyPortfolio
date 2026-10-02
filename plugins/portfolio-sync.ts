import type { IncomingMessage } from 'node:http';
import type { Plugin } from 'vite';
import { MAX_FILE_BYTES, isStoredFileType } from '../lib/files.ts';
import {
  MAX_PORTFOLIO_BYTES,
  VERSION_HEADER,
} from '../lib/portfolio-validation.ts';

export function isTrustedLocalRequest(request: IncomingMessage): boolean {
  const port = request.socket.localPort;
  const host = request.headers.host;
  const address = request.socket.remoteAddress;
  return (
    ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address ?? '') &&
    [`localhost:${port}`, `127.0.0.1:${port}`, `[::1]:${port}`].includes(
      host ?? '',
    ) &&
    (!request.headers.origin || request.headers.origin === `http://${host}`) &&
    (!request.headers['sec-fetch-site'] ||
      ['same-origin', 'none'].includes(
        String(request.headers['sec-fetch-site']),
      ))
  );
}

/** Development only. The private publishing key stays on the owner's machine. */
export function portfolioSync(
  remoteOrigin: string | undefined,
  syncKey?: string,
): Plugin {
  const origin = remoteOrigin ? new URL(remoteOrigin) : null;
  if (
    origin &&
    (origin.protocol !== 'https:' ||
      origin.username ||
      origin.password ||
      origin.pathname !== '/' ||
      origin.search ||
      origin.hash)
  ) {
    throw new Error(
      'PORTFOLIO_REMOTE_ORIGIN must be an HTTPS origin without credentials or a path.',
    );
  }
  const configured = Boolean(syncKey && /^[a-f0-9]{64}$/.test(syncKey));
  const csrf = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  return {
    name: 'portfolio-shared-content',
    apply: 'serve',
    enforce: 'pre',
    configureServer(server) {
      if (!origin) return;
      const remoteOrigin = origin;
      server.middlewares.use(async (request, response, next) => {
        const path = request.url?.split('?')[0] ?? '';
        const handled = [
          '/api/content',
          '/api/session',
          '/api/files',
          '/api/events',
          '/api/stats',
        ];
        if (!handled.includes(path) && !path.startsWith('/files/'))
          return next();
        const reply = (
          status: number,
          body: unknown,
          extraHeaders: Record<string, string> = {},
        ) => {
          response.statusCode = status;
          response.setHeader('Content-Type', 'application/json');
          response.setHeader('Cache-Control', 'no-store');
          response.setHeader('X-Content-Type-Options', 'nosniff');
          for (const [name, value] of Object.entries(extraHeaders))
            response.setHeader(name, value);
          response.end(JSON.stringify(body));
        };
        // Block LAN access, DNS rebinding and requests initiated by other websites.
        if (!isTrustedLocalRequest(request))
          return reply(403, {
            error: 'Use this editor directly on localhost.',
          });
        // Local browsing shouldn't inflate the published site's statistics.
        if (path === '/api/events') {
          response.statusCode = 204;
          return response.end();
        }
        const isOwnerWrite = (method: string) =>
          request.method === method &&
          configured &&
          request.headers.origin === `http://${request.headers.host}` &&
          request.headers['x-portfolio-csrf'] === csrf;
        const readBody = async (limit: number) => {
          const chunks: Buffer[] = [];
          let size = 0;
          for await (const chunk of request) {
            const buffer = Buffer.from(chunk);
            size += buffer.length;
            if (size > limit) return null;
            chunks.push(buffer);
          }
          return Buffer.concat(chunks);
        };
        try {
          // Uploaded files are public; show the published copies locally.
          if (path.startsWith('/files/')) {
            if (request.method !== 'GET')
              return reply(405, { error: 'Method not allowed.' });
            const upstream = await fetch(new URL(path, remoteOrigin), {
              redirect: 'error',
              signal: AbortSignal.timeout(15000),
            });
            response.statusCode = upstream.status;
            for (const name of ['content-type', 'cache-control']) {
              const value = upstream.headers.get(name);
              if (value) response.setHeader(name, value);
            }
            response.setHeader('X-Content-Type-Options', 'nosniff');
            return response.end(Buffer.from(await upstream.arrayBuffer()));
          }
          if (path === '/api/files') {
            if (!isOwnerWrite('POST'))
              return reply(403, {
                error:
                  'Editor session expired or not connected. Refresh the page and try again.',
              });
            const type = request.headers['content-type']?.split(';')[0].trim();
            if (!type || !isStoredFileType(type))
              return reply(415, {
                error: 'Upload a JPEG, PNG, WebP, or PDF file.',
              });
            const file = await readBody(MAX_FILE_BYTES);
            if (!file)
              return reply(413, { error: 'Files must be 1.9 MB or smaller.' });
            const upstream = await fetch(new URL('/api/files', remoteOrigin), {
              method: 'POST',
              body: file,
              headers: {
                'Content-Type': type,
                'x-portfolio-sync-key': syncKey!,
              },
              redirect: 'error',
              signal: AbortSignal.timeout(30000),
            });
            return reply(upstream.status, await upstream.json());
          }
          if (path === '/api/stats') {
            if (request.method !== 'GET' || !configured)
              return reply(403, { error: 'Owner only.' });
            const upstream = await fetch(new URL('/api/stats', remoteOrigin), {
              headers: { 'x-portfolio-sync-key': syncKey! },
              redirect: 'error',
              signal: AbortSignal.timeout(10000),
            });
            return reply(upstream.status, await upstream.json());
          }
        } catch {
          return reply(502, {
            error:
              'Cannot reach the published portfolio. Check your connection.',
          });
        }
        if (
          !['GET', 'PUT'].includes(request.method ?? '') ||
          (path === '/api/session' && request.method !== 'GET')
        ) {
          return reply(405, { error: 'Method not allowed.' });
        }
        try {
          if (path === '/api/session') {
            let canEdit = false;
            if (configured) {
              const check = await fetch(new URL('/api/session', remoteOrigin), {
                headers: { 'x-portfolio-sync-key': syncKey! },
                redirect: 'error',
                signal: AbortSignal.timeout(10000),
              });
              if (
                check.ok &&
                check.headers.get('content-type')?.includes('application/json')
              ) {
                canEdit =
                  ((await check.json()) as { canEdit?: boolean }).canEdit ===
                  true;
              }
            }
            return reply(200, {
              canEdit,
              csrfToken: canEdit ? csrf : undefined,
              contentSource: 'hosted',
              editorNotice: canEdit
                ? 'Local editor connected. Saving updates your public portfolio.'
                : 'Local editing is locked until the private connection is configured and the hosted update is published.',
            });
          }
          let body: string | undefined;
          if (request.method === 'PUT') {
            if (
              !configured ||
              request.headers.origin !== `http://${request.headers.host}` ||
              request.headers['x-portfolio-csrf'] !== csrf
            ) {
              return reply(403, {
                error:
                  'Editor session expired or not connected. Refresh the page and try again.',
              });
            }
            if (
              request.headers['content-type']?.split(';')[0].trim() !==
              'application/json'
            )
              return reply(415, { error: 'JSON content required.' });
            const chunks: Buffer[] = [];
            let size = 0;
            for await (const chunk of request) {
              const buffer = Buffer.from(chunk);
              size += buffer.length;
              if (size > MAX_PORTFOLIO_BYTES)
                return reply(413, {
                  error: 'Portfolio exceeds the 1.75 MB storage limit.',
                });
              chunks.push(buffer);
            }
            body = Buffer.concat(chunks).toString('utf8');
            try {
              JSON.parse(body ?? '');
            } catch {
              return reply(400, { error: 'Invalid JSON.' });
            }
          }
          const version = request.headers[VERSION_HEADER];
          const upstream = await fetch(new URL('/api/content', remoteOrigin), {
            method: request.method,
            body,
            headers: {
              Accept: 'application/json',
              'Cache-Control': 'no-cache',
              ...(body !== undefined
                ? {
                    'Content-Type': 'application/json',
                    'x-portfolio-sync-key': syncKey!,
                    ...(typeof version === 'string'
                      ? { [VERSION_HEADER]: version }
                      : {}),
                  }
                : {}),
            },
            redirect: 'error',
            signal: AbortSignal.timeout(15000),
          });
          if (
            !upstream.headers.get('content-type')?.includes('application/json')
          )
            throw new Error('Unavailable');
          const upstreamVersion = upstream.headers.get(VERSION_HEADER);
          return reply(
            upstream.status,
            await upstream.json(),
            upstreamVersion !== null
              ? { [VERSION_HEADER]: upstreamVersion }
              : {},
          );
        } catch {
          if (path === '/api/session')
            return reply(200, {
              canEdit: false,
              editorNotice:
                'Local editing is unavailable. Check your connection and refresh.',
            });
          return reply(502, {
            error:
              request.method === 'PUT'
                ? 'The save could not be confirmed. Your draft is kept here. Check the connection before retrying.'
                : 'Cannot reach the published portfolio. Check your connection and try again.',
          });
        }
      });
    },
  };
}
