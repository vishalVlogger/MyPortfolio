# Portfolio content during local development

The published site stores content in its hosted D1 database. The development
database in `.wrangler` is a different database; deploying code does not copy data.

`.env.local` sets `PORTFOLIO_REMOTE_ORIGIN` to the published site. With `npm run dev`,
the development-only Vite middleware reads `/api/content` from that site. Reloading
or returning to the local tab fetches the current content. Unsaved drafts are not
replaced by a background refresh. Connection failures show an error, not seed data.

This connection is currently read-only. Local writes are explicitly rejected so
they cannot accidentally update the isolated local database. Enabling local
publishing still requires a secure owner-authenticated bridge on the hosted site
and approval to deploy that change. Do not forward fake owner identity headers or
put a server credential in a `VITE_` environment variable.

The middleware does not run in production builds. No hosted content or local
database records are modified by this change. Unsetting the origin intentionally
restores the independent local database behavior. Restart development after changing
environment configuration.
