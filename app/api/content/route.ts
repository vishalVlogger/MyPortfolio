import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { portfolioContent } from '@/db/schema';
import { defaultPortfolio, type PortfolioData } from '@/lib/portfolio';
import { canPublishPortfolio } from '@/lib/owner-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const [record] = await db.select().from(portfolioContent).where(eq(portfolioContent.id, 1));
  if (record) {
    try {
      const parsed = JSON.parse(record.data) as PortfolioData;
      // If the database has placeholder "Your Name", upgrade it to Vishal's real profile
      if (parsed?.hero?.name === 'Your Name' || !parsed?.hero?.name) {
        const now = new Date().toISOString();
        await db
          .insert(portfolioContent)
          .values({ id: 1, data: JSON.stringify(defaultPortfolio), updatedAt: now })
          .onConflictDoUpdate({ target: portfolioContent.id, set: { data: JSON.stringify(defaultPortfolio), updatedAt: now } });
        return Response.json(defaultPortfolio, { headers: { 'Cache-Control': 'no-store' } });
      }
      return Response.json(parsed, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
      return Response.json(defaultPortfolio, { headers: { 'Cache-Control': 'no-store' } });
    }
  }
  await db.insert(portfolioContent).values({ id: 1, data: JSON.stringify(defaultPortfolio), updatedAt: new Date().toISOString() });
  return Response.json(defaultPortfolio, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(request: Request) {
  if (!await canPublishPortfolio(request)) {
    return Response.json(
      { error: 'Only the portfolio owner can edit this site.' },
      { status: 403 },
    );
  }
  const data = (await request.json()) as PortfolioData;
  if (!data?.hero?.name || !Array.isArray(data.projects)) return Response.json({ error: 'Invalid portfolio data.' }, { status: 400 });
  const db = getDb();
  const now = new Date().toISOString();
  await db.insert(portfolioContent).values({ id: 1, data: JSON.stringify(data), updatedAt: now }).onConflictDoUpdate({ target: portfolioContent.id, set: { data: JSON.stringify(data), updatedAt: now } });
  return Response.json({ ok: true });
}
