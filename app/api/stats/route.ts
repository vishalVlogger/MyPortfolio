import { gte, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { portfolioEvents } from '@/db/schema';
import { canPublishPortfolio } from '@/lib/owner-auth';

export const dynamic = 'force-dynamic';

const headers = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
};

/** Owner-only: event totals for the last 30 days plus daily page views. */
export async function GET(request: Request) {
  if (!(await canPublishPortfolio(request)))
    return Response.json({ error: 'Owner only.' }, { status: 403, headers });
  const since = new Date(Date.now() - 29 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  try {
    const db = getDb();
    const [totals, daily] = await Promise.all([
      db
        .select({
          name: portfolioEvents.name,
          count: sql<number>`sum(${portfolioEvents.count})`,
        })
        .from(portfolioEvents)
        .where(gte(portfolioEvents.day, since))
        .groupBy(portfolioEvents.name),
      db
        .select({ day: portfolioEvents.day, count: portfolioEvents.count })
        .from(portfolioEvents)
        .where(
          sql`${portfolioEvents.day} >= ${since} and ${portfolioEvents.name} = 'page_view'`,
        )
        .orderBy(portfolioEvents.day),
    ]);
    return Response.json({ since, totals, daily }, { headers });
  } catch {
    return Response.json(
      { error: 'Statistics are temporarily unavailable.' },
      { status: 503, headers },
    );
  }
}
