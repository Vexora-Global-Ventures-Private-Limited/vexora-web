# vexora-web — Sections

Every user-facing section of the consumer site, where it lives, and what powers it. Generated from the code on 2026-10-26 (branch `ganesh-oct-dev`).

**Data column:** **API** = live data from the backend (`vex-dev`) · **Static** = marketing copy, no API behind it · **Local** = stored in the browser only · **501 / not deployed** = the backend endpoint doesn't exist yet.

Every section below has been through the integration + bug review. Backend gaps that affect a section are listed in `UNRESOLVED-ISSUES.md` (referenced as *UI #n*).

---

## 1. Auth & account

| # | Section | Route / location | Data | Notes |
|---|---|---|---|---|
| 1 | Log in — mobile / email OTP, Google | `/login` | API | Demo OTP is always `111111`; Google: one find-or-create button (Client ID configured) |
| 2 | Sign up — mobile / email OTP, Google | `/signup` | API | |
| 3 | Complete your profile (compulsory) | `/signup?step=profile` | API | Name, intent, city, state, pincode + verified mobile & email. Portal pages send incomplete accounts back here |
| 4 | Header user menu / sign out | Site header (all pages) | API | |

## 2. Homepage (`/`) — top to bottom

| # | Section | Data | Notes |
|---|---|---|---|
| 5 | Hero + search with typeahead | API + sample | Suggestions from `/search/suggest`; hero stats and photos are labelled **Sample** on screen (UI #46–47) |
| 6 | Home banner ad slot | API | `/ad-serving/home-banner`; renders nothing when no campaign is active |
| 7 | Trust strip | Sample | Figures marked "(sample)" on screen (UI #46) |
| 8 | Featured properties | API | Newest live listings; stock photos (UI #27) |
| 9 | Ways of living (property types) | API | Live counts per type |
| 10 | Project promotion ad slot | API | `/projects/promoted`; hidden when empty |
| 11 | Popular cities | API + static images | Live listing counts / starting prices |
| 12 | Featured developers | API | `/builders/featured`; hidden while empty; rows link to the builder page |
| 13 | Membership tiers | API | Live plan prices → `/membership` |
| 14 | Advertise with us | Static | → `/promote` |
| 15 | Testimonials | Sample | Labelled "Sample testimonials" on screen (UI #48) |
| 16 | Call to action | Static + sample | Buyer count marked "(sample figure)" |
| 17 | Footer | API + sample | Live plan prices; address/phone labelled "Sample contact details" (UI #50) |
| 18 | Welcome ad popup | API | Shows the served banner once per session, or nothing |
| 19 | Concierge button, scroll progress, film grain | Static | Homepage only |

## 3. Browse & discover

| # | Section | Route | Data | Notes |
|---|---|---|---|---|
| 20 | Properties list — search, filters, sort, pagination | `/properties` | API | Filters kept in the URL; backend ignores `sort`/`purpose` (UI #26) |
| 21 | Property detail — gallery, facts, similar listings | `/properties/[slug]` | API | 404 → "no longer available" |
| 22 | Contact seller (WhatsApp, call, callback, site visit, enquiry) | `/properties/[slug]` | API | All 5 channels via `POST /leads`; profile, mobile, quota and expiry gates |
| 23 | Shortlist heart + report listing | Cards, detail page | API + Local | Card copies kept per device (UI #28) |
| 24 | Cities index | `/cities` | API + static | |
| 25 | City detail | API + static | Listings and developer projects are live (promoted projects in that city); the mock projects were removed |
| 26 | Commercial | `/commercial` | API | Properties list pre-filtered to commercial types |
| 27 | Land & Luxury Villas | `/land-luxury-villas` | API | Pre-filtered to plot / villa |
| 28 | Global properties | `/global-properties` | Static | "Coming soon" |
| 29 | Rent & Earn | `/rent-earn` | Static | "Coming soon" |
| 30 | Smart Pool | `/smart-pool` | Static | "Coming soon" |
| 31 | Projects list | `/projects` | API | `/projects/promoted` + featured builders (empty on dev) |
| 32 | Project detail — towers & units | `/projects/[id]` | API | Real ids → live inventory; any other id (incl. old sample `prj…` links) → "Project not found" |
| 33 | Builder (developer) page | `/builders/[slug]` | API | Teaser for visitors, projects when signed in. Not yet seen with real data — no builder on dev |

## 4. Membership & billing

| # | Section | Route | Data | Notes |
|---|---|---|---|---|
| 34 | Membership plans + checkout (Razorpay window) + referral code | `/membership` | API | Orders stay "processing" on dev (no webhook in demo mode) until an admin activates them in Payment ops |
| 35 | Billing history / receipts | `/membership`, `/reports`, Dashboard → Settings | API | Empty until a payment completes |

## 5. Dashboard (`/dashboard?tab=…`)

| # | Tab | Who sees it | Data | Notes |
|---|---|---|---|---|
| 36 | Overview (Free / Mercury / Jupiter / Venus variants) | Everyone | API | |
| 37 | My Listings + buy extra listing slots | Mercury, Jupiter | API | Slot price comes from the created order (shown before paying) |
| 38 | My Projects + builder profile | Venus | API | Untested live — no Venus account on dev (UI #43) |
| 39 | Lead pipeline (status / kanban, detail, notes, masked call) | Sellers | API | |
| 40 | Analytics | Sellers | API | Lead stats only (UI #35) |
| 41 | Shortlist | Buyers | API + Local | |
| 42 | Enquiries (sent contacts) | Buyers | Local + API | Stored per device (UI #29) |
| 43 | Referrals | Paid members | API | |
| 44 | Notifications — inbox, mark read, preferences, bell | Everyone | API | |
| 45 | Settings → Profile (+ mobile / email OTP verification) | Everyone | API | |
| 46 | Settings → Billing history | Everyone | API | |
| 47 | Settings → Appearance (light / dark) | Everyone | Local | |
| 48 | Settings → Sign out / Delete account (type DELETE) | Everyone | API | |

## 6. Seller tools

| # | Section | Route | Data | Notes |
|---|---|---|---|---|
| 49 | Post a property — wizard (basics, location, details, photos, review, submit) | `/listings/new` | API | Submit needs a paid membership (402 → upsell) |
| 50 | Edit / resume listing | `/listings/[id]/edit` | API | Drafts open in the wizard; other statuses read-only |
| 51 | New project | `/projects/new` | API | Venus only |
| 52 | Edit project — towers & units | `/projects/[id]/edit` | API | Venus only; owner check |

## 7. Advertising

| # | Section | Route | Data | Notes |
|---|---|---|---|---|
| 53 | Promote — ad purchase funnel (type → target → creative → package → pay) | `/promote` | API | Shows only the newest version of each package |
| 54 | Advertiser dashboard — my ads, pause/resume, metrics | `/advertiser` | API | |
| 55 | Reports — ad performance + billing | `/reports` | API | |

## 8. Not built (backend not deployed)

| # | Section | Why |
|---|---|---|
| 56 | KYC & badges (submit documents, verified badge) | `/kyc/*` and `/users/:id/badges` aren't deployed on dev (UI #34) |

## 9. Developer-only

| # | Section | Where | Notes |
|---|---|---|---|
| 57 | Brand-colour editor | Command palette (`⌘K`) → "Open settings" | Development builds only — removed from the live site |

---

**Totals:** 57 sections — 46 use the live API (some with a browser-side fallback), 8 are static or coming soon, 3 other (KYC not built, the dev-only colour editor, local-only appearance).

## Running locally

| App | URL | Command |
|---|---|---|
| vexora-web | http://localhost:3000 | `npm run dev` (port 3000 — the only local origin vex-dev's consumer CORS allows) |
| vexora-admin | http://localhost:3001 | `npx next dev -p 3001` with `API_PROXY_TARGET` set in `.env.local` (see its `.env.example`) |
