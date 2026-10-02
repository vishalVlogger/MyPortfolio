import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { portfolioEvents } from '@/db/schema';
import { isLikelyBot, isTrackedEvent } from '@/lib/events';

export const dynamic = 'force-dynamic';

/** Counts one anonymous event per call. Nothing about the visitor is stored. */
export async function POST(request: Request) {
  const done = new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
  if (isLikelyBot(request.headers.get('user-agent'))) return done;
  // Only same-site pages may report events.
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return done;
  let name: unknown;
  try {
    const text = await request.text();
    if (text.length > 200) return done;
    name = (JSON.parse(text) as { name?: unknown }).name;
  } catch {
    return done;
  }
  if (!isTrackedEvent(name)) return done;
  try {
    await getDb()
      .insert(portfolioEvents)
      .values({ day: new Date().toISOString().slice(0, 10), name, count: 1 })
      .onConflictDoUpdate({
        target: [portfolioEvents.day, portfolioEvents.name],
        set: { count: sql`${portfolioEvents.count} + 1` },
      });
  } catch {
    // Analytics must never break the page.
  }
  return done;
}
