import { isPortfolioOwner } from '@/lib/owner-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return Response.json(
    { canEdit: isPortfolioOwner(request) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
