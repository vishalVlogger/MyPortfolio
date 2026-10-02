import { getDb } from '@/db';
import { portfolioFiles } from '@/db/schema';
import { canPublishPortfolio } from '@/lib/owner-auth';
import {
  MAX_FILE_BYTES,
  fileIdFor,
  isStoredFileType,
  matchesFileType,
} from '@/lib/files';

export const dynamic = 'force-dynamic';

const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

export async function POST(request: Request) {
  if (!(await canPublishPortfolio(request))) {
    return Response.json(
      { error: 'Only the portfolio owner can upload files.' },
      { status: 403, headers },
    );
  }
  const type = request.headers.get('content-type')?.split(';', 1)[0].trim();
  if (!type || !isStoredFileType(type)) {
    return Response.json(
      { error: 'Upload a JPEG, PNG, WebP, or PDF file.' },
      { status: 415, headers },
    );
  }
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_FILE_BYTES) {
    return Response.json(
      { error: 'Files must be 1.9 MB or smaller.' },
      { status: 413, headers },
    );
  }
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length > MAX_FILE_BYTES) {
    return Response.json(
      { error: 'Files must be 1.9 MB or smaller.' },
      { status: 413, headers },
    );
  }
  if (!matchesFileType(bytes, type)) {
    return Response.json(
      { error: 'The file contents do not match its type.' },
      { status: 400, headers },
    );
  }
  try {
    const id = await fileIdFor(bytes, type);
    await getDb()
      .insert(portfolioFiles)
      .values({
        id,
        contentType: type,
        data: Buffer.from(bytes),
        size: bytes.length,
        createdAt: new Date().toISOString(),
      })
      .onConflictDoNothing();
    return Response.json({ url: `/files/${id}` }, { headers });
  } catch {
    return Response.json(
      { error: 'File storage is temporarily unavailable.' },
      { status: 503, headers },
    );
  }
}
