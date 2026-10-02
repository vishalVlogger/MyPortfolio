// Regenerates public/og-image.png (the 1200×630 link-preview image).
// Run with: node scripts/generate-og-image.mjs
// Uses @vercel/og, which is installed as a dependency of vinext.
import { readFile, writeFile } from 'node:fs/promises';
import { ImageResponse } from '@vercel/og';
import { defaultPortfolio } from '../lib/portfolio.ts';

const { hero } = defaultPortfolio;
const photo = await readFile(new URL('../public/profile.jpg', import.meta.url));
const photoUrl = `data:image/jpeg;base64,${photo.toString('base64')}`;
const h = (type, style, ...children) => ({
  type,
  props: { style, children: children.length === 1 ? children[0] : children },
});

const tags = ['Salesforce', 'LWC & Apex', 'ASP.NET Core', 'REST APIs'];

const image = new ImageResponse(
  h(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 64,
      padding: '0 88px',
      background:
        'linear-gradient(135deg, #0b0f17 0%, #131c2e 60%, #0b0f17 100%)',
      color: '#f1f5f9',
      fontFamily: 'Noto Sans',
    },
    {
      type: 'img',
      props: {
        src: photoUrl,
        width: 300,
        height: 300,
        style: {
          borderRadius: 32,
          objectFit: 'cover',
          border: '4px solid #60a5fa',
        },
      },
    },
    h(
      'div',
      { display: 'flex', flexDirection: 'column', flex: 1 },
      h(
        'div',
        { fontSize: 26, color: '#c7ff4a', marginBottom: 12, display: 'flex' },
        hero.availability,
      ),
      h('div', { fontSize: 68, fontWeight: 700, lineHeight: 1.05 }, hero.name),
      h(
        'div',
        { fontSize: 38, color: '#60a5fa', marginTop: 12, display: 'flex' },
        hero.role,
      ),
      h(
        'div',
        { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 36 },
        ...tags.map((tag) =>
          h(
            'div',
            {
              display: 'flex',
              fontSize: 21,
              padding: '6px 14px',
              borderRadius: 999,
              border: '2px solid #263147',
              background: '#1e2638',
              color: '#cbd5e1',
            },
            tag,
          ),
        ),
      ),
      h(
        'div',
        { display: 'flex', fontSize: 24, color: '#94a3b8', marginTop: 32 },
        `📍 ${hero.location}`,
      ),
    ),
  ),
  { width: 1200, height: 630 },
);

const out = new URL('../public/og-image.png', import.meta.url);
await writeFile(out, Buffer.from(await image.arrayBuffer()));
console.log(`Wrote ${out.pathname}`);
