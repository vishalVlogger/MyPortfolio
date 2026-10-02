import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { portfolioContent } from '@/db/schema';
import { defaultPortfolio, type PortfolioData } from '@/lib/portfolio';
import { canPublishPortfolio } from '@/lib/owner-auth';
import {
  VERSION_HEADER,
  isPortfolioData,
  readLimitedJson,
} from '@/lib/portfolio-validation';

export const dynamic = 'force-dynamic';

const responseHeaders = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET() {
  try {
    const [record] = await getDb()
      .select()
      .from(portfolioContent)
      .where(eq(portfolioContent.id, 1));
    if (record) {
      const parsed: unknown = JSON.parse(record.data);
      if (isPortfolioData(parsed)) {
        return Response.json(parsed, {
          headers: { ...responseHeaders, [VERSION_HEADER]: record.updatedAt },
        });
      }
    }
  } catch {
    // Public reads remain available from the checked-in fallback if D1 is unavailable.
  }
  return Response.json(defaultPortfolio, {
    headers: { ...responseHeaders, [VERSION_HEADER]: '' },
  });
}

export async function PUT(request: Request) {
  if (!(await canPublishPortfolio(request))) {
    return Response.json(
      { error: 'Only the portfolio owner can edit this site.' },
      { status: 403 },
    );
  }
  if (
    request.headers.get('content-type')?.split(';', 1)[0].trim() !==
    'application/json'
  ) {
    return Response.json({ error: 'JSON content required.' }, { status: 415 });
  }
  let data: PortfolioData;
  try {
    const candidate = await readLimitedJson(request);
    if (!isPortfolioData(candidate))
      throw new TypeError('Invalid portfolio data.');
    data = candidate;
  } catch (error) {
    const tooLarge = error instanceof RangeError;
    return Response.json(
      {
        error: tooLarge
          ? 'Portfolio exceeds the 1.75 MB storage limit.'
          : 'Invalid portfolio data.',
      },
      { status: tooLarge ? 413 : 400 },
    );
  }
  try {
    const now = new Date().toISOString();
    const body = JSON.stringify(data);
    const expected = request.headers.get(VERSION_HEADER);
    const db = getDb();
    if (expected === null) {
      // No version supplied: an explicit overwrite.
      await db
        .insert(portfolioContent)
        .values({ id: 1, data: body, updatedAt: now })
        .onConflictDoUpdate({
          target: portfolioContent.id,
          set: { data: body, updatedAt: now },
        });
    } else {
      // Write only if the record is still the version the editor loaded.
      const result =
        expected === ''
          ? await db
              .insert(portfolioContent)
              .values({ id: 1, data: body, updatedAt: now })
              .onConflictDoNothing()
              .run()
          : await db
              .update(portfolioContent)
              .set({ data: body, updatedAt: now })
              .where(
                and(
                  eq(portfolioContent.id, 1),
                  eq(portfolioContent.updatedAt, expected),
                ),
              )
              .run();
      if (!result.meta.changes) {
        return Response.json(
          {
            error:
              'The portfolio was changed elsewhere after you opened the editor.',
            conflict: true,
          },
          { status: 409, headers: responseHeaders },
        );
      }
    }
    return Response.json(
      { ok: true, version: now },
      { headers: { ...responseHeaders, [VERSION_HEADER]: now } },
    );
  } catch {
    return Response.json(
      { error: 'Portfolio storage is temporarily unavailable.' },
      { status: 503, headers: responseHeaders },
    );
  }
}
