# RinkLink.ai — Pricing, Registration & Unit Economics Review

_Companion to [`two-month-plan.md`](./two-month-plan.md), [`improvements.md`](./improvements.md), [`savior.md`](./savior.md). Reviewed against the actual code._

**Goal:** make the business **profitable** and **attractive to customers** — resolved by the core principle below.

> **Attractiveness comes from lower *friction* and a free always-on hook, not from a low *price*. You can raise the price AND become more attractive by fixing the registration funnel and adding a free single-player tier.**

---

## 1. What you charge today (the facts)

- **$50 per seat per year, annual recurring.** Charged as an inline Stripe `price_data` object (`PRICE_PER_SEAT_CENTS = 5000`, `apps/api/src/user/user.service.ts:229`), **not** a reusable Stripe Price ID. Single plan, seat-count stepper (`apps/web/.../pricing/pricing.component.ts`).
- A separate **developer/API** product uses a real Stripe Price ID (`STRIPE_API_PRICE_ID`, `developer-portal.service.ts:45`) — distinct from the $50 app seat.

### Inconsistencies (fixed in this pass — see §5)
| Issue | Where | Problem |
|---|---|---|
| **$75 vs $50** | SEO structured data said `price: '75.00'` (`pricing.component.ts:188`) vs $50 everywhere else | Google could show **$75** in rich results while the page said $50 |
| **"Free trial available"** | SEO copy (`:167`) | **No trial exists in code** — only a 30-day money-back guarantee. Claiming a trial you don't offer invites chargebacks and erodes trust |
| **Stale checkout test** | `user.service.spec.ts` asserted `unit_amount: 3000` | Price was mid-change ($30→$50) and the test wasn't updated — it was failing on this branch |

---

## 2. Registration — the bigger problem than the price

**The front door is a paywall.** Flow: **Stripe Checkout (email + seats) → webhook creates the user → magic link → 7-field "Complete Profile" → done.** People **pay before they have an account or have seen the product.**

Friction / blockers:
- Email entered up to **3 times**; password chosen **after** paying; **cross-channel** (leave app → check email → magic link).
- **A new user's team must already exist in the DB or registration hard-fails** ("Invalid team selected," `user.service.ts:810`). Since new teams aren't in MHR from March–September (`challenges.md`), **a real spring/summer buyer literally cannot complete self-serve signup.** This is a wall, and it contradicts the "claim your team" direction in `savior.md`.
- **Security:** `complete-registration` is `@Public()` and trusts `body.userId` to set a password — self-documented account-takeover risk. App routes gate on `isAppUser` (row exists), **not** `userHasAccess` (active subscription), so a lapsed subscriber still gets in.

**Implication for the 60-day one-sale goal:** don't send your warm buyer through this funnel. **Concierge them** — create their account + team server-side and hand them a working login. Given the "team must pre-exist" wall, concierge is currently *required*, not just nicer.

---

## 3. Is $50/user/year right? Mostly no

Three things are off:
1. **Likely underpriced.** If RinkLink saves a manager 10–20 hrs/season, $50/yr (~$4/mo) is a rounding error — and cheap pricing signals low value in B2B.
2. **Wrong unit for your buyer.** You want to sell to *associations*, but the page sells *individual seats*. An association thinks in **teams** (≈ one manager per team).
3. **No anchor, no tiering, annual-only.** One plan can't capture the association willing to pay 5× a solo manager, and annual-upfront is high friction for a first purchase.

### Target structure (30–60 days, for scaling)

There are only **two buyer types**, not three. "Program," "association," "club," and "organization" are the **same entity** (RinkLink's schema only has `associations`) — big-vs-small is a *volume band inside the org tier*, not a separate tier. Standardize on one term — **"Association"** matches your DB and USA Hockey's language.

| Tier | Who | Price *(hypothesis to test)* | Purpose |
|---|---|---|---|
| **Free / Copilot** | single manager, limited | $0 | Top-of-funnel hook on MHR-independent features (Plan E); feeds "claim your team" |
| **Manager** | individual, 1 team | ~$99/yr | Single-player entry; ROI story sells itself |
| **Association** *(your real target)* | the multi-team org | **per team**, with volume bands (e.g. 1–10 / 11–25 / 26+); largest → "Contact us" for a custom quote | One buyer, priced by scale — not two tiers |

Add a **monthly option** (with an annual discount) to lower first-purchase friction. Add a **genuine free tier** on the always-on copilot — those features don't need MHR, so they're the ideal no-risk hook. Per-team is the natural unit because an association thinks in teams (≈ one manager each), and it scales revenue with org size without needing separately-named plans.

**For the first warm sale (now):** don't over-engineer tiers. Use a **founding-program price + concierge onboarding**. Tiering is scale work — after the yes.

---

## 4. Profitability — the model price is NOT your main lever

**Your biggest margin risk isn't per-token price — it's that per-request AI cost is unbounded against a fixed $50/year.** Per `improvements.md` #10/#11: no `max_tokens`, no timeouts, no history windowing; one chat fans out to supervisor × N `gpt-4o` agents × email draft × `gpt-5-mini` web searches with no ceiling. A single power user or runaway loop can burn a year's margin in a week.

**Order of operations for margin:**
1. **Bound cost per request** — `max_tokens`, client timeouts, conversation-history windowing, per-user/request budget cap. Biggest lever, **provider-independent**.
2. **Cache more** — contact lookups already cache (`open-ai.service.ts:79`); extend the pattern.
3. **Then** provider arbitrage (Kimi).

### Kimi K3 at ~10% — worth it, with caveats
Not a one-line `baseURL` flip:
- **You instantiate `new OpenAI()` in ≥3 places** (`open-ai.service.ts`, `game-matching.service.ts`, `rinklink-gpt/shared/openai-client.provider.ts`) with no shared config, plus **~10 hardcoded model-ID strings**. **Centralize into one provider module first** (config-driven `baseURL` + model IDs) — which also fixes the missing timeouts/caps. Then provider becomes a per-call-site config switch.
- **Some calls won't port cleanly.** Contact discovery + web search use OpenAI's **Responses API with the built-in `web_search` tool and `zodTextFormat` structured outputs** (`open-ai.service.ts:87–95`, `manager-web-search.agent.ts`). Kimi/Moonshot is OpenAI-compatible for **chat.completions + tool calling**, but the Responses API + built-in web search are OpenAI-specific. Those paths need a separate search provider or stay on OpenAI.
- **Quality-gate before switching.** A 90%-cheaper model that hallucinates a manager's email costs *trust*, not tokens — especially since you already store unverified LLM-found emails (#14). A/B contact-extraction and email-draft quality before flipping.
- **Recommendation: hybrid.** Route high-volume/low-risk calls (routing `gpt-4o-mini`, schedule Q&A, email drafts) to Kimi; keep OpenAI (or add verification) for web-search contact extraction. Validate each path before flipping.
- **Unverified:** "K3" specifics aren't confirmable here (knowledge cutoff Jan 2026). Treat the 10% figure as your premise; confirm quality/limits/tool-calling reliability on their platform before real traffic.

---

## 5. What was changed in this pass (code)

Safe, non-breaking edits on the `feat/jm/change-price` branch:

1. **Stripe Price ID support (non-breaking).** `user.service.ts` now uses `STRIPE_PRICE_ID` if set, else falls back to the existing inline $50 price. Also enabled `allow_promotion_codes: true` so a **founding-member coupon** works at checkout.
2. **$75 → $50** corrected in the pricing page's Product structured data (`pricing.component.ts`).
3. **Removed the false "Free trial available"** SEO claim → "30-day money-back guarantee"; reworded the FAQ to match.
4. **Fixed the stale checkout test** (`unit_amount` 3000→5000, added `allow_promotion_codes`). `nx test api` → 30/30 pass.

### Still requires YOUR action (can't be done in code alone)
- **Create the Stripe Price** in the Dashboard ($50/yr recurring) and set `STRIPE_PRICE_ID` in the API env — then checkout uses managed pricing and you can run price experiments without deploys.
- **Create a founding-member coupon** in Stripe for your first warm deal.
- **Decide the new price/tiers** (§3) — the branch is literally `change-price`; pick numbers and test.

---

## 6. Priority, mapped to the 60-day / 10-hr-week reality

1. **This week (trust + first sale):** ✅ $75/trial fixes + Price-ID scaffolding done → create the Stripe Price + founding coupon; **concierge your first buyer** (bypass the broken funnel).
2. **Weeks 2–4 (margin protection):** add token caps / timeouts / history windowing *before* onboarding a paying power user.
3. **Weeks 4–8 (scale economics):** centralize the AI client → migrate low-risk calls to Kimi; design the per-team Association pricing + free copilot tier.
