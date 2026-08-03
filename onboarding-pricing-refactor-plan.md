# RinkLink.ai — Onboarding & Pricing Refactor Plan

_Companion to [`pricing.md`](./pricing.md), [`two-month-plan.md`](./two-month-plan.md), [`savior.md`](./savior.md). Verified against the live Supabase schema, live Stripe account (`acct_1SwY5bCsP6YT9L8R`, RinkLink.ai), and the code on `feat/jm/security-updates`._

## Decisions locked (2026-07-20)

| Question | Decision |
|---|---|
| **Pricing model** | **Tiered** — Free / Copilot, Manager, Association (per-team, volume bands). Concrete numbers in §1. |
| **Onboarding** | **Self-serve is the north star.** Ship **Phase 1 concierge** now to close the first warm sale; **Phase 2** is the product-first self-serve funnel (§4). |
| **Security** | **In scope** — gate on active subscription (not row existence) + harden `complete-registration`. |

---

## 0. Ground truth (what exists today, verified)

- **Stripe (LIVE):** exactly **one** product — `RinkLink API Access` (`prod_TuP3M…`, metered $0.05/req/mo). **There is NO app-seat Price.** The $50/yr app subscription is built inline via `price_data` every checkout (`user.service.ts:252–268`). No founding coupon exists.
- **`subscriptions` table:** `stripe_customer_id, stripe_subscription_id, billing_email, owner_user_id, total_seats, seats_in_use, status, current_period_end, association`. **No `plan` / `tier` / `stripe_price_id` / `interval` column** — the schema cannot represent tiers today.
- **`app_users` table:** `user_id, email, name, phone, team (→rankings.id), association (→associations.id), age, status`. No plan/tier.
- **Teams live in `rankings`** (`team_name, association, rating, age, …`) — an MHR-scraped table, empty March–September for new teams.
- **The wall:** `completeRegistration` hard-fails on `rankings` lookup (`user.service.ts:809–823`) and the register form makes `team` a required field bound to existing `rankings` rows (`register.component.ts:193, 96–104`). **A spring/summer buyer cannot self-serve.**
- **Access gap:** `appUserGuard` returns `true` on `isAppUser` = *an app_users row exists* (`app-user.guard.ts:62`). `userHasAccess()` (active-subscription check) exists (`user.service.ts:1509`) but the guard never calls it → **a canceled/lapsed subscriber keeps full access.**
- **Takeover gap:** `POST /complete-registration` is `@Public()` and sets a password from `body.userId` with no proof the caller owns it (`user.controller.ts:230–281`, self-documented).

---

## 1. Target pricing model

Buyer reality: an association thinks in **teams** (≈ one manager per team). Price by the team, discount by volume, and give a genuinely-free always-on hook.

| Tier | Who | Price *(hypothesis to test)* | Billing |
|---|---|---|---|
| **Free / Copilot** | single manager, MHR-independent features only | **$0** | none |
| **Manager** | individual, 1 team | **$99 / yr** (or **$12 / mo**) | annual or monthly |
| **Association** | multi-team org, priced **per team** | volume bands below | annual (monthly optional) |

### Association volume bands (concrete, per team / year)

| Band | Price / team / yr | Example | Annual total |
|---|---|---|---|
| **1–10 teams** | **$75** | 8-team club | $600 |
| **11–25 teams** | **$60** | 20-team association | $1,200 |
| **26–50 teams** | **$50** | 40-team association | $2,000 |
| **51+ teams** | **Contact us** (custom) | 80-team org | negotiated |

**Rationale:** each band sits below the $99 individual Manager price, so buying as an org is always the better deal (kills seat-splitting), and revenue scales with org size without separately-named plans. Monthly ≈ annual ÷ 10 (i.e. ~2 months free for annual) to lower first-purchase friction. These are **starting hypotheses** — the branch exists to test them; wire them as Stripe Prices so you can change numbers without a deploy.

**For the first warm sale:** ignore bands. Use a **founding-member coupon** on the Manager or Association price and concierge them in (§3).

---

## 2. Stripe setup (Dashboard / MCP — must precede code)

1. **Product: "RinkLink" (app).** Create Prices:
   - `Manager – Annual` ($99/yr, recurring), `Manager – Monthly` ($12/mo).
   - `Association – Annual` **graduated tiered price** per team using the bands in §1 (Stripe `billing_scheme=tiered`, `tiers_mode=graduated`, `quantity`=team count), + optional monthly.
2. **Founding-member coupon** (e.g. 50% off 1st year, or fixed price) for warm deals — `allow_promotion_codes:true` is already set (`user.service.ts:273`).
3. Record the price IDs as env vars: `STRIPE_PRICE_MANAGER_ANNUAL`, `STRIPE_PRICE_MANAGER_MONTHLY`, `STRIPE_PRICE_ASSOCIATION_ANNUAL`, … (supersedes the single `STRIPE_PRICE_ID` fallback already scaffolded at `user.service.ts:252`).
4. Keep the existing metered `RinkLink API Access` price untouched — the developer portal is a separate product.

---

## 3. Schema migration

Put **`plan` on `app_users`** so *every* user (including free) has a tier without needing a billing row; keep `subscriptions` for paid billing detail only.

```sql
-- app_users: every user has a plan; free users need no subscription row
alter type ... ;                       -- new enum plan_tier: FREE | MANAGER | ASSOCIATION
alter table app_users add column plan plan_tier not null default 'FREE';

-- subscriptions: represent the tier + the real Stripe price/cadence
alter table subscriptions add column plan        plan_tier;
alter table subscriptions add column stripe_price_id text;
alter table subscriptions add column interval    text;      -- 'month' | 'year'
```

Backfill existing paid users → `plan='ASSOCIATION'` if `total_seats>1` else `'MANAGER'`; everyone else stays `FREE`. Regenerate types (`mcp__supabase__generate_typescript_types`) and update `subscription.service.ts` DTOs.

**`rankings` — mark user-created teams (§4.1):**

```sql
alter table rankings add column source          text        not null default 'mhr';  -- 'mhr' | 'user'
alter table rankings add column mhr_matched_at  timestamptz;                          -- set when MHR data lands
alter table rankings add column claimed_by      uuid;                                 -- creator (optional)

-- Make the importer's natural key structural so a user row and an MHR row
-- can never silently coexist, and switch the proc to ON CONFLICT (see §4.1).
create unique index rankings_natural_key
  on rankings (association, lower(team_name), age);
```

Existing scraped rows keep `source='mhr'`. **No FK changes** — `rankings.id` stays the team identity.

**`rankings` — user-created teams + MHR reconciliation (§4.1):**

```sql
alter table rankings add column source          text        not null default 'mhr';  -- 'mhr' | 'user'
alter table rankings add column mhr_matched_at  timestamptz;                          -- null until reconciled
alter table rankings add column claimed_by      uuid;                                 -- creator (optional)
-- helps the reconciler scope + the create path dedupe
create index on rankings (association, age) where source = 'user' and mhr_matched_at is null;
```

Existing scraped rows keep `source='mhr'`. No FK changes — `rankings.id` stays the team identity.

---

## 4. Onboarding

### Phase 1 — Concierge (now, unblocks the first sale)

Goal: create a working account **server-side**, bypassing the broken public funnel and the team-exists wall.

- **New authenticated admin endpoint** `POST /users/concierge-onboard` (guarded, admin-only — not `@Public()`):
  - Input: `{ email, name, phone, associationName, teamName, age, plan, seats }`.
  - Steps: `createAuthUser` → `createAppUser` → **find-or-create `associations` row** → **find-or-create the team** (see Phase 2 create-team helper) → `createOrGetManager` → create `subscriptions` row (or attach the founding-coupon Stripe sub) → set a temporary password / send a real password-reset (not the trust-`body.userId` path).
  - Return a ready login. Reuses existing idempotent helpers (`user.service.ts:571–1003`).
- **No new UI required** — call via API/script for the first customer. Optional thin internal admin form later.

### Phase 2 — Self-serve product-first funnel (the real fix)

**Today:** pay → webhook makes user → magic link → 7-field profile requiring a pre-existing team. Payment and the MHR wall are both *before* value.

**Target flow:**

1. **Free signup** (email + password) → `createAuthUser` + `createAppUser(plan='FREE')`, **no payment, no team required**. Immediate access to the always-on copilot / MHR-independent features. This is the top-of-funnel hook from `pricing.md` §3 and the "claim your team" direction in `savior.md`.
2. **Claim-or-create team (kills the wall).** In-product:
   - **Association first (the stable anchor).** User picks their `associations` row — associations persist year-to-year and are already FK'd everywhere. If it doesn't exist, **create-association**.
   - Search `rankings` within that association. If the team exists → **claim** it (set `app_users.team`).
   - If it doesn't (spring/summer, new team) → **"Create your team"**: insert a `rankings` row scoped to the chosen association (`team_name, association, age`, null rating, `source='user'`). This becomes the team's permanent identity — see §4.1.
   - Refactor `completeRegistration` (`user.service.ts:803–823`) to call a shared `findOrCreateTeam()` instead of hard-failing; make `team` optional in `register.component.ts` and add the create-team UI.
3. **Upgrade to paid, in-app.** CTA → Stripe Checkout for the chosen tier/band (real Price IDs from §2) → webhook sets `subscriptions.plan/stripe_price_id/interval` and flips `app_users.plan`. Payment now comes *after* the user has seen value.
4. **Feature gating by plan.** Define free vs paid capabilities (extend `UserCapability` in `user-access.service.ts:13`); gate paid-only features on **active subscription**, not row existence (§5).

**Net change vs today:** account creation is decoupled from payment; the MHR wall is gone; the buyer experiences the product before the paywall — `pricing.md`'s core "lower friction + free hook" thesis, implemented.

### 4.1 Team identity & MHR reconciliation (spring team → real MHR team)

**The constraint that drives the design:** `rankings.id` is the team's identity across the whole DB — `app_users.team`, `games.team`, `gamesfull.team`, and `games.opponent` all reference it. So a user-created team must get its `rankings.id` **once, at creation**, and that id must **never change** when MHR data arrives. Reconciliation = enrich the existing row in place, not swap ids.

**Why in-place (not a separate `teams` table):** a `teams`-as-identity table would force re-pointing 4+ FK columns (`app_users`, `games`, `gamesfull`, `opponent`) off `rankings` — large blast radius. Writing user teams into `rankings` behind a `source` flag reuses the existing identity and every existing query/FK unchanged.

**The importer already upserts in place — so the real job is key-matching, not re-pointing.** The MHR importer (`mhr-data-fetch/src/rankings/insertRankings.ts`) batches rows into the Postgres proc **`p_batch_rankings`**, which does:

```sql
UPDATE rankings SET rating, record, agd, sched, girls_only
WHERE age = item.age AND association = org_id AND team_name = item.team_name;
IF NOT FOUND THEN INSERT ...   -- only when no row with that exact key exists
```

So **if a user-created row's `(age, association, team_name)` matches what MHR scrapes, the next import writes the ratings straight onto that same row** — `rankings.id` preserved, every FK intact, no reconciler involved. The problem reduces to: *make the user's key match MHR's canonical key.* (Association `org_id` inside the proc is resolved from `associations` by `name/city/state` via `p_batch_orgs`, which upserts `ON CONFLICT (name, city, state)` — so a reused/matching association row stays stable year to year, exactly your anchor.)

**Lifecycle:**

1. **Spring — create, keyed to match MHR.** User picks their **existing `associations` row** (don't free-type if it exists) and an **`age` from a fixed dropdown using MHR's exact tokens** (`mhr-data-fetch/src/rankings/rankings.constants.ts` → `rankingsLevels`). Create the `rankings` row with `source='user'`, null ratings. Now two of the three key fields already match MHR by construction; `team_name` is the only fuzzy one.
2. **September — MHR lands.** For every team whose `team_name` the user entered exactly as MHR spells it → the import **auto-enriches in place**, and a trigger sets `mhr_matched_at`. Done, zero human involvement.
3. **`team_name` mismatch → reconcile once, then self-maintains.** Where the user typed "Jr Ducks 14U" but MHR says "Junior Ducks 14U AA", the import inserts a *separate* MHR row (blocked structurally if we add the §3 unique index — then it surfaces as a conflict to reconcile). A lightweight reconciler (API job on the existing `scheduler_jobs`/`scheduler_config` tables, run after each import Sept–Oct) matches unmatched `source='user'` rows to MHR rows in the same association+age by fuzzy name and:
   - **Adopts MHR's canonical `team_name` onto the user row** (this is the fix that matters — it aligns the key), copies the ratings, sets `mhr_matched_at`, and deletes the duplicate MHR row.
   - Because the user row now carries MHR's exact key, **all future imports upsert onto it automatically** — the reconciliation is one-time per team, not recurring.
   - Ambiguous matches → in-app confirm ("We found your team on MyHockeyRankings — is this you?"); no silent renames.
   - Never-listed teams (rec league) stay `source='user'`; the app works without an MHR rating.

**Two levers, pick based on where you want the logic:**
- **Preferred — edit the proc (you own it).** Change `p_batch_rankings` to `INSERT … ON CONFLICT (association, lower(team_name), age) DO UPDATE`, and have it *not* overwrite `source`. The DB then does exact-key enrichment atomically; the API reconciler only handles fuzzy `team_name` misses.
- **Fallback — API-only.** Leave the proc alone; the reconciler carries both exact and fuzzy matching post-import. Works, just more app-side code.

---

## 5. Security fixes (in scope)

1. **Gate on entitlement, not existence.** In `appUserGuard` (`app-user.guard.ts:62`) — and the server-side equivalent — allow **FREE** users into free routes but require `userHasAccess()` (active subscription, `user.service.ts:1509`) for paid features. A canceled sub should drop to Free, not retain full access. Add a `userHasAccess` capability to `UserAccessService`.
2. **Harden `complete-registration`** (`user.controller.ts:230–281`). Remove `@Public()` and derive the user from the authenticated Supabase JWT (magic-link session) instead of trusting `body.userId`; or, if it must stay bootstrap-public, require a one-time signed token proving ownership of that `userId`. Closes the account-takeover path. (The self-serve rework in Phase 2 naturally moves password-set behind an authenticated session.)

---

## 6. Sequencing

| Wave | Work | Unblocks |
|---|---|---|
| **A — this week** | Stripe Prices + founding coupon (§2); Phase-1 concierge endpoint (§4); security fix #2 (harden complete-registration) | **First warm sale**, closes takeover risk |
| **B — weeks 1–2** | Schema migration (§3); wire real Price IDs into checkout; plan-aware `subscriptions` webhook handling | Tiered billing representable |
| **C — weeks 2–4** | Phase-2 self-serve funnel: free signup, claim-or-create team, in-app upgrade, plan gating (§4); security fix #1 (entitlement gating) | Removes MHR wall; self-serve growth |
| **D — parallel** | SEO/pricing page rebuilt for 3 tiers (`pricing.component.ts` — currently single-seat stepper, hardcoded `$50`); update `pricing.constants.ts` | Correct public pricing |

### Open items for you
- **Confirm the band numbers** in §1 (they're hypotheses).
- **Monthly for Association?** — yes/no (adds Prices but more first-purchase flexibility).
- **Where exact-match enrichment lives** (§4.1): edit `p_batch_rankings` in `mhr-data-fetch` to `ON CONFLICT (association, lower(team_name), age) DO UPDATE` (preferred — DB does it atomically), or keep the proc and let the API reconciler handle everything?
- **Reconciler cadence & auto-match threshold** (§4.1): run after each `etl:rankings` import (Sept–Oct); how confident before auto-adopting an MHR name vs. asking the user to confirm.
- **Add the `rankings` unique index** `(association, lower(team_name), age)` (§3)? Prevents user+MHR duplicate rows and enables `ON CONFLICT` — confirm existing scraped data has no dupes on that key first.
