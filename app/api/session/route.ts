import { canPublishPortfolio } from '@/lib/owner-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return Response.json(
    { canEdit: await canPublishPortfolio(request) },
    {
      headers: {
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}
