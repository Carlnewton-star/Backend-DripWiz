# Original Plan — Backend-DripWiz

*This document records what the project was originally scoped to be, based on the repo's README and the dependencies committed to `package.json` at the time. It is a historical record, not a description of what exists today — see `status.md` for current reality.*

## Original vision

`Backend-DripWiz` was scoped as the backend + admin-dashboard half of an **"E-Commerce Admin Dashboard"**: a tool for running an online store's back office (products, orders, users, reviews) rather than the public storefront itself. The storefront/customer-facing site was always intended to live in separate repos (`DripWiz-website`, later `DripWiz254`).

The README describes the intended feature set:

- Modern, responsive admin UI with dark/light mode
- Real-time data visualization (dashboard charts/metrics)
- Product, order, and user management screens
- Role-based access control (admin vs. regular user)
- Secure authentication (JWT-based)
- Performance optimization (caching, pagination)
- Automated backups

## Originally planned technology stack

- **Frontend (admin dashboard):** React + TailwindCSS + Chart.js, living in a `client/` folder inside this repo
- **Backend:** Node.js + Express + MongoDB (Mongoose)
- **Security:** JWT auth, Helmet, rate limiting, Mongo sanitization, XSS cleaning, HPP protection
- **Performance:** Redis caching, paginated "advanced results" queries
- **Media:** Cloudinary for product image uploads
- **Email:** Nodemailer + Pug templates, with SendGrid in production for password-reset email
- **Real-time:** Socket.io, for pushing live dashboard updates to connected admin clients

## Originally planned installation flow (per README)

1. Clone the repo
2. `npm install` from root, then `cd client && npm install`
3. Create a `.env` file from a `.env.example` (never actually added — see gaps)
4. `npm run dev` from the root to run frontend + backend together

## What this plan assumed that didn't hold up

The plan assumed the `client/` React dashboard would be developed and committed alongside the backend in the same repo, with a working root-level dev script orchestrating both halves. In practice (see `status.md`), the `client/` folder was never committed as real code — it exists only as a dangling git submodule reference — and the root-level `npm run dev` workflow described above does not exist in the committed `package.json`. The original plan is being formally superseded by a decision to rebuild the frontend from scratch (see `roadmap.md` and `status.md`).


## Cross-project feature parity audit (Aug 2026)

A cross-project review (GnG Express, DripWiz, Bree's Beauty Luxe, all under Carlnewton-star) compared frontend, backend, dashboard, and super-admin layers to find features one project has that another lacks. Gaps found in DripWiz that a sibling project has, worth a decision here:

**No admin dashboard at all, anywhere — importance: critical.** This is actually a regression from the original scope above, which explicitly planned client/ as an admin dashboard. What got built instead (this session) is a customer storefront in client/ — no admin routes, no admin controllers, no admin frontend pages exist anywhere in the repo. The User model has a role field with an admin enum value, but nothing reads or enforces it; nobody promoted to admin in the database has any interface to use that role. Both GnG and Bree's have a working dashboard; DripWiz has none. This is the single biggest structural gap versus both sibling projects.

**No checkout flow and no payment gateway — importance: critical.** The frontend has a Cart page but nothing after it — no Checkout page or component anywhere in client/src. The backend has no payment routes and paymentMethod is an unused stripe/paypal enum with no gateway wired in (already flagged in status.md). Bree's has a full M-Pesa flow via IntaSend. Right now a DripWiz customer cannot complete a purchase end to end.

**No stock ledger or supplier tracking — importance: moderate.** DripWiz does correctly decrement stock atomically per order inside a transaction, which is a real strength on par with Bree's guarantee against overselling. What it lacks versus Bree's is any movement history, supplier tracking, or low-stock alerting — worth revisiting once real inventory volume grows, not urgent at current catalog size.

**No RBAC beyond the unused role field — importance: low for now, design it alongside the dashboard.** Bree's has owner/manager/stylist with route-level enforcement. DripWiz has no dashboard to gate yet, so this has no user-facing impact today, but the role model should be designed together with the dashboard rather than bolted on afterward.

Not a gap, just noted for awareness: DripWiz already has a Review model with a working controller and routes, and an email pipeline that is coded end to end (just not configured with real SMTP/SendGrid credentials yet) — both ahead of GnG, which has neither.
