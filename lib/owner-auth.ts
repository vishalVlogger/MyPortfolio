import { env } from 'cloudflare:workers';

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
