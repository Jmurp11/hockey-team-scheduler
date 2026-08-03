# Supabase Security Review — Findings & Fixes

_Verification of the `feat/jm/change-price` security rework against `improvements.md`, plus a live audit of the `HSDB` Supabase project (`gwymkfydqfvnojcoxkvz`). Reviewed: 2026-07-20._

## ✅ RLS remediation applied (2026-07-20)

Architecture chosen: **Option B** — RLS-first for the frontend (publishable key + user JWT), secret key + app-layer authz for the metered API. Applied via 8 MCP migrations to project `gwymkfydqfvnojcoxkvz`:

| # | Migration | What it did |
|---|-----------|-------------|
| 1 | `enable_rls_on_growth_agent_tables` | Enabled RLS on `leads, emails, social_posts, experiments, agent_decisions` (were fully exposed to the publishable key). |
| 2 | `lock_down_security_definer_functions` | Revoked EXECUTE from PUBLIC/anon/authenticated on `get_user_access`, `link_api_user_to_auth`, `sync_user_profile` (service_role retained; trigger use unaffected). |
| 3 | `rls_scope_games_to_association` | Dropped the "Realtime debug allow all" public-read on `games`/`gamesfull`; replaced with authenticated read scoped to `user = auth.uid()` OR association membership (app_users ∪ association_members). |
| 4 | `rls_fix_associations_access` | Broadened `associations` read to anon+authenticated (pre-login registration); dropped the public `DELETE where name is null` policy. |
| 5 | `rls_fix_leagues_insert` | Dropped the `authenticated CHECK(true)` INSERT on `leagues` (ETL writes via SECURITY DEFINER batch fns). |
| 6 | `rls_hide_tournament_submitter_pii` | Revoked table-wide SELECT on `tournaments` for anon/authenticated; re-granted SELECT on listing columns only (hides `email`, `stripe_session_id`). |
| 7 | `rls_lock_agent_trace_events` | Dropped public SELECT + authenticated INSERT on `agent_trace_events`; locked to service_role. |
| 8 | `rls_declare_server_only_tables` | Added explicit `service_role` policies to the 8 server-only no-policy tables so intent is declared and the INFO lint clears. |

**Verified end state:** 0 tables with RLS enabled but no policy. All `rls_disabled_in_public` (ERROR), `rls_policy_always_true`, and SECURITY DEFINER anon-executable advisories cleared.

**Reference-data read scope (per your call):** tournaments = public (anon), rankings/leagues = authenticated, associations = anon (registration).

### Still open (not RLS policies)
- **Secret-key swap:** DB side is ready (all server policies target the `service_role` role, which the `sb_secret_…` key maps to). Remaining work is code/ops only: set the API's `PUBLIC_SUPABASE_SERVICE_ROLE` env to the new `sb_secret_…` key and **rotate the old leaked `service_role` JWT**. No code logic changes needed.
- **Low-priority advisor WARNs:** 15 functions with mutable `search_path` (`SET search_path = ''`); enable leaked-password protection; shorten OTP expiry (<1h); upgrade Postgres `15.8.1.121` for security patches. All dashboard/DDL settings, no app impact.

---

## Bottom line

**Not yet fully secure — but close on the application layer.** The NestJS-side rewrite is a genuine, substantial fix of the P0 items in `improvements.md`. However, the **database/RLS layer still has active holes** — including the exact class of bug (#1) the original review flagged: tables fully exposed to the client key. This matters *more* now, because the clients switched to the publishable key and RLS is the only thing standing between the browser and those tables.

---

## What is genuinely fixed (application layer)

| # | Issue | Status | Evidence |
|---|-------|--------|----------|
| 1 | Service-role key in clients | ✅ Fixed | All 4 env files now ship `sb_publishable_…` (publishable key), not the `service_role` JWT. `supabase.service.ts` uses it as an anon client with PKCE. |
| 2 | Always-true `ApiKeyGuard` | ✅ Fixed | Old guard deleted; `ApiAccessGuard` **awaits** `validateApiKey()` and throws 401/403 on failure. |
| 3 | Unauthenticated User module (IDOR) | ✅ Fixed | `@UseGuards(SupabaseAuthGuard)` on the controller; identity from `@CurrentAuthUser()`; ownership enforced via `ensureAssociationAdmin` / `isAssociationMember`; `userId !== authUserId` → 403. |
| 4 | AI open relay | ✅ Largely fixed | `confirmation.service.ts` derives team/association/user from server `userContext`, not client payload; `send_email` gated by `isKnownManagerEmail()`. |
| 5 | Client-supplied `userId` impersonation | ✅ Fixed | Identity now flows from the verified Supabase JWT via the guards. |
| 6 | No auth/validation/rate-limit/helmet | 🟡 Partial | `helmet()` + global `ThrottlerGuard` (120/min) + global `ValidationPipe({transform})` added. **But** no global auth guard, and `whitelist`/`forbidNonWhitelisted` deliberately off. |

Guard coverage is currently **complete** — every controller carries `SupabaseAuthGuard` or `ApiAccessGuard` (or per-route guards on `tournaments`/`developer-portal`), with `@Public()` opt-outs on webhooks/registration/checkout. `app.controller.ts` is the only unguarded one (verify it's just a health route).

---

## RLS review — remaining gaps 🔴

Queried the live `HSDB` project. RLS is now on for **38 of 43** public tables — a big improvement. But:

### 1. 🔴 Five tables have RLS fully DISABLED — exposed to the publishable/anon key
`public.leads`, `public.emails`, `public.social_posts`, `public.experiments`, `public.agent_decisions`

These are readable/writable by **anyone with the publishable key** (which now ships in every client bundle). `emails` and `leads` are almost certainly PII — this is the same exposure as the original #1, just on different tables. This is the headline finding.

```sql
ALTER TABLE public.leads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_decisions  ENABLE ROW LEVEL SECURITY;
```

⚠️ Enabling RLS with **no policy = deny-all to clients**. If any of these are read directly from the browser, that breaks the feature; if they're only touched server-side via the service role, enabling is safe (service role bypasses RLS). Add policies deliberately per table — don't just flip it blind. ([docs](https://supabase.com/docs/guides/database/postgres/row-level-security))

### 2. 🟠 `SECURITY DEFINER` functions callable by `anon`
`get_user_access(uuid)`, `link_api_user_to_auth(uuid, text)`, `sync_user_profile()` are all invokable via `/rest/v1/rpc/...` **without signing in**, and they run with definer privileges (bypassing RLS). `get_user_access` leaks any user's access profile by UUID; `link_api_user_to_auth` is a linking primitive that shouldn't be anon-reachable. Revoke execute from `anon`/`authenticated` (the API calls them with the service role anyway):

```sql
REVOKE EXECUTE ON FUNCTION public.get_user_access(uuid)            FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_api_user_to_auth(uuid,text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_user_profile()             FROM anon, authenticated;
```

### 3. 🟡 RLS-enabled-but-no-policy: `api_users`, `conversations`, `managers`
Deny-all to clients (safe) *as long as* they're only accessed by the API via service role. If the web/mobile client reads `conversations` or `managers` directly, those reads are silently failing — confirm which path is used, then add scoped policies if needed.

### 4. 🟡 Overly permissive `WITH CHECK (true)` INSERT policies
`public.leagues` and `public.agent_trace_events` let any authenticated role insert arbitrary rows. Tighten to an ownership/role predicate.

### 5. 🟡 Auth/platform hardening (all flagged by the advisor)
- Leaked-password protection **disabled** (turn on HaveIBeenPwned check).
- OTP expiry **> 1 hour** (lower to <60 min).
- Postgres `15.8.1.121` has **outstanding security patches** — schedule an upgrade.
- 15 functions with mutable `search_path` (set `search_path = ''`) — low priority.

---

## Remaining application-layer caveats

- **No global auth guard.** Auth is opt-in per controller. Coverage is complete *today*, but the next controller added without `@UseGuards` is silently public — exactly the failure mode that exposed the User module originally. Registering `SupabaseAuthGuard`/`ApiAccessGuard` as an `APP_GUARD` with `@Public()` opt-out (as `improvements.md` #6 recommended) would close this permanently.
- **`ValidationPipe` has no `whitelist`/`forbidNonWhitelisted`** (documented as deferred). DTOs are undecorated, so mass-assignment of unexpected body fields is still possible.
- **`complete-registration` remains `@Public()` and trusts `body.userId`** — a documented residual account-takeover vector (sets a password for an arbitrary user id). Tracked, but still live.
- **PostgREST filter injection (#8) only partially addressed.** The new `isKnownManagerEmail()` uses a parameterized `.ilike()` ✅, but string-interpolated `.or(...)` filters still exist in `manager-search.service.ts:38,116,215` and `user-access.service.ts:125`. LLM/user-derived values (`manager.email`, `manager.name`, `team`) still flow into filter strings.
- **Email recipient gate is soft.** `isKnownManagerEmail` treats *any* row in `managers` as allowed, and `managers` is auto-populated by the LLM web-search (`saveWebSearchResults`). An attacker who can trigger discovery could seed an address, then send to it. Bounded, but not airtight.
- **Key rotation is not verifiable from code.** Swapping the client to the publishable key does *not* revoke the old `service_role` JWT sitting in git history. It must be rotated in the Supabase dashboard, or it remains a full-access master key forever.

---

## Priority to actually reach "secure"

1. **Enable RLS + policies on the 5 exposed tables** (esp. `emails`, `leads`). 🔴
2. **Rotate the leaked `service_role` key** in the dashboard if not already done. 🔴
3. **Revoke anon/authenticated EXECUTE** on the 3 `SECURITY DEFINER` RPCs. 🟠
4. Add policies to `conversations`/`managers`/`api_users` (or confirm API-only access). 🟠
5. Promote auth to a global `APP_GUARD`; tighten `ValidationPipe`; fix `complete-registration`. 🟠
6. Replace remaining interpolated `.or()` filters with bound builders. 🟡
7. Enable leaked-password protection, shorten OTP expiry, upgrade Postgres. 🟡

The app-layer rewrite is solid work and closes most of the exploitable-today API holes. But the Supabase implementation cannot be called "secure" while five tables sit open to the publishable key and three definer functions are anon-callable — those are the RLS equivalents of the original finding.
