<div align="center">

# SMD Shop

**A complete e-commerce platform for the Uzbek market — with the Payme integration done properly.**

Not a store with a payment button bolted on, but the full stack a real shop needs: the Payme Merchant API implemented to spec, full-text product search, real-time customer chat, behavioural recommendations, coupons, delivery, and an admin back office. Twenty modules, twenty-seven tables, forty-six pages.

[![NestJS](https://img.shields.io/badge/NestJS-11-e0234e?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeORM](https://img.shields.io/badge/TypeORM-0.3-FE0803?style=flat-square)](https://typeorm.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Payme](#payments-payme-merchant-api) · [What it does](#what-it-does) · [Architecture](#architecture) · [Getting started](#getting-started)

</div>

> **What this is.** A portfolio project — a technical showcase of a complete e-commerce stack, not a business. Online retail in Uzbekistan is owned by Uzum and Wildberries, and no amount of engineering changes that. What this demonstrates instead is the engineering itself: the parts of a shop that are genuinely hard to get right, built to work rather than to demo.

---

## Payments (Payme Merchant API)

This is the part most e-commerce demos skip or fake, so it goes first. SMD Shop implements the real [Payme Merchant API](https://developer.help.paycom.uz/) — the JSON-RPC protocol Payme calls on the merchant's server — not a mock.

Two things that protocol gets wrong easily, and this does not:

**Amounts are in tiyin, and the check is exact.** Payme sends money in tiyin — 1 som is 100 tiyin — and a merchant that compares against som is wrong by a factor of a hundred. `CheckPerformTransaction` converts and compares exactly:

```ts
// Payme sends amount in tiyin (1 UZS = 100 tiyin)
const expectedTiyin = Math.round(parseFloat(order.finalAmount) * 100);
if (amount !== expectedTiyin) return this.paymeError(PAYME_ERROR.WRONG_AMOUNT, …);
```

**The transaction state machine is idempotent.** Payme retries — it may call `PerformTransaction` more than once for the same transaction, by design. A naïve handler charges twice or double-fulfils the order. This one checks state first: a transaction already `SUCCESS` returns its completed result unchanged, and a `CANCELLED` one is refused. The retry is safe.

Money is stored as `numeric` throughout — `numeric(12,2)` for prices, `numeric(14,2)` for order totals — never float. Amounts stay exact from the database to the Payme reply.

---

## What it does

**Storefront.** Products with variants, categories, images, reviews and ratings; a cart and wishlist; coupons with usage limits and minimum-order rules; a checkout that creates an order and hands off to Payme.

**Search that actually searches.** Full-text over a PostgreSQL `tsvector` with `ts_rank` relevance — not a `LIKE '%…%'` scan. Results are ranked, not merely filtered.

**Real-time customer chat.** A WebSocket gateway with online-presence tracking, so a customer and a support agent hold a live conversation rather than trading emails.

**Recommendations from behaviour.** "Also viewed" and "recently viewed", driven by what customers actually do rather than a static "related products" list.

**The rest of a real shop.** OTP-based auth with email delivery, JWT access and refresh tokens, delivery options and addresses, the order lifecycle and history, notifications, and an admin surface with analytics.

---

## Architecture

```
smd-shop/
├── backend/          NestJS 11 · ~14,000 lines
│   └── src/
│       ├── modules/          20 feature modules
│       │   ├── payments/         Payme Merchant API
│       │   ├── search/           tsvector + ts_rank
│       │   ├── chat/             WebSocket gateway + presence
│       │   ├── recommendations/  behavioural
│       │   └── … orders · products · cart · coupons · delivery · reviews …
│       ├── database/
│       │   ├── entities/     27 entities
│       │   └── migrations/   real migrations — synchronize is off in production
│       └── config/
├── frontend/         React 19 · Vite · RTK Query · 46 pages
└── render.yaml
```

**Backend** — NestJS 11 with TypeORM over PostgreSQL. Twenty modules, each a clear domain boundary. Money is `numeric`; the schema is versioned in migrations and `DB_SYNCHRONIZE` is `false` in production, so the database is never reshaped by the framework guessing at a diff.

**Frontend** — React 19 on Vite, with RTK Query managing every server interaction — caching, invalidation and refetching handled once rather than re-implemented per component across forty-six pages.

---

## Honest status

Being a showcase rather than a product, this says what is not done as plainly as what is:

- **No tests yet.** The Payme state machine and the money arithmetic are exactly the code that most needs them; that is the first thing this project should grow.
- **Build type-checking is skipped on the frontend deploy** (`vite build` with no preceding `tsc --noEmit`), a shortcut taken to get a Vercel build green. It belongs in CI instead, so a type error fails the build rather than being stepped around.

Neither is hidden, because neither should be. A portfolio is more convincing when it knows its own gaps — and both are written up, with the concurrency and money-precision work they depend on, in [`docs/YAXSHILASH-TZ.md`](./docs/YAXSHILASH-TZ.md) (in Uzbek).

---

## Getting started

**Requirements:** Node 20+ · PostgreSQL 15+

```bash
git clone https://github.com/Sarvarbek0704/smd-shop.git
cd smd-shop
```

**Backend**

```bash
cd backend
npm install
cp .env.example .env          # DATABASE_URL, JWT secrets, PAYME_KEY, SMTP
npm run migration:run
npm run seed                  # demo catalogue
npm run start:dev             # http://localhost:3000
```

**Frontend**

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:3000" > .env.local
npm run dev                   # http://localhost:5173
```

For Payme, `PAYME_KEY` falls back to a mock value so the flow runs locally without real credentials.

---

## License

Proprietary. Built by [Sarvarbek Sodiqov](https://github.com/Sarvarbek0704) as a portfolio project; published for review, not for reuse.
