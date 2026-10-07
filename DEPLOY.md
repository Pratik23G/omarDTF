# Deploy

API on Railway (needs a persistent volume for SQLite), frontend on Vercel.

## 1. API → Railway

1. New Project → Deploy from GitHub repo. Leave the root directory as the **repo root** (the API depends on `packages/shared-types`); `railway.json` sets the build/start commands.
2. Add a **Volume** to the service, mount path `/data`.
3. Variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | exact Vercel URL, e.g. `https://omardtf.vercel.app` (no trailing slash) |
| `DATABASE_PATH` | `/data/data.db` |
| `STRIPE_SECRET_KEY` | live secret key (same mode as the publishable key) |
| `STRIPE_WEBHOOK_SECRET` | from step 3 below |
| `GEMINI_API_KEY` | Google AI Studio key |
| `DATABASE_URL` | Supabase pooled connection string (transaction pooler, port 6543) |
| `DIRECT_URL` | Supabase direct connection string (port 5432); migrations run from this on every start |
| `CLERK_SECRET_KEY` | Clerk secret key (same Clerk app as the admin site) |
| `ADMIN_EMAILS` | comma-separated emails allowed into admin, e.g. `omar@example.com` |

Railway injects `PORT`. Settings → Networking → Generate Domain, then check `https://<domain>/` returns `{"status":"ok"}`.

## 2. Frontend → Vercel

1. Import the repo, set **Root Directory** to `apps/frontend`, enable "Include source files outside of the Root Directory".
2. Variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Railway domain, e.g. `https://omardtf-api.up.railway.app` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | live publishable key |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | optional, digits only |

3. Redeploy after changing `NEXT_PUBLIC_*` (they are baked in at build time).
4. Put the final Vercel URL back into Railway's `FRONTEND_URL`.

## 3. Admin → Vercel (second project)

Import the same repo again, **Root Directory** `apps/admin`, same "include files outside root" setting. Variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `API_URL` | Railway domain (server-side only) |

In Clerk: disable public sign-ups (Configure → Restrictions → Sign-up mode: Restricted) and invite only Omar. Even if someone signs up, the API only serves emails in `ADMIN_EMAILS`.

## 4. Stripe webhook

Dashboard → Developers → Webhooks → Add endpoint `https://<railway-domain>/webhooks/stripe`, events `payment_intent.succeeded` and `payment_intent.payment_failed`. Copy the signing secret into Railway as `STRIPE_WEBHOOK_SECRET`.

## Smoke test

Admin sign-in works and the order from the test payment appears in Orders, status buttons update it, dashboard totals match. Home and catalog load, product page shows reviews, fit check returns a result, a real small card payment completes and refunds.
