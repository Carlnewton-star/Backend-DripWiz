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
