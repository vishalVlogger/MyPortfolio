import { eq } from 'drizzle-orm';
import { Portfolio } from '@/components/portfolio';
import { getDb } from '@/db';
import { portfolioContent } from '@/db/schema';
import type { PortfolioData } from '@/lib/portfolio';
import { preparePortfolio } from '@/lib/portfolio-content';
import { isPortfolioData } from '@/lib/portfolio-validation';

export const dynamic = 'force-dynamic';

/**
 * Inlining large uploaded files (photos, PDFs as data URLs) would bloat every
 * page view, so bigger records fall back to the client-side fetch.
 */
const MAX_SERVER_RENDERED_BYTES = 200_000;

async function loadSavedPortfolio(): Promise<PortfolioData | undefined> {
  try {
    const [record] = await getDb()
      .select()
      .from(portfolioContent)
      .where(eq(portfolioContent.id, 1));
    if (!record || record.data.length > MAX_SERVER_RENDERED_BYTES) return;
    const parsed: unknown = JSON.parse(record.data);
    return isPortfolioData(parsed) ? preparePortfolio(parsed) : undefined;
  } catch {
    // The client still loads content through /api/content.
    return undefined;
  }
}

export default async function Home() {
  const saved = await loadSavedPortfolio();
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: saved?.hero.name ?? 'Vishal R. Patil',
    url: 'https://myportfolio.thepatilvishal.workers.dev',
    image: 'https://myportfolio.thepatilvishal.workers.dev/profile.jpg',
    jobTitle: saved?.hero.role ?? 'Salesforce & .NET Developer',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Pune',
      addressRegion: 'Maharashtra',
      addressCountry: 'IN',
    },
    sameAs: [
      'https://github.com/vishalVlogger',
      'https://www.linkedin.com/in/vishal-patil03/',
    ],
    knowsAbout: [
      'Salesforce',
      'Lightning Web Components',
      'Apex',
      'ASP.NET Core MVC',
      'SQL Server',
      'REST API integration',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personSchema).replace(/</g, '\\u003c'),
        }}
      />
      <Portfolio initialData={saved} />
    </>
  );
}
