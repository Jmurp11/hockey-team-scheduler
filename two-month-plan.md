# RinkLink.ai — 60-Day Plan: Finish, Focus, Sell One Membership

_Window: **2026-07-20 → ~2026-09-18** (60 days)_
_Goal: **one signed, paid membership** from a youth-hockey program you already have access to._

**Inputs this plan is built on:** [`rinklink.md`](./.claude/context/rinklink.md) (vision), [`challenges.md`](./.claude/context/challenges.md) (MHR dependency + seasonal gap), [`improvements.md`](./improvements.md) (code-level review), [`savior.md`](./savior.md) (data strategy). Your constraints: **~$1k–5k/mo budget · strong warm network · ~10 hrs/week of your time.**

---

## 0. The one-sentence reframe

> **You do not have a marketing problem. You have a "finish the security pass, pick one honest thing to sell, and ask one warm contact to buy it" problem — and your only real bottleneck is your 10 hours a week.**

Everything below follows from that. The plan spends money to protect your time, keeps the first sale founder-led (because you have the access and it's the only way to learn), and refuses to build anything — funnels, ads, decks, features — that doesn't move a specific warm buyer toward "yes."

---

## 1. The three facts that make 60 days realistic

1. **The scary engineering is mostly done.** Your current branch (`feat/jm/change-price`) already: removed the shipped Supabase **service-role** key and swapped in a publishable key (`environment.ts`); fixed the always-true `ApiKeyGuard` (it now `await`s `validate()`); added a real per-user **`SupabaseAuthGuard`** (JWT) with a `@Public()` opt-out; and reworked `main.ts`, `app.module.ts`, `user.controller.ts`, and `confirmation.service.ts`. That's the heart of `improvements.md`'s P0 list (#1, #2, #3, #4, #5, #6). **You are not starting — you are finishing.**

2. **You only need one yes.** One membership doesn't need SEO, ads, a launch, or a sales team. It needs ~5–8 real conversations with people who already trust you. You said you have several. That is the whole growth engine for 60 days.

3. **The calendar is a story, not just a problem.** Yes, MHR is blank July→mid-September (`challenges.md`). But the features that don't touch MHR — schedule import, conflict/risk detection, travel summaries, tournament discovery, the AI copilot (`savior.md` Plan E + D) — work *today*. Opponent-finding "levels up" the exact week MHR refreshes in September, which lands inside your window. You sell the always-on value now and the September upgrade as the reason to commit now.

---

## 2. The gate: you cannot sell until the security pass is finished and verified

This is non-negotiable and comes first, because you're charging a **program** for a product that touches **minors' data**. Selling the old version would be a liability, not a milestone. The good news is you're close. Here is the finish-line checklist, mapped to `improvements.md`:

| # | Item | Status on branch | What remains |
|---|------|------------------|--------------|
| 1 | Kill shipped service-role key | ✅ web env swapped | **Rotate the old key in Supabase** (it's compromised in git history), fix `environment.prod.ts` + **both mobile envs**, and **turn RLS on for every table** with `auth.uid()` policies — the app may only "work" today because RLS is off |
| 2 | `ApiKeyGuard` rejects bad keys | ✅ now awaits | Keep the added spec passing |
| 3 | User module auth + ownership (IDOR) | ✅ controller reworked | Verify every `:id` route re-checks the JWT user owns/administers the target |
| 4 | AI can't send arbitrary email (open relay) | ✅ `confirmation.service` reworked | Confirm the confirm-path **re-derives** the action server-side from a stored pending record, not the client payload |
| 5 | Identity from JWT, not `dto.userId` | ✅ `SupabaseAuthGuard` added | Wire it as the global `APP_GUARD`; stop trusting body `userId`/`teamId` in the GPT + teams + tournaments flows |
| 6 | Global guard, `ValidationPipe`, throttler, helmet | 🟡 `main.ts`/`package.json` touched | Confirm all four are actually registered; add `class-validator` decorators to the DTOs on the endpoints your demo hits |
| 8 | PostgREST `.or()` filter injection | 🟡 `manager-search`/`user-access` touched | Confirm untrusted values use bound `.eq()`/`.ilike()`, not string-interpolated `.or()` |
| 15 | Email consent / CAN-SPAM | ❌ not addressed | **Don't build full compliance — sidestep it** (see §4): make outreach manager-initiated/consented, not cold-email-to-scraped-address, in a minors' context |

**Everything else in `improvements.md` (dead 2,348-line service #9, web/mobile duplication #21, ETL dedup #18, signals migration #23, etc.) is explicitly OUT of scope for these 60 days.** It's real debt, but none of it blocks one honest sale. Note it, don't do it.

---

## 3. Operating principles (because 10 hrs/week is the real constraint)

Your ~80 total hours over 60 days, allocated deliberately:

- **~15–20 hrs — direct & review engineering** (the *doing* is outsourced/automated; you steer and verify).
- **~40 hrs — the customer**: 5–8 conversations + concierge onboarding of #1. This is the only irreplaceable work.
- **~15 hrs — one clean demo path** (see §5) and pricing/checkout.
- **~10 hrs — buffer/admin.**

Rules:
- **Protect the 40 customer hours first.** If something threatens them, it gets cut or outsourced.
- **One demo path, ruthlessly.** Not the whole product — the single 8-minute flow that makes a manager say "I want this."
- **Ship to a staging URL a real manager can click,** not a localhost demo.
- **Weekly cadence:** every week ends with (a) the security checklist more done, and (b) at least one customer conversation booked or held.

---

## 4. Seasonality & the wedge — you're selling off-peak, on purpose

**The timing reality:** per `challenges.md`, most game scheduling is done by **late June/early July** — and it's July 20. So the natural *selling* season for this product is really **November–May**, when scheduling pain is anticipated or active. A July–September push is slightly upstream for the "schedule your games" hook. Don't fight it — use it. It's exactly why this plan is **one warm, founder-led, concierge sale** rather than a volume push, and it changes the *framing*, not the target.

**So change what the sale is ABOUT:** not "schedule your games faster this week" (already done), but **"get your program set up now — for the jobs that peak in August–September — and be ready for the spring scheduling rush where it saves the most time."** Program directors buy annually, in the **pre-season, for the coming cycle**; August–September is a genuinely good moment to close one because the season is starting and yearly decisions/budgets are being made.

**Lead with the jobs-to-be-done that actually peak now** (drop "schedule games" as the headline):

1. **Pre-season schedule *review*.** They built the schedule fragmented across emails and spreadsheets. RinkLink ingests it and surfaces double-books, brutal back-to-back travel weekends, and gaps **before the season starts** — a timely "check my work" moment in August (`savior.md` Plan E, no MHR needed).
2. **Fill the last holes.** "Most" scheduling done ≠ all. The remaining unfilled weekends and dropped-opponent gaps are the *highest-pain, hardest* games to fill — smaller volume, but exactly where the opponent finder earns its keep when **MHR refreshes in September, inside your window**.
3. **Tournament discovery + AI recommendations** — genuinely in-season right now; needs only the team's own age/level/location (`savior.md` Plan D).
4. **Travel/logistics + the AI copilot** over the manager's own schedule — *more* relevant as the season tips off in September than it was in June, because the games are now imminent.
5. **Opponent finder + AI email assistant** — demo it, but label projected/stale data honestly with a freshness badge, and frame the September MHR refresh as the built-in upgrade. Stretch: `savior.md` **Plan A (age-up carry-forward)** makes July not-empty — a *stretch*, not a gate.

**Your window improves toward its end, not degrades:** the September MHR refresh and the season start both land inside it — turning opponent-finding back on and making the coordination/travel value tangible right when you're trying to close.

**The outreach pivot that saves you weeks and legal risk:** don't build CAN-SPAM/unsubscribe/verified-domain machinery (`improvements.md` #15) in this window. Instead, make the email assistant **draft for the manager to send from their own identity**, or gate sends to consented contacts. Same feature, no open-relay/minors'-privacy exposure, and it's *less* work than compliance. (This is `savior.md` Plan C's consented model in miniature.)

---

## 5. The one demo path (build/verify this, nothing else)

A single flow a warm manager can run end-to-end on staging in ~8 minutes:

1. Sign in (real JWT auth — the thing you just built).
2. Import / connect a team schedule.
3. See **risks + travel summary** appear automatically.
4. Ask the **AI copilot** two questions about their own schedule.
5. Get **1–2 tournament recommendations** for their team.
6. Draft one outreach email (manager-sent).

If a step is flaky, fix that step — not adjacent features. This flow *is* the product for 60 days.

---

## 6. Improve-vs-Outsource — the decision that fits your constraints

Your budget ($1k–5k/mo) + your scarcity (10 hrs/wk) + your asset (warm network) point to a clear split:

| Work | Do it yourself | Outsource / automate | **Recommendation** |
|------|----------------|----------------------|--------------------|
| **Finish security + RLS + tests** | You *review* | Claude Code as primary implementer; optional fractional NestJS/Angular contractor | **Outsource the doing.** Drive it with Claude Code (~$100–200/mo) in your review hours. If you want it off your plate faster, add a **fractional contractor for 2–3 weeks (~$1.5–3k)** to close RLS policies, DTO validation, and tests. |
| **The demo path polish** | You decide the flow | Contractor/Claude Code implements | Mixed — you own the script, they smooth the rough steps. |
| **Selling membership #1** | **YOU. Do not outsource.** | — | **Founder-led, always.** A hired rep cannot out-sell you to your own contacts on an unproven product, and you need the customer-discovery signal firsthand. This is your unfair advantage — use it. |
| **Marketing (funnels, ads, SEO, content)** | — | Defer entirely | **Not now.** You don't market to sell one warm deal. Options for *later* in §9. |
| **Pricing / Stripe checkout** | You set price | Stripe already wired | You — it's a 1-hour decision, not a project (your branch is literally `change-price`). |
| **Sales confidence / structure** | You run the calls | Optional: a few hours with a fractional sales coach/advisor | **Improve, don't outsource.** If sales scares you, spend ~$300–800 on **2–3 sessions with a B2B sales coach** to build your call script and role-play objections — far better ROI than hiring a closer for one deal. |

**Bottom line:** outsource the *code*, coach (don't outsource) the *selling*, defer *marketing* completely. Your money buys back engineering time so your 10 hours go to customers.

---

## 7. The 60-day schedule (week by week, tuned to 10 hrs/wk)

### Phase 1 — Finish the gate + line up the buyers (Weeks 1–2, Jul 20 → Aug 2)
- **Eng (outsourced/CC, you review):** complete §2 checklist — **rotate the Supabase key**, fix prod + mobile envs, **enable RLS + write policies**, register global JWT guard + `ValidationPipe` + throttler + helmet, confirm the AI confirm-path re-derives server-side. Merge `feat/jm/change-price`.
- **You:** write your **target list of 5–8 warm programs/managers** (name, relationship, why they'd care). Draft the outreach message (§8). Book the first 2–3 conversations — "I've been building this, I'd love 20 min of your honest reaction," *not* a pitch yet.
- **Exit criteria:** branch merged; RLS on and verified; 2–3 calls on the calendar.

### Phase 2 — One clean demo + first conversations (Weeks 3–5, Aug 3 → Aug 23)
- **Eng:** harden the single demo path (§5) on a staging URL. Fix only what's on that path. (Stretch: Plan A age-up if capacity allows.)
- **You:** run 4–6 discovery/demo conversations. Goal is *learning + one champion*, not closing yet. Ask what they do today, time it costs, what they'd pay to remove. Show the 8-min flow. Note every objection.
- **You:** set the founding-member price (§8) and confirm Stripe checkout works end-to-end with a real card.
- **Exit criteria:** ≥4 conversations held; ≥1 clearly interested "champion" program; demo runs clean; checkout works.

### Phase 3 — Concierge the first sale to close (Weeks 6–9, Aug 24 → Sep 18)
- **You:** turn the champion into customer #1 with a **white-glove pilot → paid** motion (§8). Personally onboard them — import their schedule *for* them, sit with them on the copilot, hand them tournament recs. Remove every ounce of friction.
- **Timing lever:** the **September MHR refresh lands here** — use "opponent finding turns on this month" as the reason to commit now.
- **You:** ask for the close. Take the payment. Get a short testimonial + a written note of what they'd want next.
- **Exit criteria:** **one paid membership.** If it slips, you have a ranked list of exactly why (the most valuable output either way).

---

## 8. The founder sales playbook (for someone who "struggles with sales")

You're not cold-calling strangers; you're asking people who trust you for a favor and a fair trade. Structure removes the fear.

**Target list (do this first):** 5–8 named programs/managers you can reach directly. Rank by (a) warmth and (b) whose pain is **still live right now** — prioritize **new teams** (finalize late), **tournament-heavy teams** (schedule year-round), known **late schedulers**, and **multi-team associations** (someone always has open gaps). Don't lead with whoever already finished; concierge the one still hurting this week.

**Opening message (soft, not a pitch):**
> "Hey [name] — I've spent the last while building an AI scheduling tool for youth hockey managers (risk detection, tournament finder, an assistant that drafts your opponent emails). Before I take it wider I really want the honest reaction of someone who lives this. Could I grab 20 minutes to show you and hear where it's useful vs. useless?"

**The call shape (20 min):** 5 min their world (what scheduling costs them today) → 8 min the demo path (§5) → 5 min "if this saved you X hours a season, what would make it a no-brainer to use with your program?" → 2 min next step.

**The offer for customer #1 — concierge pilot → paid:**
> "Let me set your program up myself as a founding member. I'll import the schedules you already built, stress-test them for conflicts and travel before the season, point you at tournaments, and help fill any gaps still open. If it's saving your managers time after two weeks, you keep it at the founding-member rate — and you're locked in for the spring scheduling rush. If not, we walk away, no charge."

Low risk for them, high learning for you, and it ends in a real payment decision.

**Pricing (a hypothesis to test, not a science):**
- **Recommended anchor:** a **founding-program season membership, flat, ~$499–$999** for up to N managers — matches your original intent (programs buying for their managers) and is a stronger proof point than a $19 individual seat.
- **Simpler alternative if the program deal stalls:** a single **team-manager membership at ~$25–39/mo** to get the first paid "yes" faster, then expand.
- Don't over-optimize. The goal is *a signed, paid decision*, which validates willingness-to-pay. Your branch is already `change-price` — pick a number, put it behind Stripe, move on.

**Objection prep (script these with a coach if helpful):**
- *"We already finished scheduling for the year."* → "Exactly why now's the right time — I'm not asking you to redo it. Let me stress-test the schedule you just built for conflicts and travel before the season, help fill any gaps still open, point you at tournaments, and get you set for next spring at the founding rate. Opponent finding also switches back on when the rankings refresh in September."
- *"The team data looks stale / my team isn't in here."* → "That's the July gap — MHR refreshes in September, and it's built to level up automatically then. Meanwhile the risk detection, travel, tournament finder, and email assistant all run on *your* schedule today."
- *"Is our data safe?"* → You can now answer truthfully: per-user auth, row-level security, no service key in the app. (This is *why* §2 comes first.)
- *"I'll think about it."* → "Totally fair — can I just set you up as a founding member for two weeks so you're deciding on the real thing, not the idea?"

---

## 9. Marketing — deliberately deferred, with options for when you're ready

You asked for improve-or-outsource options. For selling *one* membership: **do neither — skip marketing.** For scaling *after* #1, here's the menu (revisit in ~60 days):

- **Improve (cheap, you-led):** a testimonial from customer #1 → 3–4 more warm intros from them; a simple case study; showing up where hockey managers already are (association meetings, rink bulletin boards, Facebook manager groups).
- **Outsource (when you have budget + a proven pitch):**
  - **Fractional/part-time BDR with hockey connections** (~$1–3k/mo + commission) — only *after* you've personally closed 1–3 and know the pitch that works.
  - **Niche content/newsletter freelancer** for hockey-parent/manager audiences (~$500–1.5k/mo).
  - **Targeted sponsorship** of a youth-hockey newsletter/podcast over broad ads.
- **What to avoid now:** SEO projects, broad paid ads, a big website rebuild, hiring a closer for deal #1. All are premature until the pitch is proven by you.

---

## 10. Definition of done & the metrics that matter

**Primary success:** **1 paid membership** by ~Sep 18. That's the whole game.

**Leading indicators (track weekly):**
- Security checklist items closed (target: 100% by end of Week 2).
- Warm conversations held (target: 5–8 over the window).
- Champions identified (target: ≥1 by Week 5).
- Demo path clean end-to-end on staging (target: Week 4).

**If you get the "yes":** you've proven willingness-to-pay and earned the right to think about #2–10.
**If you don't:** you'll have a merged security pass, a working demo, and a ranked, evidence-based list of exactly why buyers hesitated — which is the input to the *next* 60 days, and worth more than a guess.

---

## 11. Top risks & mitigations

| Risk | Mitigation |
|------|------------|
| Security pass drags and eats the whole window | It's ~70% done; cap it at 2 weeks; outsource the tail to a contractor if it slips |
| You spend 10 hrs/wk on code, zero on customers | Hard rule: customer conversations are booked *first* each week, code fills the rest |
| Demo breaks live | Rehearse the exact 8-min path on staging before every call; fix only that path |
| Selling off-peak — most scheduling already done | Reframe the sale as a pre-season/next-cycle decision (§4); lead with schedule review, gap-filling, tournaments; target buyers whose pain is still live (§8) |
| July data looks empty and kills trust | Lead with MHR-independent features; frame September refresh as the upgrade; (stretch) Plan A age-up |
| Legal exposure from cold email to scraped contacts (minors) | Pivot to manager-sent/consented outreach now — cheaper than compliance |
| The one warm deal stalls | Have 5–8 in the pipeline, not 1; concierge pilot lowers their risk to near zero |

---

_Next action (this week): finish the §2 security checklist to merge-ready, and send the §8 opening message to your top 2–3 warm contacts. Those two moves, done this week, put the whole 60 days on track._
