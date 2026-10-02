# Portfolio content during local development

The published site stores content in its hosted D1 database. The development
database in `.wrangler` is a different database; deploying code does not copy data.

`.env.local` sets `PORTFOLIO_REMOTE_ORIGIN` to the published site. With `npm run dev`,
the development-only Vite middleware reads `/api/content` from that site. Reloading
or returning to the local tab fetches the current content. Unsaved drafts are not
replaced by a background refresh. Connection failures show an error, not seed data.

## Protected local editor

The local editor is implemented but stays locked until provisioned and deployed.
Configure the same cryptographically random 32-byte lowercase hex key as
`PORTFOLIO_SYNC_KEY` in ignored `.env.local` and in the hosted Sites secrets.
Never commit this key, use a `VITE_` prefix, or send it to browser code.
Publishing the updated hosted API requires approval for the public site.

After setup, run `npm run dev`, open `http://localhost:3000`, choose **Edit site**,
then **Save & publish**. Saves go directly to the hosted database, not the local
copy. Internet access is required. Refresh the public site to see the changes.

The trust boundary is access to your computer, not a separate ChatGPT login.
Anyone with access to your local account/server can edit. Do not expose this
development server through a tunnel or reverse proxy or share your environment
file. The server binds to loopback, checks the client address, Host, Origin and
Fetch Metadata, and requires an unpredictable CSRF token for saves. The remote
key is forwarded only by the server to the configured HTTPS origin; redirects
are blocked. The hosted API validates the key on every save. It intentionally
does not trust identity headers supplied by the request because public clients
can spoof them. Removing or rotating the hosted key revokes
local publishing access; update the local key and restart after rotation.

The UI checks remote permission before enabling Edit. Failed saves retain the
draft and display an error. There is no offline save queue or automatic retry.
Simultaneous edits are last-write-wins: avoid editing from two windows at once.
Uploaded images are converted to a bounded JPEG. Inline resumes must be PDFs no
larger than 900 KB; use an HTTPS link for larger documents. The complete saved
record is capped below D1's 2 MB row limit.

Run security regression tests with:
`node --experimental-strip-types --test tests/local-editor.test.mjs`.

The middleware does not run in production builds. No hosted content or local
database records are modified by this change. Unsetting the origin intentionally
restores the independent local database behavior. Restart development after changing
environment configuration.

## Publishing source and UI changes

Content and source changes use different release paths:

- Content edited through **Edit site → Save & publish** is validated by the
  hosted API and written directly to the production D1 record.
- React, CSS, API, dependency, and configuration changes require a new hosted
  site version. They are not published by the development server.

Before publishing source changes, run:

    npm run verify

This command runs lint, the complete test suite, and the production build in
sequence. Publish the validated source through the Sites deployment workflow so
the production D1 binding and hosted secrets are injected correctly.

Do not deploy with the generated dist/server/wrangler.json. Its local D1
configuration deliberately uses a placeholder database ID and is suitable for
local runtime testing only. Also avoid automatic deploy-on-save: incomplete
local edits must never be pushed directly to the public portfolio.

## Schema changes need the hosted code first

The hosted API rejects fields it doesn't know. When a release adds new content
fields (for example the optional booking notes under **Learning, resume &
contact**), deploy the new site version before filling those fields in from the
local editor. Until then, leave them blank: blank optional fields are not sent.

## Link-preview image

`public/og-image.png` is generated from the default profile content and
`public/profile.jpg`. After changing your name, role, or photo, regenerate it:

    node --experimental-strip-types scripts/generate-og-image.mjs

## Uploaded files

Photos, screenshots, avatars and résumé PDFs uploaded in the editor are stored
in the `portfolio_files` D1 table (one file per row, up to 1.9 MB) and served
from `/files/<hash>` with long-lived caching. The content record only holds the
short URL. Files from older saves that were embedded as `data:` URLs are moved
into file storage automatically the next time you save.

Uploads go through the same protected path as saves: the local server adds the
private key, and the hosted `/api/files` endpoint rejects anything without it or
whose bytes don't match a JPEG, PNG, WebP or PDF. Replaced files are not deleted
yet; they're small and unreferenced.

The `0001` migration creates the new tables. The Sites deployment applies the
files in `drizzle/`; deploy the new version before uploading from the editor.

## Save conflicts

Each save sends the version of the published record the page loaded. If it was
changed elsewhere in the meantime (another window, the WebMCP profile tool), the
save is refused and the editor offers **Reload latest** or **Overwrite with my
version**. Your draft is kept either way until you choose.

## Visitor statistics

The site counts a fixed list of anonymous events per day (page views, résumé
previews and downloads, demo/source clicks, quick-scan opens, contact sends).
No cookies, IPs or visitor identifiers are stored, and obvious bots are
ignored. Your own editing sessions and local development don't count. See the
totals under **Edit site → Visitor statistics (30 days)**.

Restart `npm run dev` after pulling these changes: the local proxy plugin is
loaded once at startup.
