# Go-Live Checklist

Taking MerchStore from localhost to a real domain. Written for this repo
specifically: `frontend/` is a Next.js 16 app (→ Vercel), `backend/` is an
Express 5 + Prisma API (→ Render), Postgres behind it.

Work through the phases in order. Phase 0 decides everything downstream, so
don't skip it.

---

## Phase 0 — Decide the domain layout first

This single choice determines your cookie settings, your CORS config, and
whether logging in even works in production. Two options:

| | Layout | Cookie mode | Verdict |
|---|---|---|---|
| **A** | `www.example.com` (Vercel) + `api.example.com` (Render) | `SameSite=Lax` | **Use this.** Same registrable domain = browsers treat it as one site. |
| **B** | `example.com` (Vercel) + `merchstore-api.onrender.com` (Render) | `SameSite=None` | Works today, but Safari ITP and Chrome's third-party-cookie phase-out will randomly sign users out. |

- [ ] Commit to **Layout A**: storefront on `www.<yourdomain>`, API on `api.<yourdomain>`
- [ ] Pick which is canonical for the storefront — `www.example.com` or bare `example.com` — and plan to 301 the other to it (Vercel does this for you)

The code already anticipates this: see the notes in
[auth-cookie.ts](backend/src/lib/auth-cookie.ts) and
[.env.example](backend/.env.example).

---

## Phase 0.5 — Three repo issues to fix before launch

Found while reading the code. The first one will lock you out of your own admin
panel, so handle it during Phase 9.

- [ ] **Auth cookie is invisible to Next.js middleware.** The backend sets `token`
      as a host-only cookie on the API host, but
      [middleware.ts:23](frontend/src/middleware.ts:23) reads `token` from
      requests to the *frontend* host. It will never be there → `/admin/*` and
      `/dashboard` redirect to `/login` forever, and logged-in users still see
      `/login`. **Fix:** give the cookie a `domain` so both hosts receive it. In
      [auth-cookie.ts](backend/src/lib/auth-cookie.ts), add to
      `AUTH_COOKIE_OPTIONS`:

      domain: process.env.COOKIE_DOMAIN || undefined,

      Then set `COOKIE_DOMAIN=.example.com` on Render. This only works under
      Layout A — one more reason for it.

- [x] **CORS wildcard is too wide for a credentialed API.** ~~[app.ts:82](backend/src/app.ts:82)
      auto-allows any `*.vercel.app` origin while `credentials: true` is on.~~
      Fixed: the wildcard is gone. Origins now have to be listed explicitly in
      `ALLOWED_ORIGIN` (comma-separated), same as any other origin — add your
      Vercel preview URLs there if you need them to hit the API before
      promoting to production.

- [ ] **README documents the wrong `NEXT_PUBLIC_API_URL`.** The root
      [README.md](README.md) says `http://localhost:5000/api`, but every call site
      appends `/api/...` itself (see [api.ts:4](frontend/src/lib/api.ts:4)). The
      value must be **origin only** — no `/api` suffix — or every request 404s at
      `/api/api/...`.

---

## Phase 1 — Buy the domain

- [ ] Choose a registrar — Cloudflare Registrar (at-cost, no markup, but you must
      use Cloudflare DNS), Namecheap, Porkbun, or GoDaddy. For an India-facing
      store `.in` and `.com` are both fine; `.com` travels better
- [ ] Search and register the name (1–2 years; auto-renew ON)
- [ ] Turn on **WHOIS / domain privacy** — free at most registrars, keeps your
      home address out of public WHOIS
- [ ] Verify the registrant email (ICANN suspends unverified domains after ~15 days)
- [ ] Enable registrar lock / transfer lock
- [ ] Turn on 2FA at the registrar. Losing this account means losing the domain

---

## Phase 2 — Decide where DNS lives

- [ ] **Option A — registrar's own DNS.** Simplest. Fine if you just need records
      pointing at Vercel and Render
- [ ] **Option B — Cloudflare DNS (recommended).** Free, fast, and leaves the door
      open to WAF/bot protection later. Setup:
  - [ ] Create a Cloudflare account → **Add a site** → enter your domain
  - [ ] Pick the **Free** plan
  - [ ] Cloudflare scans and imports existing records — review the list
  - [ ] Copy the two Cloudflare nameservers it gives you
  - [ ] At your registrar, replace the nameservers with Cloudflare's
  - [ ] Wait for Cloudflare to show **Active** (minutes to ~24h)

> Nameserver changes are the slowest step in this whole document. Start Phase 2
> early and do Phases 3–5 while you wait.

---

## Phase 3 — Production database

Prisma reads `DATABASE_URL` at runtime via the `pg` driver adapter
([prisma.ts:5](backend/src/lib/prisma.ts:5)) and for migrations
([prisma.config.ts](backend/prisma.config.ts)).

- [ ] Create a managed Postgres — Render Postgres (same region as the API, lowest
      latency), Neon, or Supabase
- [ ] **Check the free tier's terms before relying on it.** Render's free database
      is time-limited; a store's data should not sit on an expiring instance.
      Budget for the paid tier
- [ ] Pick the region closest to your customers, and put the API in the **same region**
- [ ] Copy the connection string. If the DB and API are both on Render, use the
      **Internal** URL for `DATABASE_URL` — faster and not exposed to the internet
- [ ] Confirm SSL is required on any external URL (`?sslmode=require`)
- [ ] After the API deploys, run migrations: `npx prisma migrate deploy`
      (Render Shell, or append it to the build command)
- [ ] Create your admin user in the production DB — register through the live
      site, then flip that row's `role` to `ADMIN` with a SQL client
- [ ] Turn on automated backups and note the retention window

---

## Phase 4 — Backend on Render

- [ ] New → **Web Service** → connect the GitHub repo
- [ ] **Root Directory:** `backend`
- [ ] **Runtime:** Node
- [ ] **Build Command:** `npm ci && npm run build`
      (if it fails with `tsc: not found`, dev dependencies were skipped — use
      `npm ci --include=dev && npm run build`)
- [ ] **Start Command:** `npm start`
- [ ] **Health Check Path:** `/health` — the route already exists
      ([app.ts](backend/src/app.ts))
- [ ] **Instance type:** not Free. Free instances spin down when idle, so the
      first customer of the hour waits ~50s for a cold start
- [ ] Region: same as the database
- [ ] Add environment variables:

| Variable | Production value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | internal connection string from Phase 3 |
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `ALLOWED_ORIGIN` | `https://www.example.com` (comma-separate extras) |
| `FRONTEND_URL` | `https://www.example.com` — builds password-reset links |
| `COOKIE_SAMESITE` | `none` for now; → `lax` in Phase 9 |
| `COOKIE_DOMAIN` | `.example.com` — after the Phase 0.5 code change |
| `TRUST_PROXY_HOPS` | `2` on Render; `3` if you proxy the API through Cloudflare |
| `RESEND_API_KEY` | from Resend (Phase 10) |
| `EMAIL_FROM` | `MerchStore <noreply@example.com>` after domain verification |
| `RAZORPAY_KEY_ID` / `RAZORPAY_SECRET` | **live** keys (Phase 10) |
| `CLOUDINARY_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from the Cloudinary console (Dashboard > Account Details) — without all three, the admin image uploader answers 503 but the rest of the app still runs |
| `SENTRY_DSN` | optional — from your Sentry project's Client Keys settings. Omit and error tracking is just a no-op, nothing else breaks |

- [ ] Do **not** set `PORT` — Render provides it and
      [server.ts](backend/src/server.ts) already reads it
- [ ] Deploy, then verify: `curl https://<service>.onrender.com/health` → `{"status":"ok",...}`
- [ ] Check the logs for the startup line and no `FATAL:` guard trips

---

## Phase 5 — Frontend on Vercel

- [ ] New Project → import the same GitHub repo
- [ ] **Root Directory:** `frontend` (otherwise Vercel builds the repo root and fails)
- [ ] Framework preset: **Next.js**. Leave build/output settings at defaults
- [ ] Add environment variables (Production scope):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.example.com` — **origin only, no `/api`** |
| `JWT_SECRET` | **byte-identical** to the backend's. No `NEXT_PUBLIC_` prefix |
| `NEXT_PUBLIC_SITE_URL` | `https://www.example.com` — canonical/OG URLs; falls back to `localhost` if unset |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | optional — same Sentry project as the backend's `SENTRY_DSN`. `SENTRY_DSN` covers server-side rendering errors, `NEXT_PUBLIC_SENTRY_DSN` covers the browser |

Cloudinary needs nothing here — uploads are signed by the backend
(`CLOUDINARY_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` in Phase 4),
not an unsigned preset baked into this bundle.

- [ ] `JWT_SECRET` is what [middleware.ts](frontend/src/middleware.ts) uses to
      verify the admin role at the edge. If it differs from the backend's by even
      one character, every admin request silently redirects to `/login`
- [ ] Remember: `NEXT_PUBLIC_*` values are **baked in at build time**. Changing one
      requires a redeploy, not just a save
- [ ] Deploy and confirm the `.vercel.app` URL renders the storefront

---

## Phase 6 — Point the domain at Vercel and Render

Use the exact record values each dashboard shows you — they occasionally change
and the dashboard is authoritative.

**Storefront (Vercel):**
- [ ] Vercel → Project → Settings → Domains → add `example.com` **and** `www.example.com`
- [ ] Vercel nominates one as primary and redirects the other — match your Phase 0 choice
- [ ] Add the records at your DNS host (typical values):
  - `A` @ → `76.76.21.21`
  - `CNAME` www → `cname.vercel-dns.com`
- [ ] **On Cloudflare, set both records to DNS only (grey cloud)** — see Phase 8
- [ ] Wait for Vercel to show **Valid Configuration**

**API (Render):**
- [ ] Render → Service → Settings → Custom Domains → add `api.example.com`
- [ ] Add `CNAME` api → `<your-service>.onrender.com`
- [ ] Grey cloud on Cloudflare here too, at least until certificates are issued
- [ ] Wait for Render to show the domain verified

**Verify resolution:**

```bash
nslookup www.example.com
```

- [ ] Both `www` and `api` resolve to the expected targets before moving on

---

## Phase 7 — Certificates (HTTPS)

You don't buy a certificate. Both platforms issue and renew Let's Encrypt certs
automatically once DNS points at them.

- [ ] Vercel shows a valid certificate for `example.com` and `www.example.com`
- [ ] Render shows a valid certificate for `api.example.com`
- [ ] If issuance hangs: the record is probably proxied (orange cloud), or DNS
      hasn't propagated. Grey-cloud it and retry
- [ ] If you have (or add) a **CAA** record, it must permit `letsencrypt.org` or
      issuance fails silently. No CAA record = no restriction, which is fine
- [ ] Confirm HTTP redirects to HTTPS on both hosts:

```bash
curl -sI http://www.example.com
```

- [ ] Renewal is automatic — nothing to diary

---

## Phase 8 — Cloudflare settings (only if you proxy)

The orange cloud is optional. **Grey cloud (DNS only) is the safe default** for
both Vercel and Render — you still get Cloudflare's DNS, and you avoid stacking a
second CDN on two platforms that already have one.

If you do enable the proxy on `api.example.com`:

- [ ] SSL/TLS → Overview → set encryption mode to **Full (strict)**. *Flexible*
      causes infinite redirect loops and sends plaintext to your origin
- [ ] Edge Certificates → **Always Use HTTPS** on
- [ ] Set `TRUST_PROXY_HOPS=3` on Render — your Cloudflare, then Render's
      Cloudflare, then Render's router. Wrong values either scatter rate-limit
      buckets or let clients forge `X-Forwarded-For`; the tradeoff is documented
      in [app.ts](backend/src/app.ts)
- [ ] Add a cache rule to **bypass cache** for `api.example.com/*` — a cached
      `/api/cart` served to the wrong customer is a real incident
- [ ] Leave **Bot Fight Mode off** initially; it can challenge legitimate API
      traffic and payment callbacks
- [ ] Consider HSTS only once everything is stable on HTTPS — start with a short
      max-age, and understand browsers will then refuse plain HTTP for your domain
      for that whole duration

Proxying `www.example.com` in front of Vercel costs you accurate Vercel analytics
and adds two-CDN caching puzzles to debug. Not worth it at launch.

---

## Phase 9 — Cut the app over to the real domain

Once both custom domains resolve with valid certificates:

- [ ] Apply the `COOKIE_DOMAIN` code change from Phase 0.5 and deploy the backend
- [ ] Render: `ALLOWED_ORIGIN=https://www.example.com`
- [ ] Render: `FRONTEND_URL=https://www.example.com`
- [ ] Render: `COOKIE_DOMAIN=.example.com`
- [ ] Render: **`COOKIE_SAMESITE=lax`** — the whole point of Layout A. Your auth
      cookie stops being a third-party cookie and stops being subject to browser
      privacy purges
- [ ] Render: narrow the CORS `.vercel.app` wildcard (Phase 0.5)
- [ ] Vercel: `NEXT_PUBLIC_API_URL=https://api.example.com` → **redeploy**
- [ ] Log in on the live site and confirm the `token` cookie shows
      `Domain=.example.com`, `Secure`, `HttpOnly`, `SameSite=Lax` under DevTools →
      Application → Cookies
- [ ] Confirm `/admin/products` loads for an admin and redirects for a customer

---

## Phase 10 — Third-party services on the real domain

**Razorpay (live mode):**
- [ ] Complete KYC / business verification — this takes days, start early
- [ ] Generate **live** API keys, set them on Render, redeploy
- [ ] Add `https://www.example.com` to authorised domains
- [ ] Point any webhook at `https://api.example.com/api/payment/...` and store the
      webhook secret
- [ ] Run one real low-value transaction end to end, then refund it

**Resend (transactional email):**
- [ ] Add and verify `example.com` in Resend — it gives you DKIM/SPF records to add
      at your DNS host (do it while you're already in the DNS panel)
- [ ] Once verified, set `EMAIL_FROM="MerchStore <noreply@example.com>"`
- [ ] `onboarding@resend.dev` only delivers to your own address — leaving it set
      means **customers never receive password resets**
- [ ] Add a `DMARC` TXT record (`v=DMARC1; p=none; rua=mailto:you@example.com`) so
      your mail isn't binned as spam
- [ ] Trigger a real password reset and confirm the link points at your domain,
      not localhost

**Cloudinary:**
- [x] ~~Confirm the unsigned upload preset is restricted...~~ Fixed: there's no
      unsigned preset anymore. Uploads are now signed server-side
      (`CLOUDINARY_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET`, Phase 4) —
      only an authenticated admin can obtain a signature, and it locks in the
      destination folder and an image-format whitelist. Just confirm those three
      env vars are set on Render, from the Cloudinary console's Dashboard > Account
      Details.

---

## Phase 11 — Pre-launch polish

- [ ] Add `metadataBase: new URL("https://www.example.com")` to
      [layout.tsx](frontend/src/app/layout.tsx) — without it, Open Graph and
      canonical URLs resolve against localhost
- [ ] Improve the default `title` / `description` — currently just "MerchStore"
- [ ] Add `frontend/src/app/robots.ts` and `sitemap.ts` (neither exists yet)
- [ ] Replace the default `favicon.ico` and add an OG share image
- [x] ~~Add `frontend/.env.example` documenting the four frontend variables...~~
      Fixed: [frontend/.env.example](frontend/.env.example) now documents all five
      (the Sentry pair was added alongside error tracking).
- [ ] Fix the `NEXT_PUBLIC_API_URL` line in [README.md](README.md)
- [ ] Confirm the policy pages (privacy, terms, refund, shipping) name your real
      business and are linked in the footer — payment gateways check for these
- [ ] Rotate `JWT_SECRET` and every API key if any of them ever sat in a commit or
      a shared chat

---

## Phase 12 — Smoke test on the live domain

Run these as a real customer would, in a fresh incognito window:

- [ ] Home page loads over HTTPS with no mixed-content or CORS errors in console
- [ ] Product listing and a product detail page render
- [ ] Register a new account → welcome email arrives
- [ ] Log out, log back in → stays logged in across a full page reload
- [ ] Add to cart → cart survives a reload
- [ ] Checkout with COD → order appears in the account dashboard
- [ ] Checkout with Razorpay live → payment succeeds, order recorded (then refund)
- [ ] Forgot password → email arrives, link works, new password works
- [ ] Admin login → product create/edit, Cloudinary image upload, order view
- [ ] A non-admin hitting `/admin/products` is redirected
- [ ] `https://api.example.com/health` returns ok
- [ ] Test on a real phone, and on Safari specifically — it's strictest about cookies

---

## Phase 13 — After launch

- [ ] Uptime monitor on `https://api.example.com/health` and on the storefront
      (UptimeRobot, Better Stack — both have a free tier). `/health` now checks
      the database too ([app.ts](backend/src/app.ts)), returning `503` rather
      than a bare `200` when Postgres is unreachable — point the monitor at
      `/health` itself, not just a TCP/ping check, so a DB outage actually
      pages someone instead of looking like "server's up, fine."
- [ ] Confirm database backups actually ran, and restore one to a scratch DB once
- [ ] Error tracking (Sentry) on both apps — the code side is done
      (`@sentry/node` on the backend, `@sentry/browser` + Next's
      `instrumentation.ts`/`instrumentation-client.ts` on the frontend; see
      [sentry.ts](backend/src/lib/sentry.ts)). Create a Sentry project and set
      `SENTRY_DSN` (Phase 4) and `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN`
      (Phase 5) to turn it on — until then it runs as a safe no-op
- [ ] CSP violation reporting is wired up already: the frontend's CSP
      ([next.config.ts](frontend/next.config.ts)) reports blocked resources to
      `POST /api/csp-report` ([csp-report.routes.ts](backend/src/routes/csp-report.routes.ts)),
      which logs them and forwards to Sentry once a DSN is set. Worth
      watching for a day or two after launch — a real customer's ad blocker
      or extension can trip false positives, but a pattern from one browser
      or one route usually means the CSP itself is too strict
- [ ] Google Search Console + submit the sitemap
- [ ] Analytics (Vercel Analytics, Plausible, or GA4)
- [ ] Diary the domain renewal date independently of auto-renew
- [ ] Watch Render logs for 429s in week one — if real customers trip the
      120 req/min limit, tune it in [app.ts](backend/src/app.ts)

---

## Quick reference — DNS records

Replace `example.com` with your domain, and use the exact targets your dashboards
display.

| Type | Name | Value | Proxy |
|---|---|---|---|
| A | `@` | `76.76.21.21` (Vercel) | DNS only |
| CNAME | `www` | `cname.vercel-dns.com` | DNS only |
| CNAME | `api` | `<service>.onrender.com` | DNS only |
| TXT/CNAME | (Resend DKIM/SPF) | as provided by Resend | DNS only |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:you@example.com` | — |
