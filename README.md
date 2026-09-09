/

Readme · MD

# OmarDTF — Monorepo Project README

> Custom DTF Transfers & Personalized Apparel platform for Omar's clothing business (Redwood City, CA).

---

## Project Decisions (Survey)

### Q1: Backend Stack

**Chosen: Next.js frontend + separate Hono API backend**

Why Hono over Express:

- TypeScript-first (Express needs extra setup)
- Runs on Node, Deno, Bun, and edge runtimes — no rewrites needed
- Lighter and faster than Express for API-only servers
- Built-in Zod validation support

### Q2: Dev Environment

- OS: Windows with WSL2 (Ubuntu)
- Node: v24.18.0 (latest)
- npm: v12.0.1
- pnpm: v11.25.0 (workspace manager)
- Claude CLI: v2.1.261
- Editor: VS Code with WSL remote

### Q3: Order Flow Features (Full Scope)

1. **Browse catalog + add to cart + checkout** — standard e-commerce
2. **Custom design upload** — customer uploads PNG/JPG of their design
3. **Quote request form** — for bulk/business orders (like branded business shirts)
4. **Admin panel (Omar-only)** — private login, order queue, mark orders complete
5. **Sales dashboard** — revenue tracking, orders waiting, cash income log
6. **Financial AI bot** — helps Omar with pricing, revenue insights, business decisions
7. **Consumer design assistant bot** — helps customers describe and refine their custom design
8. **Automated quote/comms bot** — replies to quote requests and customer queries via text or call when Omar is busy

---

## Tech Stack

| Layer           | Technology                                      | Why                                               |
| --------------- | ----------------------------------------------- | ------------------------------------------------- |
| Monorepo        | Turborepo + pnpm workspaces                     | Run all apps in parallel, caching for fast builds |
| Frontend        | Next.js 15 (App Router) + TypeScript + Tailwind | SEO, SSR, file-based routing                      |
| Backend API     | Hono + TypeScript                               | Lightweight, TypeScript-native, runs anywhere     |
| Admin Dashboard | Next.js 15 + TypeScript + Tailwind              | Shared stack with frontend                        |
| Database        | PostgreSQL via Supabase + Prisma ORM            | Typed queries, free tier, hosted                  |
| Auth            | Clerk                                           | Omar's admin login + customer accounts            |
| Payments        | Stripe                                          | Credit card, Apple Pay, Link, Klarna (via Stripe) |
| File Upload     | Cloudinary                                      | Design image uploads, CDN delivery                |
| AI Agents       | Anthropic Claude API                            | Financial bot, design assistant, quote bot        |
| SMS/Calls       | Twilio                                          | Automated quote replies, IVR when Omar is away    |
| Email           | Resend                                          | Order confirmations, quote replies                |
| Deployment      | Vercel (frontend + admin) + Railway (API)       | Free tiers, easy deploys                          |

---

## Monorepo Structure

```
omardtf/
├── apps/
│   ├── frontend/          ← Customer storefront (Next.js 15)
│   │   └── app/
│   │       ├── page.tsx              ← Homepage / hero
│   │       ├── catalog/page.tsx      ← Product listings + filter
│   │       ├── product/[id]/page.tsx ← Product detail + design upload
│   │       ├── cart/page.tsx         ← Cart
│   │       └── checkout/page.tsx     ← Stripe payment
│   │
│   ├── api-backend/       ← Hono REST API
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── products.ts
│   │       │   ├── orders.ts
│   │       │   ├── quotes.ts
│   │       │   └── webhooks.ts  ← Stripe webhooks
│   │       └── agents/
│   │           ├── financial.ts        ← Financial AI bot
│   │           ├── design-assistant.ts ← Consumer design bot
│   │           └── quote-bot.ts        ← Auto-quote bot
│   │
│   └── admin/             ← Omar's private dashboard (Next.js 15)
│       └── app/
│           ├── dashboard/  ← Sales overview + revenue chart
│           ├── orders/     ← Order queue, mark complete
│           ├── quotes/     ← Quote inbox + AI draft replies
│           └── products/   ← Add/edit products
│
├── packages/
│   ├── shared-types/      ← TypeScript interfaces (Product, Order, Quote...)
│   ├── ui-components/     ← Shared React components
│   └── eslint-config/     ← Shared ESLint rules
│
├── turbo.json             ← Task orchestration config
├── pnpm-workspace.yaml    ← Workspace definition
└── package.json           ← Root scripts (pnpm dev = starts everything)
```

---

## Build Phases

### Phase 1 — Core E-Commerce (Prompts 1–6)

- [x] Prompt 1: Shared TypeScript types in packages/shared-types
- [x] Prompt 2: Frontend homepage (hero, product grid)
- [x] Prompt 3: Catalog + product detail pages + design upload
- [x] Prompt 4: Cart state with Zustand
- [x] Prompt 5: Hono API backend with mock data
- [x] Prompt 6: Connect frontend to API

### Phase 2 — Payments (Prompts 7–9)

- [x] Prompt 7: Stripe setup (API keys, payment intent)
- [ ] Prompt 8: Checkout page with Stripe Elements (card + Apple Pay)
- [ ] Prompt 9: Klarna + Stripe webhook for order confirmation

### Phase 3 — Admin Dashboard (Prompts 10–13)

- [ ] Prompt 10: Supabase + Prisma database setup
- [ ] Prompt 11: Admin app with Clerk auth (Omar-only login)
- [ ] Prompt 12: Orders queue + status management
- [ ] Prompt 13: Sales dashboard (revenue chart, cash tracker)

### Phase 4 — AI Agents (Prompts 14–17)

- [ ] Prompt 14: Financial bot (Claude API, reads DB data)
- [ ] Prompt 15: Consumer design assistant (embedded chat on product page)
- [ ] Prompt 16: Quote bot (AI drafts quote replies)
- [ ] Prompt 17: Twilio SMS bot (auto-replies to texts)

---

## Key TypeScript Concepts (Learned Along the Way)

| Concept      | Where You See It                                       |
| ------------ | ------------------------------------------------------ |
| Interfaces   | packages/shared-types — defines Product, Order shape   |
| Enums        | OrderStatus (PENDING/IN_PROGRESS/READY/DELIVERED)      |
| Generics     | API client: `fetch<Product[]>('/products')`            |
| Async/Await  | All API calls and DB queries                           |
| Zod          | API request body validation                            |
| Type imports | `import type { Product } from '@omardtf/shared-types'` |

---

## How Turbo Works (Quick Reference)

```bash
pnpm dev        # starts ALL apps in parallel (frontend + api + admin)
pnpm build      # builds all apps (skips unchanged ones via cache)
pnpm lint       # lints all packages

# Run just one app:
pnpm --filter frontend dev
pnpm --filter api-backend dev
```

Turbo reads turbo.json to know the task graph — which tasks depend on which. It builds packages/shared-types first (because both apps depend on it), then starts the apps.

---

## Environment Variables Needed

```
# apps/frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# apps/api-backend/.env
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ANTHROPIC_API_KEY=sk-ant-...
CLOUDINARY_URL=cloudinary://...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
RESEND_API_KEY=re_...

# apps/admin/.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

_Built by Pratik — CS grad UC Santa Cruz '26. Full-stack monorepo with AI agents for Omar DTF._
