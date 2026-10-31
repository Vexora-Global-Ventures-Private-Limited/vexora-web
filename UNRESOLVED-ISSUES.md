# Unresolved Issues — vexora-web

Issues found while integrating and reviewing `vexora-web` against the live dev API (`https://vex-dev.up.railway.app`, October 2026) that **cannot be fixed in the frontend**. Every frontend-fixable bug found in the same review has already been fixed on `ganesh-oct-dev`.

Where the frontend could add a guard (validation, double-click locks, per-device fallbacks), it has — but those guards can be bypassed by calling the API directly, so the root fix still belongs where it's listed.

**Owners at a glance**

| Section | Owner |
|---|---|
| A. Backend validation (#1–11) | Backend |
| B. Backend business rules (#12–26) | Backend |
| C. Missing APIs (#27–37) | Backend |
| D. Config, data & docs (#38–45) | Backend / Admin |
| E. Business & legal decisions (#46–55) | Product / Business |
| F. Cleanup awaiting approval (#56–60) | Frontend (needs go-ahead) |

---

## A. Backend validation — the API accepts junk

| # | Problem (verified live) | Needed |
|---|---|---|
| 1 | `PATCH /users/me/profile` accepts a 600-char name, `"   "` as city, `"12345"` as state, `000000` as pincode, any `intent` (e.g. `"astronaut"`) | Server-side validation on all profile fields |
| 2 | `POST /auth/signup` and `/auth/otp/request` accept `+91abc`, `notanemail`, a number without `+91` | Phone (E.164, Indian 6–9 start) and email format validation |
| 3 | `PATCH /listings/:id/steps/*` accepts negative / fractional / huge prices, BHK on a plot, negative area, blank city, junk state & pincode, any title length, `purpose: "lease"` | Validation on every wizard step |
| 4 | Listing media and ad creatives / click-through URLs accept `javascript:` and `http:` URLs, with no count limit (60 photos saved). **Security:** `GET /ad-serving/:id/click` 302-redirects to a stored `javascript:` URL | https-only URL validation, max media count, safe redirect targets |
| 5 | Lead `message`, CRM notes and abuse-report `reason`/`details` have no length limits (5,000-char message accepted) | Server-side length limits |
| 6 | `page=0` / negative page → **500** on `/search` and `/listings/mine`; garbage `cursor` → **500** on `/crm/leads` and `/notifications`; malformed ids → **500** on `/listings/:id`, `/projects/:id` | Validate paging, cursors and ObjectIds; return 400 / 404 |
| 7 | `limit` is uncapped (1,000 accepted) on `/search`, `/crm/leads`, `/notifications`; `limit=0` returns `totalPages: null` | Cap and validate `limit` |
| 8 | Unknown filter values (`status`, `delivery`, `channel`) silently ignored; `POST /notifications/mark-read` accepts `ids` and `all: true` together | Validate enums and request shape |
| 9 | `POST /auth/otp/verify` with a malformed `otpId` never responds (request hangs) | Validate the id; return 400 |
| 10 | Ad `targetCity` accepts any text (`"Atlantis"` accepted) | Validate against the Location Master |
| 11 | Listing `lat` / `lng` not range-checked (`999` stored) | Range validation |

## B. Backend business rules

| # | Problem (verified live) | Needed |
|---|---|---|
| 12 | Profile completeness: backend `completedAt` / `PROFILE_INCOMPLETE` only need name + city + intent; product rule is 7 fields (name, intent, city, state, pincode, verified mobile, verified email). `completedAt` is also only stamped when those 3 arrive in a **single** PATCH | Apply the 7-field rule server-side; compute `completedAt` from the stored profile |
| 13 | The same buyer can send unlimited leads to the same listing — each one consumes a free contact | De-duplicate per buyer + listing, or don't charge repeat contacts |
| 14 | Quota is checked before request validation (`channel: "pigeon"` returns `QUOTA_EXHAUSTED`) | Validate the request before applying business rules |
| 15 | A Free user's `membership_upgrade` and `membership_renewal` orders are accepted | Validate order `purpose` against current membership state; enforce `DOWNGRADE_NOT_SUPPORTED` |
| 16 | A second `membership_new` order can be created while the first is still `processing` | Block a new membership order while one is open |
| 17 | Draft listing quota isn't enforced (3 drafts created with `planQuota: 2`, `used` stayed 0) — the documented 409 at create never happens | Count drafts at create, or document the actual rule |
| 18 | Wizard steps can be saved out of order (step 3 first jumped `wizardStep` to 4); submit only checks `wizardStep >= 5`, not the actual data | Validate required fields at submit |
| 19 | Soft-deleted listings are still returned and editable via `GET` / `PATCH /listings/:id`; a second `DELETE` succeeds | 404 / 409 after soft-delete |
| 20 | A rejected listing can't be fixed or resubmitted (edits return 409, no resubmit endpoint) | Resubmit / re-open flow |
| 21 | `POST /auth/logout` with an already-rotated or missing refresh token returns success but revokes nothing | Revoke the token family, or reject stale / missing tokens |
| 22 | Access token keeps working up to 15 min after `DELETE /users/me` (`KNOWN-ISSUES.md` #35) | Server-side revocation on delete |
| 23 | ~~OTP rate limit (3 per 10 min) not enforced on dev~~ — **corrected 2026-10-27: it IS enforced now** — 3 codes per 10 minutes per number/email, counting sign-up, login and resend together, with `retryAfterSeconds` in the 429 body (the web now shows that wait and keeps Resend disabled for it). Still open: a superseded `otpId` returns `OTP_CONSUMED` (docs say `OTP_NOT_FOUND`); the 5th wrong code is still `OTP_INVALID` "0 attempts" instead of `OTP_MAX_ATTEMPTS` | Align the error codes with the docs |
| 24 | Abuse reports: no de-duplication, accept non-existent listing ids, accept reasons over 40 chars | Validation + de-duplication |
| 25 | Ads stay `draft` after payment until capture (no `pending_payment` state in practice); `GET /ads/:id` doesn't return creatives | Pending-payment status; include creatives in the ad payload |
| 26 | Search: `sort` and `purpose` ignored by the MongoDB fallback; pages overlap (same listing on page 1 and 2); `city` must match exactly incl. case, no aliases (Bangalore / Bengaluru, Delhi / Delhi NCR); suggestions contain a literal `"undefined"` for listings without a locality | Fix search (or connect Meilisearch); stable sort with tie-breaker; case-insensitive city + aliases |

## C. Missing APIs

| # | Needed | Frontend workaround today |
|---|---|---|
| 27 | Photo fields in `/search`, `/properties/:slug` and project responses | Stock placeholder images labelled "Representative photos" |
| 28 | Look up listings by id (`GET /listings?ids=` or a search filter) | Shortlist cards snapshotted per device; ids saved elsewhere show as "Saved listing" |
| 29 | Real `GET /users/me/enquiries` (currently a hardcoded `[]` stub) | Sent enquiries stored per device, each re-read via `GET /leads/:id` |
| 30 | Buyer-facing lead status for Jupiter / Venus sellers (only Mercury status exists) | Generic "Sent" status |
| 31 | List my orders (e.g. `GET /billing/orders?status=processing`) | Pending payments remembered per device only |
| 32 | `GET /projects` (my projects), plus project delete, renew and project enquiry / lead endpoints | My Projects reads undocumented `profile.projects` from `/builders/:slug`; project pages take no enquiries |
| 33 | Listing renewal flow (beyond a billing purpose); listing media list / append (POST media replaces the whole set) | No renew button; media re-sent in full |
| 34 | KYC & Badges endpoints (`/kyc/status`, `/kyc/submissions`, `/users/:id/badges`) — not deployed on dev | Module 9 skipped |
| 35 | Listing analytics (views / impressions); a cross-entity dashboard search | Analytics shows lead stats only; topbar searches properties only |
| 36 | Newsletter subscribe; change an already-verified email / mobile | Newsletter says "not live yet"; contacts can only be added, not changed |
| 37 | Public seller name / badge in the listing payload | Detail page shows "VXP Listing Owner" |

## D. Config, data & documentation

| # | Needed | Owner |
|---|---|---|
| 38 | ~~Razorpay webhook secret / test webhook (or admin manual activation) — on dev every order stays `processing`, so no purchase ever completes~~ — **solved 2026-10-27:** backend built G3 — admin Payment ops lists stuck orders and activates them (same service as the webhook). Webhook itself still never fires in demo mode | Backend config / Admin |
| 39 | MSG91 (SMS) and Resend (email) credentials — OTP is always `111111`, nothing is genuinely verified | Backend config |
| 40 | Cloudinary credentials — no real photo / avatar / ad-creative uploads (users paste https URLs) — **web side built 2026-10-30:** upload buttons on listing photos, profile photo, builder logo and ad image (`src/lib/cloudinary.ts`, `ImageUploadButton`). Works as soon as `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` + `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (unsigned preset) are set; listing photos switch to the backend's signed ticket automatically once `/listings/media/sign` stops returning null | Config (Cloudinary account) / Backend |
| 41 | ~~`NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Google sign-in disabled locally~~ — **solved 2026-10-27:** backend shared the Client ID; set in `.env.local`/`.env.example`. `mode` field dropped (backend is find-or-create); signup routes existing users by profile completeness | Config |
| 42 | Populate the Location Master — only 6 entries (Mumbai / Andheri), so city pickers are free text with suggestions | Admin data (the web's city pickers now also offer the promoted cities, so cities with listings — e.g. Pune — are reachable meanwhile) |
| 43 | Paid test accounts (Mercury / Jupiter / Venus) and a seed seller with an active membership — CRM board, masked call, Venus projects, referrals and receipts have never run end to end on dev (every seed seller is lapsed, so every lead is undelivered) | Admin / test data |
| 44 | Document response shapes: `/crm/leads` rows (buyer name / phone, listing title / city), `/crm/summary` (unstaged leads), notification `payload` per `eventKey`, receipt fields (`amountPaise`, `receiptNumber`, `pdfUrl`), ad CTR unit (fraction vs %), whether receipt PDFs are public | Backend docs |
| 45 | ~~Admin cleanup: junk abuse reports filed during testing~~ — **done 2026-10-25**: all 3 resolved with action `none` from the admin API | — |
| 61 | **Razorpay still mocked on vex-dev (checked 2026-10-30)** — `vexora-docs/ACTION-ITEMS-TOTP-AND-RAZORPAY.md` says real test mode is live, and `POST /billing/orders` does return the real `razorpayKeyId` (`rzp_test_TtoA9AUG8FELUB`), but `razorpayOrderId` is still `order_mock_…` (not created at Razorpay), `verify` still accepts `demo_signature`, and the order stays `processing`. Razorpay Checkout can't open a mock order id. The web is ready either way: mock order → skips the window; real `order_…` → opens Razorpay with the key from the response | Backend |
| 62 | Doc vs live: a second `membership_new` while one is `processing` returns **201**, not the documented 409; `membership_upgrade` for an account with **no** membership also returns 201. The web blocks a second checkout itself while one is confirming | Backend |
| 63 | **"Payment confirming" stuck on every plan, even for brand-new accounts — fixed in the web 2026-10-30:** the remembered pending payment was stored once per browser (not per account) and never re-checked, so one account's stuck order blocked every account forever. Now stored per account (`src/lib/pending-orders.ts`), re-checked with `GET /billing/orders/{id}` on load and every minute, dropped when paid / failed / not this account's / older than 24 h, and after 15 min the notice offers "I wasn't charged — choose a plan again". **Backend ask for the real fix:** a way to list the account's open orders (e.g. `GET /billing/orders?status=processing`, or `pendingOrder` on `GET /memberships/me`) so this works across devices without browser storage | Web (done) / Backend |
| 64 | **Buyers never see listing photos:** `GET /search` hits and `GET /properties/{slug}` carry no photo / media / cover field (checked live 2026-10-30), so every card and detail page shows sample images even when the seller saved real photos. Needs e.g. `cover_url` on search hits and a `media: [{url, order}]` array on the property detail; the web will switch from samples to real photos as soon as they're there | Backend |
| 65 | **Listing photos: no read endpoint, and saving appends.** `GET /listings/{id}` and `/listings/mine` omit media and there's no `GET /listings/{id}/media`; the web reads them via `PATCH …/media/reorder {order: []}` (returns the full list, changes nothing — verified 2026-10-30), owner only. `POST /listings/{id}/media` *appends* instead of replacing and restarts `position` at 0, so duplicate positions appear. Needs a real `GET /listings/{id}/media` (or media on the listing) and consistent positions | Backend |
| 66 | **KYC documents upload to a PUBLIC Cloudinary folder — DEV ONLY.** The Verification tab (2026-10-31) uploads ID documents with the unsigned preset into `vxp/kyc`: every uploaded file is a PUBLIC link — anyone with the URL can see someone's Aadhaar. The form says so and asks for test documents only. Before real users the backend must provide a private/signed (authenticated-delivery) upload for KYC, and the web switches to it | Backend (blocker for production) |
| 67 | ~~Payment ops **Delete order** not wired~~ — **solved 2026-10-31:** Activate / Reject / Delete on every row, enabled by status; orders rejected in the admin are remembered in that browser (the stuck list drops them) so Delete stays available. Still nice to have: an API listing rejected orders, so other admins / devices see them | Backend (nice to have) |
| 68 | **An unpaid order locks the member out of all membership purchases.** Since the new `409 ORDER_ALREADY_IN_PROGRESS` rule, an order left in `created` (checkout started, Razorpay window closed, nothing paid) blocks every new membership order — new, renewal, upgrade — with no expiry, and admins can't see it because `GET /admin/payment-ops/stuck` only returns `processing` (verified live 2026-10-31). The docs only ask to block a second order while one is `processing`. Web workaround: the plans page shows "unfinished payment" with **Complete payment** (replays the create with the order's own idempotency key → same order → Razorpay). Backend: don't count `created` orders (or expire them after ~30 min), and list them in payment-ops so an admin can reject them | Backend |
| 69 | **Free (₹0) Mercury orders can never complete on their own.** `POST /billing/orders` for Mercury returns `amountPaise: 0` and a placeholder `razorpayOrderId: order_free_…` that Razorpay rejects ("Payment Failed", `preferences` 400); `verify` returns `PAYMENT_SIGNATURE_INVALID`; the order stays `created` (verified on a fresh account 2026-10-31) — so it also locks the account (#68) and isn't in the admin's stuck list. Web now never opens Razorpay for ₹0 orders and says "Free plan requested — activated by our team". Backend: activate ₹0 orders immediately on create (or put them in the payment-ops queue as `processing`) — the long-open "₹0 Mercury" decision in KNOWN-ISSUES #25 | Backend / product |
| 70 | **Razorpay webhook doesn't confirm real ad payments (2026-10-31).** Two Home banner ads paid with Razorpay test wallets (₹12,000 `pay_TuRXNSgl0HUueG`, ₹1,000 `pay_TuRO7HuiFK10gw`) show "Paid on Razorpay" in Payment ops, but the orders stay `processing` and the ads stay `draft` (no `orderId`), so they never reach Ad approval. The web keeps showing "Still confirming". Workaround: admin Activate in Payment ops. Backend: check the webhook delivery/handling for `payment.captured` (ad_* purposes and memberships) | Backend |
| 71 | `GET /ad-serving/home-banner` returns `{ id, targetUrl, creative }` without `targetCity`, so the city page's banner slot can never tell whether the served banner targets that city (it now renders only when `targetCity` is present). Also: `/ad-serving/{id}/click` is POST-only (GET → 404) — the web now records clicks with a POST beacon and opens `targetUrl` itself (fixed 2026-10-31; it was linking to `/ad-serving/undefined/click` and showing a sample image instead of the creative) | Backend (add `targetCity` to the served ad) |

## E. Business & legal decisions

| # | Decision needed |
|---|---|
| 46 | Hero stats ("1,84,000 residences", "12,400 RERA advisors", "₹92,000 Cr closed"), CTA "1,84,000 buyers" and trust-strip claims — supply real figures or remove — **labelled on screen as "Sample figures" / "(sample)" since 2026-10-27 — still needs real figures or removal** |
| 47 | Hero slides present Lodha / Runwal / Hiranandani listings and prices that aren't on the platform — brand / legal risk — **slides no longer carry developer names or prices — now neutral "Sample photo" captions, labelled on screen (2026-10-27)** |
| 48 | Testimonials are fabricated — replace with real ones or remove — **labelled "Sample testimonials" on screen since 2026-10-27 — still needs real quotes or removal** |
| 49 | Login / signup say "you agree to Terms & Privacy Policy" but those pages don't exist |
| 50 | Footer address and phone (`+91 22 5550 0199`) look like placeholders; About / Careers / Press / social links missing — **address/phone labelled "Sample contact details" on screen since 2026-10-27 — still needs real details** |
| 51 | Concierge floating button has no advisor service behind it — remove, or connect to a real contact service |
| 52 | ~~"Membership tiers" and "Advertise with us" homepage sections are built (now with live prices) but not rendered — show or delete~~ — **solved 2026-10-26:** both sections are now on the homepage (after Featured Developers), with live prices and working links |
| 53 | ~~Public builder page (`/builders/:slug`) — product decision + route + page~~ — **solved 2026-10-26:** `/builders/[slug]` built on the existing public `GET /builders/:slug` (teaser for visitors, projects when signed in); Featured Developers rows and the featured-developer ad link to it. Untested with real data — no builder profile exists on dev yet |
| 54 | ~~Brand-colour editor is open to every public visitor via the command palette — restrict to development or remove~~ — **solved 2026-10-26:** the editor and its two command-palette entries are only available in development (`BRAND_EDITOR_ENABLED`); the live site no longer exposes it |
| 55 | ~~Film-grain / vignette overlay covers the whole site including dashboards and forms — keep, or limit to the homepage~~ — **solved 2026-10-26:** **this item was wrong** — the film grain, vignette and concierge button are only rendered on the homepage (`src/app/page.tsx`), not site-wide. Nothing to change |

## F. Cleanup awaiting approval

| # | Item |
|---|---|
| 56 | ~~Delete 9 unused components: `motion/cursor-glow`, `motion/custom-cursor`, `motion/page-transition`, `motion/parallax`, `sections/dashboard-preview`, `sections/why-choose-us`, `sections/exclusivity-bar`, `sections/marquee-band`, `sections/section-divider`~~ — **solved 2026-10-26:** deleted (plus `motion/marquee.tsx`, which only the deleted `marquee-band` used) |
| 57 | ~~Remove Prisma — `src/lib/db.ts` is never imported, but `postinstall: prisma generate` runs on every install / Vercel build. Remove `prisma`, `@prisma/client`, `db.ts`, `prisma/`, the `postinstall` and `db:*` scripts~~ — **solved 2026-10-26:** Prisma removed — `db.ts`, `prisma/`, `postinstall` and `db:*` scripts, both packages |
| 58 | ~~Remove 14 unused packages: `next-auth`, `next-intl`, `z-ai-web-dev-sdk`, `gsap`, `@mdxeditor/editor`, `react-markdown`, `react-syntax-highlighter`, `@tanstack/react-table`, `@tanstack/react-query`, `@reactuses/core`, `uuid`, `vercel`, `@hookform/resolvers`, `zod`~~ — **solved 2026-10-26:** all 14 removed |
| 59 | ~~Delete the public placeholder route `src/app/api/route.ts` (`{"message":"Hello, world!"}`) and duplicate hook `src/lib/use-is-mobile.ts`~~ — **solved 2026-10-26:** both deleted |
| 60 | ~~Remove ~70 old screenshots (40 MB) from `scripts/`, plus template leftovers `examples/`, `mini-services/`, `Caddyfile`, `download/`~~ — **solved 2026-10-26:** screenshots and `examples/`, `mini-services/`, `Caddyfile`, `download/` removed; the `.ps1`/`.sh` scripts that `package.json` uses are kept |
