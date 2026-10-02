import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export const metadata = { title: 'Page not found — Vishal R. Patil' };

export default function NotFound() {
  return (
    <main className="not-found">
      <strong>404</strong>
      <h1>This page doesn’t exist</h1>
      <p>The link may be outdated. Everything lives on the main portfolio.</p>
      <div>
        <Link className="primary-link" href="/">
          Back to portfolio <ArrowUpRight />
        </Link>
      </div>
    </main>
  );
}
