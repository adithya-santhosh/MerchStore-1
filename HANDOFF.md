# Outstanding Work — MerchStore

Snapshot at commit `dcf19be`. Written as a handoff so a fresh session can pick
up without re-deriving context. Delete once the list is worked through.

---

## 0. FIRST: the working tree has uncommitted work from another session

`git status` shows a large in-progress refactor that is **not mine and not
committed**. Resolve this before starting anything else, or you risk losing it
or committing something half-finished.

It appears to be a test reorganisation:

- Backend tests **moved** from `backend/src/**/*.test.ts` → `backend/test/**`
  (shows as deletions + untracked `backend/test/` directories)
- New frontend tests: `frontend/src/lib/{api,seo,utils}.test.ts`,
  `frontend/src/middleware.test.ts`, `frontend/src/utils/cookie.test.ts`
- New `frontend/vitest.config.mts` + changes to `frontend/package.json`
- Modified: `.github/workflows/ci.yml`, `backend/tsconfig.json`,
  `backend/vitest.config.ts`, `backend/src/services/analytics.service.ts`
- Modified `backend/src/middleware/validation.middleware.ts` — contains a real
  bug fix worth keeping: `updateCouponSchema` used `.partial()`, which keeps
  field defaults, so `isActive: true` was injected into every partial update
  and silently reactivated deactivated coupons on any edit.

Also untracked: `DEPLOYMENT.md` (predates this work).

**Action:** review, then commit or discard. Verify `npm test` in both packages
after, since the test paths moved.

---

## 1. Blocked on you, not on code

These gate the launch and no amount of coding moves them.

### Razorpay live activation
`frontend/src/lib/site-config.ts` is still full of `[Square Bracket]`
placeholders and they **render literally on the public policy pages**. Razorpay
checks these during live-account review, and review takes days.

Fill in: `legalName`, `entityType`, `domain`, `address.*`, `supportEmail`,
`supportPhone`, `grievanceOfficer.*`, `gstin`, `jurisdictionCity`.

### Environment variables

**Render (backend)**
| Var | Value | Why |
|---|---|---|
| `NODE_ENV` | `production` | Drives cookie `Secure`, log level, **and** the proxy-trust default |
| `TRUST_PROXY_HOPS` | `2` | Render fronts services with Cloudflare = 2 hops. Verified against the live service. Without it, rate-limit buckets scatter |
| `FRONTEND_URL` | your domain | Otherwise password-reset emails link to `localhost` |
| `RESEND_API_KEY` | from Resend | **Without it no email sends at all** — reset + verification silently do nothing |
| `EMAIL_FROM` | verified sender | |
| `COOKIE_SAMESITE` | `lax` — *only after* the API is on a subdomain of the storefront domain | |

**Vercel (frontend)**
| Var | Note |
|---|---|
| `NEXT_PUBLIC_API_URL` | no trailing slash |
| `NEXT_PUBLIC_SITE_URL` | else canonical/OG URLs resolve to localhost |
| `JWT_SECRET` | **must exactly match Render's, no `NEXT_PUBLIC_` prefix**. If wrong, every `/admin` and `/dashboard` route redirects to login forever and looks like broken auth |

`NEXT_PUBLIC_*` are baked in at build time — changing them requires a redeploy.

### Domain / DNS
Point `api.<domain>` → Render and `www.<domain>` → Vercel. Same registrable
domain makes them same-site, which is what lets `COOKIE_SAMESITE=lax` work and
removes the Safari/iOS "randomly signed out" class of bug. Then set
`ALLOWED_ORIGIN` on Render to the real domain.

### Render free tier
Sleeps after ~15 min idle; first visitor waits ~50s. Upgrade before launch.

---

## 2. Known defects, highest value first

### 🔴 Paid membership delivers nothing
`/rewards` sells a ₹999 lifetime membership promising *"automatic 10% off on all
accessories… no minimum purchase"*, and `/register` advertises *"10% off
storewide"*.

**`isMember` is checked nowhere in the pricing path** — not in
`order.service.ts`, `cart.service.ts`, or `coupon.service.ts`. Members pay and
receive nothing, forever.

Fix in `prepareCheckout` (`backend/src/services/order.service.ts`) alongside the
coupon logic; the existing tests there give a good harness. Decide whether the
member discount stacks with coupons.

### 🟠 Newsletter silently discards every signup
`frontend/src/components/NewsletterCTA.tsx:19` is a `setTimeout` that shows
"success" and throws the address away. Needs a real endpoint + storage.

### 🟠 Contact form is mailto-only
`frontend/src/app/contact/page.tsx` opens the visitor's mail client. Many people
have none configured, so those messages never arrive. Needs a backend endpoint.

---

## 3. Operational gaps for a real store

- **GST invoices** — legally required for B2C sales in India, and prices are
  tax-inclusive so GST is owed. Nothing generates an invoice today.
- **Monitoring** — structured `pino` logs exist but go nowhere. Sentry or
  similar; needs an account.
- **Shipping integration** — tracking numbers are typed in by hand
  (Shiprocket/Delhivery would automate).
- **Refunds are record-only** — `PATCH /api/orders/admin/:id/refund` marks a
  refund settled but moves no money; the actual refund is manual in the Razorpay
  dashboard. Wiring the Razorpay refund API is deliberate remaining work (it was
  left out because it moves real money and can't be tested without live keys).

---

## 4. Frontend lint: 18 errors, 32 warnings

`npm run lint` in `frontend/`. Down from 90 errors. **Lint is commented out of
CI** (`.github/workflows/ci.yml`) and should stay out until errors reach 0.

All genuine defects are already fixed (a `rules-of-hooks` crash, two components
remounting every render, a temporal-dead-zone reference, two mirrored-state
double-renders).

**What remains is one pattern, ~9 times:**

```js
useEffect(() => {
  setLoading(true);        // ← react-hooks/set-state-in-effect flags this
  fetchThing().then(setData).finally(() => setLoading(false));
}, [dep]);
```

In `RelatedProducts`, `ProductsExplorer`, `useAuth`, `vendor/dashboard`,
`admin/orders`, `admin/settings`, `admin/vendors`, `ProductReviews`,
`checkout/confirmation`. The other ~9 are reset-on-open and form-prefill
effects (`SearchOverlay`, `ProductForm`, `EditProductForm`, `dashboard`,
`checkout`).

**Three options — this is a judgement call, not a mechanical fix:**
1. Adopt SWR / React Query / server components. Real improvement, clears ~9,
   meaningful refactor.
2. Downgrade `react-hooks/set-state-in-effect` to `warn` in the ESLint config
   with a written rationale. Gets errors to ~9 and lets CI enable lint. Fine if
   deliberate and documented — not if hidden.
3. Leave it; lint stays out of CI.

Do **not** contort working fetch code just to satisfy the rule — it adds risk
for no user-facing gain.

The 32 warnings are mostly `@next/next/no-img-element` (20) — converting to
`next/image` would also shave the last ~273 KiB Lighthouse flags.

---

## 5. Performance — mostly done

Lighthouse went **56 → 87** (assets ~17 MB → 1.9 MB). Since that report,
LCP-discovery, the expected-401 console error, and AA contrast were also fixed,
so **re-run Lighthouse in Incognito against a production build** to get a true
current number — expect Best Practices 100 and Accessibility ~98–100.

Remaining: ~273 KiB of image savings (responsive sizes / `next/image`).

---

## 6. Test-data left in the Neon database

- `testcookie@example.com` — password `NewPass12345`, `emailVerified: true`
- Order `ORD-2026-23117` — cancelled, payment marked `REFUNDED`, stock restored

Both are mine from verification. Safe to delete.
