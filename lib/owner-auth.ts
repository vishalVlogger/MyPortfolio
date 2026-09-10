import { env } from 'cloudflare:workers';

/** Authorize writes using the stable, site-scoped OpenAI account ID. */
export function isPortfolioOwner(request: Request) {
  const authenticatedUserId = request.headers.get('oai-authenticated-user-id');
  return Boolean(
    env.PORTFOLIO_OWNER_ID && authenticatedUserId === env.PORTFOLIO_OWNER_ID,
  );
}
