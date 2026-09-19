import { Portfolio } from '@/components/portfolio';

export default function Home() {
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Vishal R. Patil',
    url: 'https://myportfolio.thepatilvishal.workers.dev',
    image: 'https://myportfolio.thepatilvishal.workers.dev/profile.jpg',
    jobTitle: 'Salesforce & .NET Developer',
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
      <Portfolio />
    </>
  );
}
