import { env } from 'cloudflare:workers';
import { verifySyncToken } from './sync-token';

/** Local publishing uses its own revocable secret, not spoofed Sites identity. */
export async function canPublishPortfolio(request: Request) {
  return isPortfolioOwner(request) || await verifySyncToken(request, env.PORTFOLIO_SYNC_KEY);
}

/** Authorize writes using the signed-in OpenAI identity forwarded by Sites. */
export function isPortfolioOwner(request: Request) {
  const authenticatedUserId = request.headers.get('oai-authenticated-user-id');
  const authenticatedUserEmail = request.headers
    .get('oai-authenticated-user-email')
    ?.trim()
    .toLowerCase();

  return Boolean(
    (env.PORTFOLIO_OWNER_ID && authenticatedUserId === env.PORTFOLIO_OWNER_ID) ||
      (env.PORTFOLIO_OWNER_EMAIL &&
        authenticatedUserEmail === env.PORTFOLIO_OWNER_EMAIL.toLowerCase()),
  );
}
