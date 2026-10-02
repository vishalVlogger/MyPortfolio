import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { portfolioFiles } from '@/db/schema';
import { FILE_ID_PATTERN } from '@/lib/files';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!FILE_ID_PATTERN.test(id))
    return new Response('Not found', { status: 404 });
  try {
    const [file] = await getDb()
      .select()
      .from(portfolioFiles)
      .where(eq(portfolioFiles.id, id));
    if (!file) return new Response('Not found', { status: 404 });
    return new Response(new Uint8Array(file.data), {
      headers: {
        'Content-Type': file.contentType,
        'Content-Length': String(file.size),
        // Names are content hashes, so a given URL never changes.
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        // Chrome won't render PDFs in a sandboxed document, so only images get it.
        ...(file.contentType === 'application/pdf'
          ? { 'Content-Disposition': 'inline; filename="resume.pdf"' }
          : { 'Content-Security-Policy': "default-src 'none'; sandbox" }),
      },
    });
  } catch {
    return new Response('Storage unavailable', { status: 503 });
  }
}
