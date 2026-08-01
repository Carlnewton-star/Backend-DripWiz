# Status — Backend-DripWiz

*Single source of truth for the current state of this repo. Last verified 2026-08-01 against a fresh clone of `main`. See `plan.md` for the original scope and `roadmap.md` for the prioritized review this status feeds into.*

## Context

DripWiz is Caleb's streetwear e-commerce venture (branded "DripWiz254" / "DripWiz-website" in its storefront attempts, with local dev artifacts in this repo also referencing an earlier "TopCartKe" / "ecommerce-admin" project name — the two appear to be the same underlying venture across naming iterations). `Backend-DripWiz` is meant to be the API + admin-dashboard half of that venture: a Node.js/Express 5/MongoDB (Mongoose 8) REST API providing JWT-based auth with role-based access (`user`/`admin`), and CRUD for products, orders, reviews, and users, with Cloudinary planned for image storage, Redis planned for caching, Socket.io planned for real-time dashboard updates, and a React + TailwindCSS + Chart.js admin dashboard originally meant to live in this same repo's `client/` folder. No deployment target has been chosen yet — there is no Dockerfile, CI config, or hosting configuration anywhere in the repo, and the admin-dashboard frontend does not currently exist in any usable form (see below). The public storefront is a separate concern, currently being rebuilt from scratch (see External Prerequisites).

## CRITICAL — read this first

1. **Live secrets are committed to git, in two files.** `config.env` at the repo root, and `server/config/config.env`, are both tracked in git and contain (at the root-level file) `JWT_SECRET`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and `MONGODB_URI`. There is no `.gitignore` in the repo at all, so this isn't a one-off mistake — nothing has ever been excluded from commits. Remediation checklist (see "Recommended priority order" for sequencing):
   - Rotate every credential that appears in either `config.env` file: the JWT signing secret, and the Cloudinary API key/secret at minimum (the committed `MONGODB_URI` points at `127.0.0.1`, i.e. a local dev database, but rotate/secure the real production connection string wherever it actually lives).
   - Add a `.env.example` with placeholder values and real key names, so setup doesn't require reverse-engineering the code to find required env vars.
   - Add a `.gitignore` covering `config.env`, `.env`, `node_modules/`, and `logs/`.
   - Stop committing logs: `logs/*.log` and two Winston `*-audit.json` files are committed. The log content itself is low-sensitivity (mostly connection/startup messages and stack traces), but the audit JSON files leak the absolute local filesystem path the project was developed from (`C:\Users\calebmwaniki\OneDrive - TopCartKe\Desktop\...`), which is unnecessary exposure.
   - Consider scrubbing these secrets from git history entirely (BFG / `git filter-repo`) — this is optional and **the owner's call**, since it rewrites history and breaks any existing clones/forks. Rotating the credentials neutralizes the actual risk on its own; history scrubbing is a belt-and-suspenders cleanup, not a blocker.
   - Separately: both `node_modules/` directories (root and `server/`) are committed in full — over 9,400 of the repo's ~9,470 tracked files. This isn't a security issue but it's bloating the repo significantly; it should be removed from tracking as part of the same `.gitignore` cleanup.

2. **The `client/` folder — meant to be the React admin dashboard — is not real code.** `git ls-tree` shows `client` committed as a gitlink (mode `160000`, pointing at commit `6f7c1a2c84b9bd54479a57ec967cde7708394361`), i.e. a submodule reference, but there is no `.gitmodules` file anywhere in the repo's history recording what remote that commit belongs to. The actual dashboard frontend code is not present in this repo and is not recoverable from it. This is a full gap between the README's stated plan (a React/Tailwind/Chart.js dashboard living in `client/`) and reality: **that dashboard has never actually been committed here.** Given the parallel decision to retire the two prior storefront attempts and rebuild the customer-facing site from scratch, the pragmatic path is to treat the admin dashboard the same way — build it fresh rather than trying to recover an unrecorded submodule.

3. **The server does not start as currently committed.** `server/app.js` constructs the Express app but never exports it (`module.exports = app` is missing). `server/server.js` requires it and immediately calls `app.set('port', port)`, which throws because `require('./app')` resolves to an empty object. This is not a hypothetical — the repo's own committed `logs/error-2025-04-17.log` shows this exact crash from a real local run (`TypeError: app.set is not a function`, `server.js:12`), immediately followed by `EADDRINUSE` because `app.js` *also* independently calls `app.listen()`. See `roadmap.md` item 3 for the fix.

## Implemented — complete and verified

**Auth (`server/controllers/auth.js`, `server/routes/auth.js`, `server/middleware/auth.js`)**
- Registration and login with bcrypt password hashing (`models/user.js`, salt rounds 10) and JWT issuance (`getSignedJwtToken`)
- `protect` middleware supporting both `Authorization: Bearer <token>` headers and an httpOnly cookie
- `authorize(...roles)` middleware for role-gating routes
- Endpoints for get-current-user, update-details, update-password, logout
- Forgot/reset-password *route wiring and token-hashing logic* exist (`crypto.createHash('sha256')` token flow, 10-minute expiry) — the email-sending step behind it does not work (see Known gaps)

**Products (`controllers/products.js`, `routes/products.js`, `models/product.js`)**
- Full CRUD, public read / admin-only write, enforced via `authorize('admin')`
- Mongoose schema with required fields, category enum, price/stock validation, auto-slug generation via `slugify`
- Cloudinary SDK is configured and wired into both delete (removing images on product delete) and upload flows in code (the upload flow itself doesn't currently work end-to-end — see Known gaps)
- Nested review routes mounted at `/api/v1/products/:productId/reviews`

**Orders (`controllers/orders.js`, `routes/orders.js`, `models/order.js`)**
- Order creation with computed subtotal/tax(15%)/total
- Ownership check on `GET /api/v1/orders/:id` (owner or admin only — correctly implemented)
- Admin-only listing, admin-only mark-as-paid/delete, admin-only sales-stats aggregation endpoint
- Schema supports shipping address, payment method (`stripe`/`paypal` enum — no actual gateway integration exists yet), paid/delivered timestamps

**Reviews (`controllers/reviews.js`, `routes/reviews.js`, `models/review.js`)**
- CRUD with per-review-per-product uniqueness enforced at the schema level (`{ product, user }` unique index)
- Ownership checks on update/delete (author or admin only)
- Product rating auto-recalculation on review save (`post('save')` hook calling `getAverageRating`)

**Users (`controllers/users.js`, `routes/users.js`)**
- Full admin-only CRUD over user accounts, using the shared `advancedResults` middleware for listing

**Cross-cutting infrastructure**
- `middleware/advancedResults.js`: generic filter/sort/select/paginate helper reused across products/orders/users/reviews list endpoints, including Mongo comparison-operator support (`gt`, `gte`, `lt`, `lte`, `in`)
- `middleware/async.js`: standard async-error-forwarding wrapper used throughout every controller
- `utils/errorResponse.js`: custom `Error` subclass carrying an HTTP status code (though see Known gaps — the global handler currently ignores it)
- `utils/logger.js`: Winston logger with daily-rotating file transports (console + `error-*.log` + `combined-*.log`), correctly wired to write into the repo's `logs/` folder
- Standard Express hardening middleware installed and mounted: Helmet, `express-mongo-sanitize`, `xss-clean`, `hpp`, CORS, `express-rate-limit` (100 req / 10 min, global) — see Known gaps for a version-compatibility caveat
- `server.js` sets up Socket.io with a CORS-scoped server and a connect/disconnect handler (the actual "push live dashboard data" behavior is a stub — it only logs a subscription message)

## Known gaps and bugs — not yet fixed

*(Full technical detail and file/line references live in `roadmap.md`; this is the summary.)*

- Server cannot start as committed — `app.js` doesn't export the Express app (see Critical section above)
- Global error handler ignores `ErrorResponse`'s status code/message and always returns a generic `500` — every controller's carefully-thrown 400/401/403/404 currently reaches the client as a 500
- Env var name mismatches: `server.js` reads `MONGO_URI` but `config.env` defines `MONGODB_URI`; `controllers/auth.js` reads `JWT_COOKIE_EXPIRE` but `config.env` defines `COOKIE_EXPIRE`
- Every model import uses a capitalized filename (`require('../models/User')`) that doesn't match the actual lowercase files on disk (`user.js`, `product.js`, `review.js`, `order.js`) — works only on case-insensitive filesystems; will break on standard Linux deployment targets
- `models/user.js` calls `crypto.randomBytes(...)` without ever requiring the `crypto` module — throws `ReferenceError` on any password-reset attempt
- `.remove()` is called on documents in `controllers/products.js`, `controllers/orders.js`, and `controllers/reviews.js` — that Mongoose document method was removed in Mongoose 7+, and this repo runs Mongoose 8.13.2, so every delete endpoint throws at runtime. This also means the "cascade delete a product's reviews" hook in `models/product.js` never fires.
- Forgot-password email is fully broken end to end: `utils/sendEmail.js` exports a class that's called as a plain function in `controllers/auth.js`; the Pug templates it would render (`views/email/*.pug`) don't exist anywhere in the repo; and it calls an `html-to-text` API (`fromString`) that was removed in the pinned v9 of that package
- `POST /api/v1/auth/register` accepts a client-supplied `role` field with no restriction — any anonymous caller can self-register as `admin`
- Product photo upload (`uploadProductPhoto`) expects `req.files` in the shape provided by `express-fileupload`, but that middleware is never installed/mounted anywhere in `app.js`; `multer` is a listed dependency but is never required or configured — this endpoint cannot currently succeed
- `express-mongo-sanitize@2.2.0` and `xss-clean@0.1.4` are both known-incompatible with the pinned `express@5.1.0` (both mutate `req.query` in place, which Express 5 made read-only) — untested here, but a well-documented ecosystem break worth verifying directly
- Order creation does not validate that a referenced product actually exists before computing line-item price, and never checks or decrements stock — an invalid product id in the request body crashes the endpoint with an unhandled `TypeError` instead of a clean 400
- Root `package.json`'s `start` script (`node server.js`) points at a file that doesn't exist at the repo root (the real entry point is `server/server.js`); the README's documented `npm run dev` doesn't exist as a script anywhere; dependencies are inconsistently split between the root and `server/` `package.json` files (e.g. `redis` is required by `middleware/cache.js` but isn't installed or declared as a dependency in either file — that middleware is also simply unused/dead code)
- No automated tests exist (`"test": "echo \"Error: no test specified\" && exit 1"` in both `package.json` files)
- No `.env.example`, no `.gitignore`, no Dockerfile, no CI configuration anywhere in the repo

## Deferred by explicit request

- **Recovering or resurrecting the `client/` submodule.** Since the broken gitlink has no recorded origin, and the frontend is being rebuilt from scratch anyway (see below), no time will be spent trying to recover the old dashboard code.
- **Continued development on `DripWiz-website` and `DripWiz254`.** Both are prior frontend attempts for the customer-facing storefront and are being retired/deprioritized in favor of one fresh rebuild. `DripWiz-website` is a more complete plain HTML/CSS/JS static site. `DripWiz254` (despite earlier assumptions that it was a React attempt) was verified to actually be a plain static site as well — HTML/SCSS (compiled via the `sass` CLI)/vanilla JS, built with `live-server` for local dev, with no React or any frontend framework anywhere in its `package.json` or source — and is less complete than `DripWiz-website`, with a stray, apparently-unused `DripWiz254.zip` file (2KB) committed alongside the source.
- **Git history scrubbing of the leaked secrets.** Deferred pending the owner's decision — rotation addresses the immediate risk; rewriting history is a separate, disruptive, optional follow-up.
- **Redis caching and the Socket.io real-time dashboard feed.** Both exist only as stubs/dead code today; deferred until there's an actual frontend to consume them and a demonstrated need.

## External prerequisites — not code, the owner's to handle

- **Rotate leaked credentials.** The JWT secret and Cloudinary API key/secret committed in `config.env` need to be regenerated at the source (Cloudinary dashboard; wherever the JWT secret is generated/stored for real deployments) — this can't be done from inside the repo.
- **Choose and provision a deployment target.** Nothing in the repo currently specifies where this runs in production (no Dockerfile, no CI/CD, no hosting config). Needs a decision (Render/Railway/Fly/VPS/etc.) plus the associated account setup.
- **Provision a real MongoDB instance for production** (e.g. MongoDB Atlas) if one doesn't already exist outside this repo — the committed URI points at `127.0.0.1`, i.e. local-only.
- **Decide on and provision an email-sending service.** `utils/sendEmail.js` references `SENDGRID_USERNAME`/`SENDGRID_PASSWORD` (production) and `EMAIL_HOST`/`EMAIL_PORT`/`EMAIL_USERNAME`/`EMAIL_PASSWORD`/`EMAIL_FROM` (development), none of which currently exist in either committed `config.env` — an account and credentials need to be created before the password-reset flow can be rebuilt.
- **Decide on a payment processor.** `models/order.js` already has a `paymentMethod` enum of `stripe`/`paypal`, but no SDK, API keys, or integration code exists for either — this requires creating merchant accounts and API credentials before payment processing can be built.
- **Review `DripWiz254---Copy` and `Trial-Website` for deletion.** Both were inspected as part of this documentation pass: `DripWiz254---Copy` is a genuinely empty repository (zero commits on `main`), and `Trial-Website` is a single 174-line throwaway `index.html` (~5KB) with two trivial commits. Neither appears to serve any purpose. Repository deletion is irreversible, so this is intentionally left as the owner's decision rather than being deleted as part of this work.
- **Domain name(s)** for the eventual production frontend/API, once the deployment target and rebuild are further along.

## Recommended priority order

1. **Rotate every leaked secret** (JWT secret, Cloudinary key/secret at minimum) and clean up the repo's secret/log-handling hygiene (`.gitignore`, `.env.example`, stop committing `logs/` and `node_modules/`). This is the only item with actual, live security exposure and should happen before anything else, independent of any other work.
2. **Decide the new frontend's tech approach.** Since the `client/` dashboard is unrecoverable and the two storefront attempts are being retired anyway, this is the cheapest possible moment to start clean. Recommendation: **React + Vite + TypeScript**, mirroring the pattern used on Bree's Beauty Luxe (the best-run project in this account) — there is zero migration cost right now since nothing usable exists to migrate away from.
3. **Fix the backend gaps documented above** before building anything new against this API: the server-won't-start bug, the error-handler bug, the env-var mismatches, the case-sensitive model imports, the `.remove()` calls, the broken email flow, the registration privilege-escalation hole, and the file-upload wiring, at minimum. Trying to build a new frontend against an API with these bugs live will waste time chasing frontend "bugs" that are actually backend bugs.
4. **Build the new frontend** against the now-secured, now-understood backend API — at that point the actual admin-dashboard feature set (product/order/user management, charts, RBAC-aware UI) can be built with confidence in what the API actually does.
