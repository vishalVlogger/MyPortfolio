import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://myportfolio.thepatilvishal.workers.dev'),
  title: 'Vishal R. Patil — Salesforce & .NET Developer',
  description:
    'Salesforce and .NET developer portfolio featuring enterprise modernisation, Lightning Web Components, automation, and API integration work.',
  keywords: [
    'Vishal Patil',
    'Salesforce Developer',
    '.NET Developer',
    'Lightning Web Components',
    'ASP.NET Core',
    'Pune Software Developer',
  ],
  authors: [{ name: 'Vishal R. Patil' }],
  creator: 'Vishal R. Patil',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'Vishal R. Patil Portfolio',
    title: 'Vishal R. Patil — Salesforce & .NET Developer',
    description:
      'Enterprise modernisation, Salesforce automation, Lightning Web Components, and secure integration work.',
  },
  twitter: {
    card: 'summary',
    title: 'Vishal R. Patil — Salesforce & .NET Developer',
    description:
      'Enterprise modernisation, Salesforce automation, Lightning Web Components, and secure integration work.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: { icon: '/favicon.svg' },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#090b10' },
    { media: '(prefers-color-scheme: light)', color: '#f7f8fa' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
