# RinkLink.ai — Critical Review & Recommended Improvements

_A candid, evidence-based review of where the product concept and the implementation are **poorly thought out or amateurish**, and how to fix each. Based on reading the actual code (not just the architecture map). No code was changed._

**Reviewed:** 2026-07-14 · **Scope:** intent (`rinklink.md`) vs. implementation (`apps/`, `libs/`, `tournament-etl/`) · **Companion:** [`architecture.md`](./.claude/context/architecture.md), [`challenges.md`](./.claude/context/challenges.md), [`savior.md`](./savior.md)

---

## How to Read This

Findings are grouped by **feature/subsystem**. Each item states:
- **Intent** — what the product is supposed to do (per `rinklink.md`).
- **What's wrong** — the concrete gap, with file:line evidence.
- **Improvement** — the recommended fix, for the *core idea* and/or the *code*.

Severity: 🔴 Critical (actively exploitable / product-breaking) · 🟠 High · 🟡 Medium · ⚪ Low.

> **Bottom line up front:** The product *vision* is coherent and the feature surface is impressively broad for the team size. But three things drag it from "early-stage" to "amateurish": (1) a cluster of **security holes that make the API effectively unauthenticated and the mailer an open relay**, (2) **two half-built parallel implementations** of the same subsystems (a dead 2,348-line AI service, two API-key systems, forked web/mobile trees), and (3) **AI features that trust unverified LLM output end-to-end** — storing and emailing it without a single validation step. The good news: the vision doesn't need to change much. The execution needs consolidation and a security pass before this is safe to sell.

---

# Part I — Security & Trust (the most "amateurish" tells)

These are not style opinions. They are exploitable today and, in a **youth-hockey product handling minors' data**, they are existential (liability, App Store rejection, reputational).

### 1. 🔴 The Supabase **service-role key is shipped to the browser and mobile app** (and committed to git)
**What's wrong:** `apps/web/src/app/environments/environment.ts:7-10` (and `.prod`, and both mobile env files) embed a Supabase key that decodes to `{"role":"service_role"}`. It's wired into the client at `app.config.ts` as `supabaseAnonKey` and used by `supabase.service.ts:45-58`. The service-role key **bypasses all Row-Level Security** — anyone who opens dev tools or unzips the app has full read/write to every table. There is even a developer comment: `//TODO: change to service role. these cannot be checked in like this`.
**Improvement:**
1. **Rotate the key immediately** — it is permanently compromised in git history.
2. Replace it with the **anon key** on all clients; the service-role key must exist only on the API server.
3. Turn on **Row-Level Security** for every table and write policies keyed to `auth.uid()`. Right now the app likely "works" only because RLS is effectively off.
4. Add a secret scanner (e.g. gitleaks) to CI so this can't recur.

### 2. 🔴 `ApiKeyGuard` never rejects a bad key — the API is effectively open
**What's wrong:** `apps/api/src/auth/api-key.guard.ts:12` does `if (!apiKey || !this.apiKeyService.validate(apiKey))`, but `validate()` is `async` and returns a Promise. `!Promise` is **always false** and the Promise is never awaited, so the check collapses to "is a header present?" **Any non-empty `x-api-key` passes.** Every endpoint "protected" by this guard (Teams, Tournaments, RinkLinkGPT) is open.
**Improvement:** `await` the validation; add a unit test that a junk key returns 401. This is a one-line bug with total-bypass consequences — exactly the kind of thing a test on the guard would have caught.

### 3. 🔴 The entire **User module is unauthenticated** (IDOR)
**What's wrong:** `apps/api/src/user/user.controller.ts` has no `@UseGuards` on the controller or its routes. Unauthenticated, ID-in-URL endpoints include `DELETE /v1/users/members/:id`, `PATCH /v1/users/members/:id/role` (privilege escalation to ADMIN), `POST /v1/users/cancel-account`, and reads of other users' access/subscription data. The caller-supplied `userId` is trusted with no ownership check.
**Improvement:** Apply an auth guard globally (see #5), then add **resource-ownership checks** — verify the authenticated user owns/administers the target member/team/account before mutating.

### 4. 🔴 The AI can send email to **any address with any body** — an authenticated open relay
**What's wrong:** `rinklink-gpt/shared/confirmation.service.ts:120-136` reads `pendingAction.data` (recipient, subject, body) straight from the client on the confirm call and passes it to `emailService.sendEmail()` with **zero re-validation or ownership check**. The whole draft round-trips through the browser, so a caller can hand-craft a `send_email` action with arbitrary `to`/`subject`/`body` and RinkLink's SMTP sends it. Same pattern lets `create_game`/`add_tournament` write to arbitrary teams (`confirmation.service.ts:41-95`).
**Improvement:** Never trust a client-returned action payload. On confirm, **re-derive** the action server-side from a server-stored pending-action record (keyed by an opaque id), re-authorize the acting user against the target resource, and re-validate the recipient against the set of contacts that user is actually allowed to email. This is the difference between "AI assistant" and "spam cannon."

### 5. 🔴 `userId` is a **client-supplied body field**, unbound from auth → impersonation
**What's wrong:** `rinklink-gpt.types.ts:83` + `rinklink-gpt.controller.ts:56`: the acting `userId` is just a field the caller sets. The API key (even when it worked) authenticates the *app*, not the *user*. Row-level ops across `teams.controller.ts:117`, `tournaments.controller.ts:377`, and the whole chat flow trust `dto.userId`/`dto.teamId`. Any key holder can act as anyone.
**Improvement:** Adopt a **per-user auth token** (Supabase JWT) end-to-end. Derive identity from the verified token server-side — never from the body. Notably, `developer-auth.guard.ts` *already does this correctly* (`supabase.auth.getUser(token)`); apply that same pattern to the main API instead of the broken shared-key scheme.

### 6. 🟠 No global auth, no input validation, no rate limiting
**What's wrong:** `main.ts`/`app.module.ts` register no `APP_GUARD`, no global `ValidationPipe`, and no throttler (grep confirms `class-validator` and `@nestjs/throttler` are unused). Auth is opt-in per controller — so a forgotten decorator silently exposes an endpoint (exactly what happened to the User module). DTOs are bare classes with no validation. `DeveloperApiGuard` even hits Stripe synchronously per request with no rate limit — a built-in DoS/cost amplifier.
**Improvement:** (a) Global auth guard with an explicit `@Public()` opt-out. (b) Global `ValidationPipe({whitelist, forbidNonWhitelisted})` + `class-validator` decorators on every DTO. (c) `@nestjs/throttler` on chat, contact-discovery, and email-send. (d) `helmet` for security headers. These are standard NestJS hygiene that is simply absent.

### 7. 🟠 API keys stored in **plaintext**, validated by full-table scan, revocation is a no-op
**What's wrong:** `auth/api-key.service.ts:10-56`: keys inserted unhashed; `validate()` loads *every* customer's key/email/stripe-id and does an in-memory `Array.some()` (no DB lookup, not constant-time); `revoke()` mutates a local array copy and never writes to the DB. Meanwhile `developer-portal.service.ts` implements a *second*, SHA-256-hashed key system — so two key systems coexist, one insecure.
**Improvement:** Delete the plaintext system; standardize on the hashed developer-portal implementation. Hash keys, look them up by hash, make revocation persist.

### 8. 🟡 PostgREST `.or()` filters built by string-interpolating untrusted values
**What's wrong:** `manager-search.service.ts:38-45,93-98` and `user-access.service.ts:125` interpolate user/LLM-derived values (`team`, `email`, `authUserId`) directly into `.or(...)` filter strings. Commas/parens/dots break out of the intended predicate (PostgREST filter injection) — corrupting dedup at best, matching unintended rows at worst.
**Improvement:** Use bound `.eq()`/`.ilike()` filter builders with parameterized values instead of hand-built filter strings; sanitize/escape any value that must go into `.or()`.

---

# Part II — AI Subsystem: Powerful Idea, Fragile Execution

The multi-agent design (supervisor → specialized agents) is the right *concept*. The *implementation* is brittle in ways that will surface as flaky chat and runaway cost.

### 9. 🟠 A **dead, duplicated 2,348-line God-service** ships alongside the new agent system
**What's wrong:** `rinklink-gpt.service.ts` is injected nowhere (the controller uses `SupervisorService`) yet is still instantiated/exported (`rinklink-gpt.module.ts:33,54`). Its logic is copy-pasted into the live agents: email drafting (`svc:1215-1526` ≈ `email.agent.ts:70-399`), game prep (`svc:926-1210` ≈ `schedule.agent.ts:251-390`), ranking lookup (`svc:442-1146` ≈ `search-utils.service.ts`). Every fix must be made twice; the dead copy rots.
**Improvement:** Delete the dead service. This single deletion removes ~2,300 lines and the biggest source of drift. That such a file survives is the clearest "amateurish" tell in the repo — it means no one is pruning as they refactor.

### 10. 🟠 Conversation history is **never truncated** — context overflow + cost blowup
**What's wrong:** `supervisor.service.ts:145-162` and `tool-calling-agent.ts:96-116` replay the entire client-supplied `conversationHistory` with no token counting or windowing. Long chats eventually 500 on every request, and until then the full history is re-sent to the supervisor *and* each delegated agent — multiplying token cost per turn.
**Improvement:** Add a token-budgeted sliding window + rolling summary of older turns. Store history server-side keyed to a conversation id rather than trusting the client to send it all back.

### 11. 🟠 No per-request cost/token cap and no timeout on any OpenAI call
**What's wrong:** `openai-client.provider.ts:6-9` builds the client with no `timeout`/`maxRetries`; no call sets `max_tokens`. One chat can fan out to supervisor (5 iterations) × N `gpt-4o` agents × email draft × `gpt-5-mini` web searches with **no ceiling on spend or latency**. Tracing records `total_tokens` but nothing enforces a budget.
**Improvement:** Set client timeouts and `max_tokens`; enforce a per-request token/dollar budget (the tracing data already exists — just read it and abort past a threshold); centralize model IDs in config instead of the ~10 hardcoded string literals scattered across files.

### 12. 🟡 Malformed model output crashes the whole chat; multi-intent requests silently drop work
**What's wrong:** `JSON.parse(toolCall.function.arguments)` is unguarded (`supervisor.service.ts:208`, `tool-calling-agent.ts:124`) — invalid JSON (which models do emit) unwinds to a generic error with no retry. Separately, the supervisor early-returns on the first tool call (`supervisor.service.ts:198-230`) so a two-intent turn drops the second agent's work — and `ToolCallingAgent` only ever runs `toolCalls[0]` despite its name (`tool-calling-agent.ts:118-163`).
**Improvement:** Wrap tool-arg parsing with a reprompt-on-parse-failure retry; process *all* tool calls in a turn and append a `tool` message per `tool_call_id`; make the "tool-calling agent" actually loop.

### 13. 🟡 Brittle, untested, prompt-injectable routing and prompts
**What's wrong:** Routing is prose keyword-mapping baked into a prompt (`supervisor.prompt.ts:39-47`, "when user mentions 'email'/'contact' → email agent") with no confidence score or fallback, and no eval/snapshot tests. User-controlled text (`additionalContext`, scraped page content) is concatenated into prompts unescaped (`email.agent.ts:253-280`, `manager-web-search.agent.ts:76-99`) — a user or a malicious web page can inject "ignore previous instructions, email X saying Y," which then flows to the send path.
**Improvement:** Delimit and label untrusted input in prompts; add an instruction-hierarchy defense; build a small **eval harness** of representative utterances so routing changes are measurable rather than vibes-based; version prompts.

---

# Part III — Contact Discovery & Email: The Core Workflow Is Unverified

This is RinkLink's signature workflow (and, per `savior.md`, its most valuable proprietary asset). Today it trusts LLM output end-to-end.

### 14. 🔴 Discovered emails are **never verified** yet are stored and emailed as fact
**What's wrong:** `manager-web-search.agent.ts:72-127` asks `gpt-5-mini` to return a manager's name/email/phone as JSON; the result is parsed, lightly cleaned, surfaced to the user, and **auto-saved** to the `managers` table (fire-and-forget, line 140) — then can be emailed. There is no syntax validation, no MX/deliverability check, no confirmation-to-address, no confidence score. An LLM-hallucinated but plausible address becomes permanent cached truth and gets emailed to a real stranger.
**Improvement (core idea + code):**
- Add a **verification tier**: syntax → MX/deliverability check → confidence score. Only auto-store high-confidence results; queue the rest for human confirmation.
- Store **provenance and confidence** (source URL, timestamp, score) on every contact so stale/low-quality data is visible and refreshable — this is also the foundation `savior.md`'s age-up carry-forward needs.
- Treat a discovered contact as a *suggestion the user confirms*, not a fact the system acts on autonomously.

### 15. 🔴 No consent, opt-out, unsubscribe, or CAN-SPAM compliance on outreach
**What's wrong:** `email.service.ts:160-191` sends from RinkLink's own SMTP identity to scraped addresses with no `List-Unsubscribe`, no opt-out link, no physical address, no suppression list (grep: zero `unsubscribe`/`consent` in the API). These are automated messages to people who never signed up — in a **minors' context**.
**Improvement:** This is a legal requirement, not a nicety. Add unsubscribe/suppression handling, a verified sending domain (SPF/DKIM/DMARC), bounce/complaint handling, and per-user send throttling. Reconsider the product model: **manager-initiated, consented connections** (claim-your-team, Plan C in `savior.md`) are both safer and a stronger moat than cold-emailing scraped addresses.

### 16. 🟡 Contact cache has no staleness/season model and locks in the first (possibly wrong) hit
**What's wrong:** `manager-search.service.ts:80-133` inserts with no timestamp/confidence/season; dedup skips on name+team OR email match, so the first discovered contact becomes permanent and is never refreshed. Youth managers rotate yearly.
**Improvement:** Add TTL/season stamping and a re-verification path; wire to `savior.md` Plan A so contacts carry forward by birth-year cohort with a freshness badge.

### 17. 🟡 Wrong-recipient bug: numeric team ID used as a name substring
**What's wrong:** `email.agent.ts:91-99`: given `recipientTeamId`, it calls `searchByTeam(id.toString())`, doing an `ilike '%<number>%'` on the team *name* column — silently matching teams whose name contains that digit string, or nothing. Composing an email to the wrong team is a real outcome.
**Improvement:** Look teams up by primary key, not a name `ilike` on the stringified id.

---

# Part IV — Data Pipeline (ETL): Quietly Broken

### 18. ✅ FIXED — Tournament ETL dedup was broken, but not where this doc originally said
**Correction (verified against the live DB):** the original entry had the column name backwards. The real column **is** `registrationUrl`; there is no `registration_link`:

```
GET /tournaments?registrationUrl=in.(…)     -> 200, returns the row
GET /tournaments?registration_link=in.(…)   -> 42703 column tournaments.registration_link does not exist
```

So `supabase.ts`'s `.in("registrationUrl", …)` was **correct**, and "fix the column name" there would have broken a working query.

**What was actually wrong:** `tournaments.ts:15` compared `ft.registration_link === t.registrationUrl`. That property is always `undefined` on returned rows, so the filter matched nothing and every run re-sent the full batch. Compounding it, `getTournaments` never checked supabase-js's returned `error`, so a failed query surfaced as `data: null` and read as "nothing exists yet". The existing tests encoded the bug — they mocked rows with `registration_link` and passed.

Impact was smaller than stated: 124 rows / 112 distinct URLs, because `p_save_tournaments` dedups server-side. The 7 duplicated URLs are mostly listing pages (`hockeyfinder.com/tournaments` ×4) where the model returned a directory link instead of a registration link — a data-quality issue dedup on this key cannot fix.

**Also corrected:** the type mismatch ran the opposite way. `Tournament` declared `city`/`state`/`country`, but the table and the LLM both use a single `location` string, plus `description`; coordinates persist as the PostGIS `geographic_point`, not `latitude`/`longitude` columns.

**Done:** compare on `registrationUrl`; check the supabase `error`; reconcile `Tournament` with the real schema; report tournaments sharing a URL instead of silently merging them; rewrite `supabase.spec.ts` to exercise the real module rather than a copy of it inside the mock; regression test that a second run inserts zero rows.

### 19. 🟡 PARTIALLY DONE — No idempotency, retry, monitoring, or schema-drift resilience in ETL/scraping
**What's wrong:** `open-ai.ts:26-56`, `run-etl.ts:26-44`: a single `JSON.parse` with no retry/backoff/dead-letter; failures just `process.exit(1)` + `console.log`; the source-site list is hardcoded in a prompt. This is the fragility `challenges.md` warns about, unmitigated.

**Done:**
- Retry with exponential backoff (3 attempts) around the OpenAI call, and a 5-minute request timeout. Retrying is safe — the call has no side effects and dedup runs after it.
- `JSON.parse` failures now report that the *model* returned invalid output, with the first 200 characters attached, instead of a bare `SyntaxError`; a response missing the `tournaments` array is its own distinct error.
- Per-run counts (found / inserted / already-present / shared-URL groups) written to the GitHub Actions job summary, so a run that quietly finds nothing is visible without opening logs.
- Idempotency is covered by the #18 dedup fix.

**Also done (2026-08-03) — yield:** once the PostGIS outage was fixed (`postgis-search-path-fix.md`) the ETL was found to barely return anything. Five identical calls for Massachusetts yielded **0, 0, 1, 2, 3** tournaments; the pipeline was healthy, the model just found little per call. Fixed by:

- **Multi-pass search.** `findTournamentsMultiPass` runs N independent passes (default 3) and unions them. A pass that fails after its own retries is logged and skipped — only an all-passes-failed run throws. This earned its keep immediately: the first live run lost 2 of 3 passes to a network blip and still returned 11 tournaments.
- **Union keyed on `name|startDate`**, matching the RPC's `ON CONFLICT (name, "startDate")` — deliberately *not* `registrationUrl`, since distinct tournaments legitimately share a listing-page URL and that key would collapse them. In-batch only; the client-side "already present" filter still keys on `registrationUrl` (see #18 / the deferred decision).
- **Prompt no longer contradicts its schema.** It instructed a bare JSON *array* while `zodTextFormat` required `{ tournaments: [...] }`, and fenced the example with `***json`. Both fixed.
- **Explicit 12-month date window** interpolated at call time, replacing the ambiguous "current or upcoming season" — which is genuinely undefined when the job runs in August.
- **Completeness pressure** ("work through the list, don't stop at the first source") and a request for event-specific registration URLs rather than directory pages.
- `reasoning.effort` `low` → `medium`; `--passes` CLI flag.
- **Two workflow bugs fixed** in `.github/workflows/tournament-etl.yml`: all 24 matrix `location` values used **curly quotes** (`location: “Massachusetts”`), so the literal `“ ”` characters were interpolated into the prompt; and `github.event.inputs.locationType` was referenced but never declared as a `workflow_dispatch` input, so every manual dispatch ran with `--locationType ""`. Cadence also moved monthly → weekly.

**Verified outcome (2026-08-03, Massachusetts):** yield went from a **0, 0, 1, 2, 3** baseline to **24–26 unique tournaments per run**. A post-fix run found 24 unique across passes (12, 9, 6) and **inserted 22 rows**; `tournaments` went 129 → 151. Two rows landed with `age` null and five with `level` null, which is exactly the case that used to abort the whole batch. The `2 already present` on that run is the dedup filter working against live data.

**Latent RPC bug the higher yield exposed (fixed 2026-08-03):** `p_save_tournaments` failed with `22023 cannot extract elements from a scalar` on any batch containing `"age": null` or `"level": null`. The guard read:

```sql
CASE WHEN tournament -> 'age' IS NOT NULL
     THEN (SELECT array_agg(value::text) FROM jsonb_array_elements_text(tournament -> 'age'))
     ELSE NULL END
```

`tournament -> 'age'` returns **JSONB `null`**, not SQL `NULL`, when the key is present with a JSON null value — and JSONB null passes `IS NOT NULL`. So the `THEN` branch ran and `jsonb_array_elements_text` raised on a scalar. Both fields are `.nullable()` in the extraction schema, so this was always reachable; it stayed hidden because inserts were broken from 2025-12-01 (see `postgis-search-path-fix.md`) and the first small post-fix runs happened to contain arrays everywhere. The first 22-row batch hit it immediately.

Fixed by migration `fix_p_save_tournaments_jsonb_null_arrays`: guard on `jsonb_typeof(tournament -> 'age') = 'array'`, which rejects JSON null, scalars, and objects alike. Verified against all four shapes (null / array / key absent / empty array) inside an aborted `DO` block, so no probe rows were written. Note that a `CREATE OR REPLACE` must restate `SET search_path TO 'public', 'extensions', 'pg_temp'` or it silently reverts the PostGIS fix.

**Still open (deferred):** snapshot-before-load, schema-drift detection and alerting, dead-letter queue, and moving the hardcoded source-site list out of the prompt. See `savior.md` Plan F.

---

# Part V — Frontend Architecture: Two Codebases Pretending to Be One

### 20. 🔴 Schedule-risk logic runs **entirely on the client** (untrusted, un-single-sourced)
**What's wrong:** The whole risk engine — conflict detection, travel math, severity, and the English explanations — lives in `libs/shared/utilities/.../schedule-risk.utility.ts:1-463`, run in the browser via `schedule-risk.service.ts`. Nothing is server-verified; thresholds are client-manipulable; rule changes require shipping new web+mobile bundles. This directly contradicts **tournament-fit**, which *is* server-side (`tournament-fit.service.ts:38-45` → `/tournaments/evaluate-fit`). Two conceptually identical features sit on opposite sides of the wire with no rationale — the tell that placement was ad hoc.
**Improvement:** Move schedule-risk evaluation behind the API (mirror tournament-fit). Keep a thin client formatter if you want instant UI, but the authoritative computation belongs server-side. Decide a rule — "domain scoring lives on the API" — and apply it consistently.

### 21. 🟠 Large feature trees are **copy-pasted between web and mobile** instead of shared
**What's wrong:** Despite a `libs/shared/ui`, both apps carry their own `dashboard/components`, `opponents`, `contact-scheduler`, `rinklink-gpt/components`, `conversations`, `game-matching`. Egregious cases:
- The chat page is duplicated near line-for-line: `web/.../rinklink-gpt.component.ts` (289 lines) vs `mobile/.../rinklink-gpt.page.ts` (408 lines) — same private methods, same signals, ~250 lines of shared orchestration.
- The **AI Email Panel component tree exists twice**: `shared-ui/.../ai-email-panel/components/` and a forked `mobile/.../ai-email-panel/components/` with the same 7 files by name. Web uses the shared one; mobile forked its own copy of a ~390-line tree the library already provides.
**Improvement:** Extract a shared `RinkLinkGptChatStateService` (as was already done for `AiEmailPanelStateService`) and collapse both chat pages onto it; delete mobile's forked `ai-email-panel` in favor of shared-ui. Establish the rule: **presentation-agnostic logic goes in `libs/shared`; app trees are thin shells.** The team clearly knows how (they did it for email state) — they just didn't do it consistently.

### 22. 🟠 HTTP services have almost no error handling and lean on `any`
**What's wrong:** Only 2 of 27 services use `catchError`; API responses are widely `any`/`any[]` (`teams.service.ts:56`, `messages.service.ts:52-53` returns `Observable<any[]>`, `schedule.service.ts` has 15+ `any`). `schedule.service.ts` is a 330-line God service mixing HTTP CRUD, three realtime channels, in-memory cache, and DTO transforms.
**Improvement:** Add typed response interfaces and `catchError`/typed error surfaces to the HTTP services; split `schedule.service` into fetch / realtime / transform concerns; ban `any` on API boundaries via lint.

### 23. 🟡 State management straddles two eras (BehaviorSubject vs signals) with no boundary
**What's wrong:** Newer services use signals; core data flow still uses RxJS `BehaviorSubject` (`schedule.service.ts:29`). On a zoneless Angular 20 app the intended primitive is signals. `ai-email-panel-state.service.ts:219-268` even hand-rolls `new Observable(observer => …)` with nested subscribes (a leak-prone anti-pattern).
**Improvement:** Pick signals as the state primitive for a zoneless app and migrate deliberately; replace manual Observable construction with proper operators. Document the convention.

---

# Prioritized Remediation Roadmap

**P0 — Security (do before any further feature work; these are exploitable now):**
1. Rotate the leaked service-role key; move to anon key on clients; enable RLS (#1).
2. Fix the always-true `ApiKeyGuard` and move to per-user JWT auth end-to-end (#2, #5).
3. Guard the User module + add ownership checks (#3).
4. Re-derive & re-authorize confirmed AI actions server-side; validate email recipients (#4).
5. Add global auth guard, `ValidationPipe`, rate limiting, `helmet` (#6).

**P1 — Consolidate the two half-built systems (removes drift + most "amateurish" signal):**
6. Delete the dead 2,348-line `rinklink-gpt.service.ts` (#9).
7. Delete the plaintext API-key system; keep the hashed one (#7).
8. Collapse web/mobile chat + ai-email-panel duplication into shared libs (#21).
9. Move schedule-risk to the API for consistency with tournament-fit (#20).

**P2 — Make the AI trustworthy:**
10. Verify discovered contacts (syntax/MX/confidence) before store/send; add provenance (#14, #16).
11. Add consent/unsubscribe/suppression + verified sending domain (#15).
12. Truncate/window conversation history; add token/cost caps + timeouts (#10, #11).
13. Harden tool-call parsing and multi-intent handling; add a routing eval harness (#12, #13).

**P3 — Pipeline & polish:**
14. Fix ETL dedup column mismatch + add idempotency/monitoring (#18, #19).
15. Type the HTTP layer, add `catchError`, split God services, standardize on signals (#22, #23).

---

## A Note on the Core Idea (it's mostly fine)

The *concept* — an AI scheduling copilot for youth hockey — is sound, and the feature breadth is genuinely ambitious. The product-level rethink is narrow but important:

- **Shift from "cold-email scraped managers" to "consented, claim-your-team connections."** The current outreach model is both a legal hazard (#15) and strategically weaker than the network-effect moat in `savior.md` (Plan C). Same feature, safer and more defensible framing.
- **Treat AI output as suggestions users confirm, not facts the system acts on.** The autonomy-without-verification pattern (#4, #14) is where an otherwise-good AI product becomes a liability.
- **Everything else is execution, not vision.** The duplicated systems, missing auth, and client-side domain logic are all fixable with consolidation — the effort invested is very much salvageable.
