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

## 3. Stripe webhook

Dashboard → Developers → Webhooks → Add endpoint `https://<railway-domain>/webhooks/stripe`, events `payment_intent.succeeded` and `payment_intent.payment_failed`. Copy the signing secret into Railway as `STRIPE_WEBHOOK_SECRET`.

## Smoke test

Home and catalog load, product page shows reviews, fit check returns a result, a real small card payment completes and refunds.
