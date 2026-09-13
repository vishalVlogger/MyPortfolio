import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  portfolioSync,
  isTrustedLocalRequest,
} from '../plugins/portfolio-sync.ts';
import { verifySyncToken } from '../lib/sync-token.ts';
import {
  isPortfolioData,
  readLimitedJson,
  MAX_PORTFOLIO_BYTES,
} from '../lib/portfolio-validation.ts';
import { defaultPortfolio } from '../lib/portfolio.ts';

const key = 'a'.repeat(64); // Test fixture, not a production credential.
const request = (headers = {}, method = 'GET', url = '/api/session') => ({
  headers: { host: 'localhost:3000', ...headers },
  method,
  url,
  socket: { localPort: 3000, remoteAddress: '127.0.0.1' },
  async *[Symbol.asyncIterator]() {
    yield Buffer.from('{"hero":{"name":"Test"},"projects":[]}');
  },
});

void test('sync authentication fails closed and accepts only the configured secret', async () => {
  assert.equal(
    await verifySyncToken(new Request('https://example.com'), key),
    false,
  );
  assert.equal(
    await verifySyncToken(
      new Request('https://example.com', {
        headers: { 'x-portfolio-sync-key': key },
      }),
      undefined,
    ),
    false,
  );
  assert.equal(
    await verifySyncToken(
      new Request('https://example.com', {
        headers: { 'x-portfolio-sync-key': 'b'.repeat(64) },
      }),
      key,
    ),
    false,
  );
  assert.equal(
    await verifySyncToken(
      new Request('https://example.com', {
        headers: { 'x-portfolio-sync-key': key },
      }),
      key,
    ),
    true,
  );
});

void test('portfolio validation rejects unsafe links, unknown fields, and oversized bodies', async () => {
  assert.equal(isPortfolioData(defaultPortfolio), true);
  assert.equal(isPortfolioData({ ...defaultPortfolio, extra: true }), false);
  assert.equal(
    isPortfolioData({
      ...defaultPortfolio,
      hero: { ...defaultPortfolio.hero, github: 'javascript:alert(1)' },
    }),
    false,
  );
  const oversized = new Request('https://example.com', {
    method: 'PUT',
    body: 'x'.repeat(MAX_PORTFOLIO_BYTES + 1),
  });
  await assert.rejects(readLimitedJson(oversized), RangeError);
});

void test('rejects remote hosts, foreign origins, cross-site requests and LAN clients', () => {
  assert.equal(isTrustedLocalRequest(request()), true);
  assert.equal(
    isTrustedLocalRequest(request({ host: 'evil.test:3000' })),
    false,
  );
  assert.equal(
    isTrustedLocalRequest(request({ origin: 'https://evil.test' })),
    false,
  );
  assert.equal(
    isTrustedLocalRequest(request({ 'sec-fetch-site': 'cross-site' })),
    false,
  );
  assert.equal(
    isTrustedLocalRequest({
      ...request(),
      socket: { localPort: 3000, remoteAddress: '192.168.1.10' },
    }),
    false,
  );
});

void test('local editor forwards only authenticated, same-origin, CSRF-protected saves', async () => {
  let middleware;
  const plugin = portfolioSync('https://example.com', key);
  plugin.configureServer({
    middlewares: {
      use(handler) {
        middleware = handler;
      },
    },
  });
  const invoke = async (req) => {
    let body;
    const response = {
      statusCode: 200,
      setHeader() {},
      end(value) {
        body = JSON.parse(value);
      },
    };
    await middleware(req, response, () =>
      assert.fail('must not fall through to local database'),
    );
    return { status: response.statusCode, body };
  };
  const originalFetch = globalThis.fetch;
  let writes = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(options.headers['x-portfolio-sync-key'], key);
    assert.equal(options.redirect, 'error');
    if (url.pathname === '/api/session')
      return Response.json({ canEdit: true });
    writes++;
    assert.equal(options.method, 'PUT');
    assert.equal(options.headers['oai-authenticated-user-id'], undefined);
    return Response.json({ ok: true });
  };
  try {
    const session = await invoke(request());
    assert.equal(session.body.canEdit, true);
    assert.notEqual(session.body.csrfToken, key);
    assert.equal(JSON.stringify(session).includes(key), false);
    assert.equal(
      (await invoke(request({}, 'PUT', '/api/content'))).status,
      403,
    );
    assert.equal(
      (
        await invoke(
          request(
            {
              origin: 'https://evil.test',
              'x-portfolio-csrf': session.body.csrfToken,
            },
            'PUT',
            '/api/content',
          ),
        )
      ).status,
      403,
    );
    const result = await invoke(
      request(
        {
          origin: 'http://localhost:3000',
          'content-type': 'application/json',
          'x-portfolio-csrf': session.body.csrfToken,
        },
        'PUT',
        '/api/content',
      ),
    );
    assert.equal(result.status, 200);
    assert.equal(result.body.ok, true);
    assert.equal(writes, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
