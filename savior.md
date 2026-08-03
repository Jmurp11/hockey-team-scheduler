# RinkLink.ai — Savior Plan

_Strategies to resolve the MyHockeyRankings dependency and salvage the platform investment._

**Author:** Strategy review • **Date:** 2026-07-14

---

## 1. The Situation in One Paragraph

RinkLink.ai is a well-built, AI-first youth-hockey scheduling platform (NestJS API, Angular/Ionic clients, Supabase, OpenAI, Stripe) whose value depends almost entirely on **scraped MyHockeyRankings (MHR)** data. Two structural problems threaten the whole thing:

1. **Seasonal data gap (business-critical).** MHR doesn't publish next-season teams/rankings until **mid-September**, but ~90% of scheduling and tournament registration happens **March–July**. The product is therefore *least accurate exactly when demand is highest*.
2. **Fragile single-source scraping (continuity risk).** A scheduled scraper is one HTML change, rate-limit, or anti-bot measure away from breaking every core feature at once.

The good news: the engineering is not the problem. The **data strategy** is. Nearly every plan below reuses the existing codebase, API modules, and ETL service — the effort already invested is salvageable. The question is *where the data comes from and who owns it*.

---

## 2. Reframing the Problem

The challenges doc treats MHR as "the foundation." The strategic unlock is to **demote MHR from foundation to one input among several**, and to recognize a subtle truth about the seasonal gap:

> **You don't need next season's MHR ratings to be useful during scheduling season. You need *who the teams are* and *how to reach them*.**

Last season's roster + last season's rating + a predictable age-up is a *better-than-nothing, often better-than-MHR-has* estimate during the exact months MHR is blank. That single insight (Plan A) is the cheapest, highest-leverage fix available.

Each plan is scored on:
- **Feasibility** — how quickly it ships with the current team/stack (1–5, higher = easier).
- **Commercial appeal** — impact on revenue, retention, and defensibility (1–5, higher = better).

---

## 3. The Plans

### Plan A — Roster Carry-Forward + Age-Up Projection Engine
**"Never show an empty database in July again."**

Because youth hockey ages up deterministically, last season's data can *project* this season's teams before MHR publishes. **The goal is not roster data — it is preserving the team→location→manager-contact chain across the season boundary** so opponent search and the AI email assistant keep working during the March–July gap.

- Snapshot each completed MHR season (you likely already have historical scrapes).
- Build an age-up transform keyed on **birth year**: a team's birth-year cohort simply moves up one age tier next season (e.g. a 2011 13U team → 2011 14U). Carry the org, region, team name, **location**, and — most importantly — the **already-resolved manager contact info** forward.
- **Rating projection rule (observed):** rating shifts predictably with the odd/even age transition, because moving into a checking/new-division year vs. a second-year-in-division year behaves differently:
  - **Odd → even age year (e.g. 13U → 14U): rating increases ~+2 to +3 points.**
  - **Even → odd age year (e.g. 14U → 15U): rating decreases ~2 to 3 points.**
  - Apply this delta to last season's rating as the projected starting rating, then let real MHR ratings overwrite it once they publish in September. (Tune the exact deltas per age band against your historical snapshots.)
- Label everything with a **data-freshness/confidence badge** ("Projected from 2024-25 season — rating estimated") so trust is preserved rather than faked.
- Let managers **confirm or correct** a projected team in one tap, which upgrades it from "projected" to "verified" (this is also the seed of Plan C's crowdsourcing).

**Why this is the linchpin for your use case:** today you pull team name + location from MHR, then spend an AI search to resolve the manager's contact info, and cache it. That cached contact is your most expensive, most valuable asset. Age-up projection lets you **reuse last season's resolved contacts** instead of re-resolving from scratch every year — the same manager usually follows the birth-year cohort up. MHR's September blackout stops mattering because you're not depending on MHR to *re-list the team* before you can reach it.

**Solves:** Seasonal gap (directly and immediately) for the contact-discovery workflow you actually depend on. **Partial** scraping-fragility relief (you're no longer blind when the scraper is stale).
**Reuses:** ETL service, Supabase schema, existing team/rating models, cached contact store.
**Risk:** Projections are estimates; must be clearly labeled. Some managers change year-to-year, so contacts still need periodic re-verification. Rating deltas need per-age-band tuning.
**Feasibility: 5 · Commercial appeal: 4**

---

### Plan B — Multi-Source Aggregation Layer (kill the single point of failure)
**"MHR becomes one pipe, not the pipe."**

Abstract data behind a normalized internal schema fed by **multiple adapters**, so any single source failing degrades gracefully instead of catastrophically.

Candidate sources beyond MHR:
- **USA Hockey / district & state association** registrations and team lists (authoritative for *existence* of teams, often earlier than MHR).
- **SportsEngine / GameSheet / LiveBarn / TeamSnap** ecosystems (schedules, rosters).
- **League and tournament websites** (many publish accepted-team lists in spring — ahead of MHR).
- **MyHockeyTournaments / AAU / independent tournament sites** for the tournament side.

Architecture: `Source Adapter → Normalizer → Confidence/Provenance tagging → Merge/dedupe → Canonical entity`. Each field stores *where it came from and when*.

**Solves:** Single-point-of-failure directly; partially fills seasonal gap (associations/leagues publish earlier than MHR).
**Reuses:** ETL service pattern extends naturally to N adapters.
**Risk:** Each source has its own ToS, formats, and fragility; entity-resolution/dedupe across sources is real work.
**Feasibility: 3 · Commercial appeal: 4**

---

### Plan C — "Claim Your Team" User-Contributed Data (the system-of-record play)
**"Turn users into the data source."**

Let managers claim a team profile, import/paste their schedule, maintain roster + contact info, and invite opponents. Every correction and claim becomes **owned, first-party data** MHR can't revoke.

- Claim flow bootstrapped by Plan A's projected teams (low friction — confirm, don't create from scratch).
- Manager-to-manager scheduling requests create a **two-sided network**: accepting a game verifies *both* teams' data.
- Contact info supplied by verified managers is higher quality (and more defensible) than scraped emails.

**Solves:** Long-term MHR independence, data ownership, the stated "system of record" vision. Builds a **network-effect moat** — the real defensibility.
**Reuses:** Auth, User/Teams/Games modules, messaging/email assistant already exist.
**Risk:** Cold-start / chicken-and-egg — worthless until enough managers participate. Needs a strong single-player value hook (the AI tools) to attract users before the network exists.
**Feasibility: 3 · Commercial appeal: 5**

---

### Plan D — Tournament-First Monetization Pivot (align revenue with the calendar)
**"Sell what's in-season when scheduling data is out-of-season."**

Tournament registration peaks **spring–summer** — precisely when MHR team data is blank but the platform still needs to earn. The tournament marketplace (free listings + paid featured promotion) is *already the stated monetization model* and depends far less on MHR team ratings.

- Double down on tournament discovery, director self-serve listings, and **paid featured placement** as the primary Q2–Q3 revenue engine.
- Recruit tournament directors directly (they *want* teams to find them) — a supply side you can grow without MHR.
- Use AI tournament recommendations (which need only the team's own age/level/location, not opponent data) as the retention hook during the gap months.

**Solves:** Turns the seasonal gap from a liability into a *seasonally-matched revenue stream*. Reduces reliance on the most MHR-dependent features during the gap.
**Reuses:** Tournaments module, Stripe, OpenAI recommendations, tournament-etl.
**Risk:** Two-sided marketplace requires director acquisition effort (sales, not just code).
**Feasibility: 4 · Commercial appeal: 5**

---

### Plan E — MHR-Independent "Coordination Layer" Features
**"Ship value that never touches MHR."**

Several of the strongest features degrade gracefully or not at all without MHR: **schedule conflict/risk detection, travel summaries, hotel/restaurant lookups, the AI email assistant, and the chat copilot** all operate on the *user's own* schedule. Prioritize and market these as the always-on core.

- A manager who imports their own schedule (Plan C) gets full conflict detection, travel optimization, and email drafting **regardless of MHR state**.
- Position RinkLink as "your scheduling copilot" first, "opponent finder" second — so a stale scraper never zeroes out the product's value.

**Solves:** Business-continuity — the product keeps working (and keeps its retention hooks) even in a total MHR outage or the September gap.
**Reuses:** Message, Email, OpenAi, Dashboard, Schedule modules — already built.
**Risk:** Lower *acquisition* pull than opponent-finding; more of a retention/resilience play than a growth driver.
**Feasibility: 5 · Commercial appeal: 3**

---

### Plan F — Harden the Scraper (defensive, buys time)
**"If you must scrape, scrape resiliently."**

Not a strategy on its own, but cheap insurance while A–E mature.

- **LLM-based extraction** (feed page text to OpenAI to extract structured fields) tolerates HTML/CSS changes far better than brittle CSS selectors.
- Headless-browser rendering for JS-heavy pages; polite rate-limiting and retry/backoff.
- **Monitoring + alerting**: detect row-count drops, schema drift, and empty pulls; page the team before users notice.
- **Snapshot every scrape** so a break never destroys history and Plan A always has a fallback.

**Solves:** Reduces (doesn't eliminate) fragility. Does **nothing** for the seasonal gap or business/ToS risk.
**Reuses:** Existing GitHub Actions + ETL, OpenAI already wired.
**Risk:** Still adversarial to MHR's ToS; still a dependency. Treat as a bridge, not a destination.
**Feasibility: 5 · Commercial appeal: 2**

---

### Plan G — Official Data Partnership / Licensing
**"Stop scraping the source; pay or partner with it."**

Pursue a licensed feed or API from MHR itself, or a strategic data partnership with an authoritative alternative (USA Hockey, a state association, SportsEngine, GameSheet).

**Solves:** Both fragility *and* legitimacy in one move; potentially earlier data access than public scraping.
**Reuses:** Everything — this is a business-development motion, not an engineering one.
**Risk:** Outside your control; may be slow, expensive, or rejected. MHR may view you as competitive. Don't block the roadmap on it.
**Feasibility: 2 · Commercial appeal: 4**

---

### Plan H — Proprietary Ratings & Scheduling Metrics (long-term moat)
**"Own the ranking, not just the roster."**

Once first-party schedules and results flow in (Plan C), compute **RinkLink-native ratings** (Elo-style from reported scores, strength-of-schedule, travel-efficiency indices). Over time MHR becomes a *cross-check*, not a *dependency*.

**Solves:** The endgame stated in the challenges doc — MHR as optional enhancement.
**Reuses:** Results/Games data, OpenAI for insight generation.
**Risk:** Requires critical mass of contributed results first — a *consequence* of C succeeding, not a starting move.
**Feasibility: 2 · Commercial appeal: 4**

---

## 4. Ranked Summary

### By Feasibility (ship-ability with current stack)
| Rank | Plan | Feasibility | Notes |
|------|------|:-----------:|-------|
| 1 | **A — Roster Carry-Forward** | 5 | Data transform on data you likely already have |
| 1 | **E — MHR-Independent Features** | 5 | Already built; reprioritize + reposition |
| 1 | **F — Scraper Hardening** | 5 | Bridge insurance, low effort |
| 4 | **D — Tournament-First Pivot** | 4 | Modules + Stripe exist; needs director sales |
| 5 | **B — Multi-Source Aggregation** | 3 | Real entity-resolution work |
| 5 | **C — Claim Your Team** | 3 | Cold-start problem |
| 7 | **G — Partnership/Licensing** | 2 | Out of your control |
| 7 | **H — Proprietary Ratings** | 2 | Depends on C first |

### By Commercial Appeal (revenue, retention, defensibility)
| Rank | Plan | Appeal | Notes |
|------|------|:------:|-------|
| 1 | **C — Claim Your Team** | 5 | Network-effect moat; the system-of-record vision |
| 1 | **D — Tournament-First Pivot** | 5 | Revenue matched to the in-season calendar |
| 3 | **A — Roster Carry-Forward** | 4 | Fixes the trust problem at peak demand |
| 3 | **B — Multi-Source Aggregation** | 4 | Resilience + earlier data |
| 3 | **G — Partnership/Licensing** | 4 | Legitimacy + continuity |
| 3 | **H — Proprietary Ratings** | 4 | Long-term moat |
| 7 | **E — MHR-Independent Features** | 3 | Retention/resilience more than growth |
| 8 | **F — Scraper Hardening** | 2 | Buys time, adds no value |

### Combined Priority (feasibility × appeal, sequencing-aware)
1. **A — Roster Carry-Forward** — highest leverage, lowest effort. Do first.
2. **D — Tournament-First Pivot** — monetize the exact months MHR is blank.
3. **C — Claim Your Team** — the durable moat; A makes its onboarding cheap.
4. **B — Multi-Source Aggregation** — kills the single point of failure.
5. **E — MHR-Independent Features** — reposition as the always-on core (mostly repositioning).
6. **F — Scraper Hardening** — cheap insurance in parallel.
7. **G — Partnership** — pursue opportunistically; don't block on it.
8. **H — Proprietary Ratings** — the endgame, unlocked by C.

---

## 5. Recommended Roadmap (how the plans compose)

These are not either/or — they stack into a coherent 12-month arc.

**Now → 30 days (stop the bleeding):**
- **Plan A**: ship roster carry-forward + confidence badges so July isn't empty.
- **Plan F**: add scraper monitoring/alerting + snapshotting so you're never blindsided.
- **Plan E**: reposition messaging around "always-on scheduling copilot."

**30–90 days (monetize the gap):**
- **Plan D**: push the tournament marketplace + featured-placement revenue during peak registration season; recruit directors.
- **Plan A→C bridge**: turn "verify this projected team" into the first crowdsourcing loop.

**90 days–6 months (build the moat):**
- **Plan C**: full claim-your-team + schedule import + opponent invitations → first-party data.
- **Plan B**: add 1–2 non-MHR adapters (a state association + a tournament source) behind the normalized layer.

**6–12 months (win the category):**
- **Plan H**: proprietary ratings from contributed results.
- **Plan G**: negotiate a licensed feed from a position of strength (you now have your own data + users).

**End state:** MHR is one optional adapter behind Plan B's normalization layer, backfilled by Plan A projections and superseded by Plan C's first-party data and Plan H's native ratings — exactly the "enhancement, not dependency" future the challenges doc calls for.

---

## 6. Guiding Principle

> Every feature should degrade **gracefully**, never **catastrophically**, when MHR is stale or gone. Design so that a manager who has imported their own schedule always gets full value — and treat scraped MHR data as a bonus that makes a working product *better*, not a crutch that makes a broken product *usable*.

---

## 7. Research: Is There a Public USA Hockey Team List? (and does it include managers?)

**Short answer: No — there is no publicly accessible, browsable list of USA Hockey registered teams for a season, and even where team/staff data exists it is login-gated and does not expose manager contact info.** USA Hockey does **not** solve your contact-discovery use case.

### Where USA Hockey team data actually lives
All team/roster registration flows through the **USA Hockey Portal Registry**:

- **Portal:** https://portal.usahockey.com/ (login-gated)
- **Member verification tool:** https://portal.usahockey.com/tool/member-verification (username/password required)
- **Individual member registration:** https://membership.usahockey.com/
- **Portal Registry FAQ (how teams/rosters are created):** https://portal.usahockey.com/forms/registry-submitting-teams.pdf

Key facts from USA Hockey's own documentation:

- The Portal Registry is where **local programs** claim members, create teams, and build rosters. It is **not a public directory** — access is per-program, credential-gated, and administered at the **state/district registrar** level. There is no national "browse all teams for 2025-26" view and no bulk export.
- After a roster is approved, USA Hockey emails a **roster link to the club registrar**; "public rosters will only show approved and redlined players and staff." That link is **per-team and registrar-distributed**, not something you can enumerate or crawl.
- The only truly public USA Hockey data is **aggregate membership statistics** (https://www.usahockey.com/membershipstats) — counts, not team lists.
- The **Member Lookup / verification** feature requires you to already know a specific person (first name, last name, DOB, state) — it's a one-at-a-time confirmation tool, not a directory you can list from.

### Does it include managers?
- Team rosters in the registry **do include staff roles** (coaches, and in many programs a manager), so the *role* exists in the data model.
- **But it is not usable for your purpose:** (1) it's login-gated per program, not public; (2) it is not enumerable/bulk-accessible; and (3) it exposes **names/roles at most — not email or phone**. Youth-hockey member contact details are deliberately withheld for **SafeSport / minor-privacy** reasons. So even a registrar-shared roster link would not hand you the manager's email/phone the way your current AI-search step resolves it.

### Implication for RinkLink
- **USA Hockey cannot replace your current AI contact-resolution step, and it cannot serve as a public season team list.** Treat this option as **closed** for the contact-discovery workflow.
- Therefore, **Plan A (age-up projection) is the right primary solution** for your stated need: it lets you carry forward the manager contacts you've *already* resolved and cached, so MHR's September blackout stops blocking outreach. You are not blocked on any external team list — your proprietary, cached contact store *is* the asset.
- If you still want a second source for **team existence/name/location** earlier than MHR (not contacts), the realistic public options are **state/district association websites and league "accepted teams" pages** (many publish spring/summer, ahead of MHR) rather than a USA Hockey national list — this is Plan B territory, and it would supplement, not replace, your cached contacts.

**Sources:**
- [USA Hockey Portal Registry](https://portal.usahockey.com/)
- [Member Verification Tool](https://portal.usahockey.com/tool/member-verification)
- [USAH Registry: Creating and Submitting Teams (PDF)](https://portal.usahockey.com/forms/registry-submitting-teams.pdf)
- [USA Hockey Membership Statistics](https://www.usahockey.com/membershipstats)
- [USA Hockey Member Registration](https://membership.usahockey.com/)
- [USA Hockey Registration overview](https://www.usahockey.com/usahockeyregistration)
