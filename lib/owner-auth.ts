import { env } from 'cloudflare:workers';
import { verifySyncToken } from './sync-token';

/** Publishing uses a revocable server-to-server secret that is never exposed to the browser. */
export async function canPublishPortfolio(request: Request) {
  return verifySyncToken(request, env.PORTFOLIO_SYNC_KEY);
}
