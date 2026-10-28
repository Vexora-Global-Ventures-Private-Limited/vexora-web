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
| 40 | Cloudinary credentials — no real photo / avatar / ad-creative uploads (users paste https URLs) | Backend config |
| 41 | ~~`NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Google sign-in disabled locally~~ — **solved 2026-10-27:** backend shared the Client ID; set in `.env.local`/`.env.example`. `mode` field dropped (backend is find-or-create); signup routes existing users by profile completeness | Config |
| 42 | Populate the Location Master — only 6 entries (Mumbai / Andheri), so city pickers are free text with suggestions | Admin data (the web's city pickers now also offer the promoted cities, so cities with listings — e.g. Pune — are reachable meanwhile) |
| 43 | Paid test accounts (Mercury / Jupiter / Venus) and a seed seller with an active membership — CRM board, masked call, Venus projects, referrals and receipts have never run end to end on dev (every seed seller is lapsed, so every lead is undelivered) | Admin / test data |
| 44 | Document response shapes: `/crm/leads` rows (buyer name / phone, listing title / city), `/crm/summary` (unstaged leads), notification `payload` per `eventKey`, receipt fields (`amountPaise`, `receiptNumber`, `pdfUrl`), ad CTR unit (fraction vs %), whether receipt PDFs are public | Backend docs |
| 45 | ~~Admin cleanup: junk abuse reports filed during testing~~ — **done 2026-10-25**: all 3 resolved with action `none` from the admin API | — |

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
