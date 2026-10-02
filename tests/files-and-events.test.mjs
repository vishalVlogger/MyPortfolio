import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FILE_ID_PATTERN,
  fileIdFor,
  isStoredFileType,
  matchesFileType,
} from '../lib/files.ts';
import { isLikelyBot, isTrackedEvent } from '../lib/events.ts';
import { portfolioSync } from '../plugins/portfolio-sync.ts';
import { VERSION_HEADER } from '../lib/portfolio-validation.ts';

const pad = (bytes) => new Uint8Array([...bytes, ...Array.from({ length: 16 }, () => 0)]);

void test('uploads are accepted only when the bytes match the declared type', () => {
  const jpeg = pad([0xff, 0xd8, 0xff, 0xe0]);
  const pdf = pad([0x25, 0x50, 0x44, 0x46]);
  const webp = pad([
    0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
  ]);
  const wav = pad([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]);
  assert.equal(matchesFileType(jpeg, 'image/jpeg'), true);
  assert.equal(matchesFileType(pdf, 'application/pdf'), true);
  assert.equal(matchesFileType(webp, 'image/webp'), true);
  assert.equal(matchesFileType(wav, 'image/webp'), false);
  assert.equal(matchesFileType(pdf, 'image/jpeg'), false);
  assert.equal(isStoredFileType('image/svg+xml'), false);
  assert.equal(isStoredFileType('text/html'), false);
});

void test('file ids are stable content hashes', async () => {
  const bytes = pad([0x25, 0x50, 0x44, 0x46]);
  const id = await fileIdFor(bytes, 'application/pdf');
  assert.match(id, FILE_ID_PATTERN);
  assert.equal(await fileIdFor(bytes, 'application/pdf'), id);
  assert.equal(FILE_ID_PATTERN.test('../secret.pdf'), false);
});

void test('only known events from real browsers are counted', () => {
  assert.equal(isTrackedEvent('download_resume'), true);
  assert.equal(isTrackedEvent('constructor'), false);
  assert.equal(isTrackedEvent('anything_else'), false);
  assert.equal(isLikelyBot('Mozilla/5.0 (compatible; Googlebot/2.1)'), true);
  assert.equal(isLikelyBot(null), true);
  assert.equal(
    isLikelyBot('Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36'),
    false,
  );
});

const key = 'a'.repeat(64); // Test fixture, not a production credential.
const localRequest = (headers, method, url, body = Buffer.alloc(0)) => ({
  headers: { host: 'localhost:3000', ...headers },
  method,
  url,
  socket: { localPort: 3000, remoteAddress: '127.0.0.1' },
  async *[Symbol.asyncIterator]() {
    yield body;
  },
});

void test('local proxy guards uploads, drops dev analytics and forwards versions', async () => {
  let middleware;
  portfolioSync('https://example.com', key).configureServer({
    middlewares: { use: (handler) => (middleware = handler) },
  });
  const invoke = async (req) => {
    const response = {
      statusCode: 200,
      headers: {},
      setHeader(name, value) {
        this.headers[name.toLowerCase()] = value;
      },
      end(value) {
        this.body = value ? JSON.parse(value) : undefined;
      },
    };
    await middleware(req, response, () => assert.fail('must be handled'));
    return response;
  };
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ path: url.pathname, options });
    if (url.pathname === '/api/session')
      return Response.json({ canEdit: true });
    if (url.pathname === '/api/files')
      return Response.json({ url: '/files/x.pdf' });
    return Response.json(
      { ok: true },
      { headers: { [VERSION_HEADER]: '2026-10-02T00:00:00.000Z' } },
    );
  };
  try {
    const events = await invoke(localRequest({}, 'POST', '/api/events'));
    assert.equal(events.statusCode, 204);
    assert.equal(calls.length, 0);

    const csrf = (await invoke(localRequest({}, 'GET', '/api/session'))).body
      .csrfToken;
    const pdf = Buffer.from('%PDF-1.7 test');
    const noCsrf = await invoke(
      localRequest(
        { origin: 'http://localhost:3000', 'content-type': 'application/pdf' },
        'POST',
        '/api/files',
        pdf,
      ),
    );
    assert.equal(noCsrf.statusCode, 403);
    const uploaded = await invoke(
      localRequest(
        {
          origin: 'http://localhost:3000',
          'content-type': 'application/pdf',
          'x-portfolio-csrf': csrf,
        },
        'POST',
        '/api/files',
        pdf,
      ),
    );
    assert.equal(uploaded.statusCode, 200);
    assert.equal(
      calls.at(-1).options.headers['x-portfolio-sync-key'],
      key,
      'the key is added server-side',
    );

    const saved = await invoke(
      localRequest(
        {
          origin: 'http://localhost:3000',
          'content-type': 'application/json',
          'x-portfolio-csrf': csrf,
          [VERSION_HEADER]: 'v1',
        },
        'PUT',
        '/api/content',
        Buffer.from('{}'),
      ),
    );
    assert.equal(calls.at(-1).options.headers[VERSION_HEADER], 'v1');
    assert.equal(saved.headers[VERSION_HEADER], '2026-10-02T00:00:00.000Z');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
