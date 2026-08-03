# Status — Backend-DripWiz

*Single source of truth for the current state of this repo. Last verified 2026-08-01 —
this update reflects a full bug-fix pass over the previous audit's findings. See
`plan.md` for the original scope and `roadmap.md` for the prioritized review this fed
into.*

## Context

DripWiz is being repositioned as a high-end fashion e-commerce brand — curated
classic and trending pieces, with curators and designers as part of the offering (see
`docs/plan.md` for the domain-model implications). `Backend-DripWiz` is the API half:
Express 5 + MongoDB (Mongoose 8), JWT auth with role-based access (`user`/`admin`), CRUD
for products, orders, reviews, and users, Cloudinary for image storage, and a Socket.io
stub for future real-time dashboard updates. This pass fixed every concrete bug from
the previous audit; it did not change the data model (that's `plan.md`'s job) or build
the frontend (a fresh React/Vite/TypeScript build, tracked separately).

## Implemented (fixes from this pass, plus gap-closing additions below)

Gap-closing additions (Aug 2026, on top of the bug-fix pass below): a StockMovement audit-trail ledger (restock/adjustment/return) with admin-only endpoints under /api/v1/stock for movement history and low-stock alerts, layered on top of the existing atomic per-order stock decrement without touching it; a BlogPost model with slug generation and admin CRUD under /api/v1/blog, plus public endpoints to list published posts and fetch one by slug; and Email.isConfigured() plus a real order-confirmation send wired into createOrder (fire-and-forget, never blocks the order response) - the previously coded-but-unconfigured email pipeline now actually fires once real SMTP/SendGrid credentials are set.

- **Server now actually starts.** `app.js` exported nothing (`module.exports = app`
  was missing) and separately called `app.listen()` itself — while `server.js` *also*
  created its own `http.createServer(app)` and called `.listen()`, guaranteeing
  `EADDRINUSE` the moment both ran. `app.js` no longer listens on anything; only
  `server.js` does, after the DB connection succeeds.
- **`config.env`'s leaked secrets are no longer tracked in git.** Added `.gitignore`
  (covering `config.env`, `.env`, `node_modules/`, `logs/`), added
  `config.env.example` / `server/config/config.env.example` with real key names and
  placeholder values, and untracked the ~9,400 previously-committed `node_modules`
  files and the log/audit files that leaked a local filesystem path.
  **`JWT_SECRET` has been rotated** (new 64-byte random value, generated fresh — not
  reused from the leaked one). **`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` have
  NOT been rotated** — that needs the owner's action on Cloudinary's dashboard, since
  it's not something crackable from inside the repo. See External prerequisites.
- **Env var name mismatches fixed and standardized.** `server.js` read `MONGO_URI`,
  `config.env` only ever defined `MONGODB_URI` — the connection was silently using
  `undefined`. Standardized on `MONGODB_URI` everywhere (matching every other repo in
  the portfolio). Same fix for `JWT_COOKIE_EXPIRE` (code read it, `config.env` defined
  `COOKIE_EXPIRE` instead) — renamed in `config.env` to match what the code reads.
  Renamed `CLIENT_URL` (Socket.io CORS) to `FRONTEND_URL`, again matching the rest of
  the portfolio's convention.
- **Case-sensitive model imports fixed.** Every controller/route/middleware file
  required models as `../models/User`, `../models/Product`, etc. (capitalized) while
  the actual files are lowercase (`user.js`, `product.js`, ...) — worked by accident on
  the case-insensitive filesystem this was developed on, would have broken outright on
  any standard Linux deployment target. All fixed to match the real filenames.
- **`models/user.js` now actually imports `crypto`** — `getResetPasswordToken` called
  `crypto.randomBytes`/`crypto.createHash` without ever requiring the module; every
  password-reset attempt threw a `ReferenceError`.
- **`.remove()` replaced with `.deleteOne()` throughout** (`controllers/products.js`,
  `orders.js`, `reviews.js`) — Mongoose 7+ removed the `.remove()` document method
  entirely; every delete endpoint threw at runtime on this repo's Mongoose 8.13.2. The
  corresponding `pre('remove', ...)` / `post('remove', ...)` hooks (cascade-delete a
  product's reviews; recalculate rating after a review is deleted) are now
  `pre('deleteOne', { document: true, query: false }, ...)` / `post('deleteOne', ...)`,
  which actually fire for `.deleteOne()` calls.
- **`POST /api/v1/auth/register` no longer accepts a client-supplied `role`.** It used
  to destructure `role` straight from `req.body` into `User.create()` — any anonymous
  caller could self-register as admin. Every registration now gets the schema default
  (`user`); admin accounts are created via the already admin-gated
  `POST /api/v1/users` endpoint instead.
- **Product photo upload now has the middleware it was written for.**
  `uploadProductPhoto` expected `req.files` in `express-fileupload`'s shape
  (`req.files.file`, `.tempFilePath`, `.mimetype`, `.size`) but that middleware was
  never installed or mounted (a `multer` dependency sat unused instead). Added
  `express-fileupload` as a real dependency and mounted it in `app.js`; removed the
  unused `multer` dependency.
- **`express-mongo-sanitize` and `xss-clean` replaced with a small custom middleware**
  (`middleware/sanitize.js`). Both packages reassign `req.query` outright, which
  Express 5 made a getter-only property — every single request would have thrown
  `TypeError: Cannot set property query of #<IncomingMessage> which has only a
  getter` the moment the server actually started (this was flagged as "untested" in
  the previous audit; it is a real, guaranteed-to-fire bug on every request). The
  replacement does the same two jobs — stripping `$`/`.` keys and obvious script tags
  — by mutating the existing objects instead of replacing them, which works under
  both Express 4 and 5.
- **Global error handler now respects `ErrorResponse`'s status code.** It previously
  always returned a bare `500` regardless of what any controller threw, so every
  400/401/403/404 a controller carefully constructed reached the client as an opaque
  500. Now uses `err.statusCode || 500` and `err.message || 'Server Error'`.
- **Order creation now validates products and prevents overselling.** Previously, an
  invalid product ID crashed the endpoint with an unhandled `TypeError`
  (`product.price` on `null`), and nothing ever checked or decremented stock at all —
  concurrent orders could oversell indefinitely. `createOrder` now runs inside a
  Mongo transaction, atomically checking-and-decrementing each item's stock via
  `findOneAndUpdate({ _id, stock: { $gte: quantity } }, { $inc: { stock: -quantity } })`
  and rolling back the whole order if any item is missing or out of stock. This
  mirrors the stock-oversell guard already built for Bree's Beauty Luxe's Postgres
  catalog — same guarantee, adapted to Mongo's transaction model instead of Postgres's.
- **`sendEmail.js`'s crash points fixed, forgot-password fails clearly instead of
  crashing.** `controllers/auth.js` called `sendEmail({...})` as a plain function, but
  `utils/sendEmail.js` exports a class meant to be instantiated with `new` — every
  forgot-password request threw `TypeError: Class constructor Email cannot be invoked
  without 'new'` before ever reaching the "is email configured" question. Fixed the
  call site, fixed `html-to-text`'s v9 API (`.fromString` was removed; now uses the
  named `convert` export), and added a minimal Pug template so the render step
  doesn't fail on a missing file. **Actually sending email still doesn't work** — no
  SMTP/SendGrid credentials exist yet (see External prerequisites) — but
  `POST /api/v1/auth/forgotpassword` now returns a clear `501 Not configured` instead
  of an unhandled crash when they're absent.
- **`config/db.js`'s dead code removed.** It defined a whole unused `Database` class
  (never actually called by `server.js`, which did its own separate, buggy
  `mongoose.connect()`) — replaced with a plain `async connectDB()` function that
  `server.js` now actually awaits before starting the HTTP listener, matching the
  simpler pattern used in GnG Express's backend.
- **`middleware/cache.js` deleted.** Confirmed dead code — required `redis`, which was
  never installed or declared as a dependency in either `package.json`, and nothing
  in the app ever imported this middleware.
- **`/api/v1/health` now actually touches the database** (a trivial `admin().ping()`)
  instead of returning a static `200`, so a scheduled ping to it also counts as
  activity against whichever MongoDB cluster this ends up pointed at — relevant once
  this shares an Atlas cluster with GnG Express (see `docs/roadmap.md`).
- **Root `package.json`'s `start` script fixed** to point at `server/server.js` (the
  real entry point — it previously pointed at a `server.js` that doesn't exist at the
  repo root). Removed a bogus `crypto` npm package from dependencies (an abandoned
  shim that shadows Node's real built-in module of the same name — never needed an
  install in the first place).

## Known gaps and bugs

- ~~Not yet verified against a real MongoDB~~ / ~~no deployment target chosen~~ —
  **both resolved 2026-08-01.** Deployed as a free-tier Render web service
  (`dripwiz-backend`, https://dripwiz-backend.onrender.com), build command `npm
  install`, start command `npm start` (root `package.json` → `node server/server.js`).
  Render's deploy log shows `Mongoose connected to DB` on boot — a real connection to
  the shared Atlas cluster's `dripwiz` database via `dripwiz_app`, not a mock. Live
  verification: `GET /api/v1/health` returns `{"ok":true}` (the DB-ping health check
  added in this pass actually succeeds), and `GET /api/v1/products` returns
  `{"success":true,"count":0,"pagination":{},"data":[]}` — a real Mongoose query
  round-tripping through routing → controller → model → DB → response, on an
  intentionally-empty fresh database. Free-tier caveat: this instance spins down
  after inactivity like the other two portfolio backends; a keep-alive cron is
  tracked the same way as Bree's/Velocity/GnG's.
- Actual email sending (forgot-password) still doesn't work — needs a real
  SMTP/SendGrid account (external prerequisite below); the code now fails clearly
  instead of crashing, but nobody can reset a password via email yet.
- No automated tests exist yet.
- ~~The admin dashboard frontend is still unrecoverable...~~ — **resolved
  2026-08-01.** The broken `client/` gitlink turned out to be a simple orphaned
  submodule reference (no `.gitmodules`, no nested `.git`) — fixed with a plain
  `git rm --cached client`, then a full storefront (Home, Shop with category
  filters, Product detail, Cart/checkout, Login/Register, Account/orders) was built
  from scratch against the real API and deployed to Vercel (see Known gaps above).

## Deferred by explicit request

- Recovering the `client/` submodule — still not attempted; building fresh instead.
- Git history scrubbing of the previously-leaked secrets — rotation (done for
  JWT_SECRET) addresses the live risk; rewriting history is optional cleanup, the
  owner's call.
- `DripWiz254---Copy` and `Trial-Website` deletion — still the owner's call, not done.

## External prerequisites — owner's to handle

- **Rotate `CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET`** on Cloudinary's dashboard —
  these were leaked in git history and have not been rotated (unlike `JWT_SECRET`,
  which was rotated as part of this pass without needing any external account).
- ~~Choose and provision a deployment target~~ — **done 2026-08-01**, deployed to
  Render (free tier) as `dripwiz-backend`, live at
  https://dripwiz-backend.onrender.com. ~~`FRONTEND_URL` on this service is
  currently a placeholder~~ — **resolved 2026-08-01**: a real storefront frontend
  (Vite/React/TS, `client/`) is now built and deployed to Vercel under a dedicated
  `DripWiz254` account/team, live at
  https://dripwiz-frontend-3p29u72yk-dripwiz255.vercel.app. `FRONTEND_URL` has been
  updated on Render to match, which fixed a CORS block that was surfacing as
  browser-side 503s on `/api/v1/products` (the server's CORS origin allowlist
  rejects any origin not in `FRONTEND_URL`/`localhost:5173`).
- ~~Set the new `MONGODB_URI` once the shared Atlas cluster has a `dripwiz` database
  provisioned~~ — **done 2026-08-01.** The existing `GnG-Express-Prod` Atlas project's
  `Cluster0` (already running GnG Express's `gng` database) now also has a `dripwiz`
  database and a dedicated `dripwiz_app` user, so no new cluster was needed. Network
  access is already open (`0.0.0.0/0`, inherited from the existing project config).
  The real `MONGODB_URI` is recorded in the owner's password manager / local
  `config.env`, not committed here — whoever provisions the deployment target above
  needs to set it as an env var there, in the same `mongodb+srv://dripwiz_app:<password>
  @cluster0.6gws1z0.mongodb.net/dripwiz?retryWrites=true&w=majority&appName=Cluster0`
  shape as `config.env.example` already documents.
- ~~Set `JWT_SECRET` ... on whatever hosting is chosen~~ — **done 2026-08-01**, set
  on the live Render service along with the rest of the required env vars
  (`MONGODB_URI`, Cloudinary credentials — the leaked ones, still pending rotation
  per the bullet above).
- **Decide on and provision an email-sending service** (SendGrid for production, or
  any SMTP host for dev) if the forgot-password flow needs to actually work — the code
  is ready for either, it just needs credentials.
- **Decide on a payment processor** — `paymentMethod` still only has a
  `stripe`/`paypal` enum with no actual gateway integration.

## Recommended priority order

1. ~~Deploy this backend somewhere with real network access...~~ — **done
   2026-08-01**, see Known gaps and bugs above.
2. ~~Build the real frontend..., then point this service's `FRONTEND_URL` at its
   deployed origin.~~ — **done 2026-08-01**, see above.
3. Rotate the Cloudinary credentials.
3. Build the new frontend against this now-fixed API.
4. Wire up real email sending once an SMTP/SendGrid account exists, if forgot-password
   turns out to matter for this product.
