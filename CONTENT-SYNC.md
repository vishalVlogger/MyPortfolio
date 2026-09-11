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
are blocked. The hosted API validates the key on every save and retains the
existing owner sign-in behavior. Removing or rotating the hosted key revokes
local publishing access; update the local key and restart after rotation.

The UI checks remote permission before enabling Edit. Failed saves retain the
draft and display an error. There is no offline save queue or automatic retry.
Simultaneous edits are last-write-wins: avoid editing from two windows at once.

Run security regression tests with:
`node --experimental-strip-types --test tests/local-editor.test.mjs`.

The middleware does not run in production builds. No hosted content or local
database records are modified by this change. Unsetting the origin intentionally
restores the independent local database behavior. Restart development after changing
environment configuration.
