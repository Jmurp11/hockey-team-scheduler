# Database Refactor & Simplification Analysis

Analysis of the live Supabase `public` schema cross-referenced against actual usage in the
`hockey-team-scheduler` monorepo.

**Code analyzed:** `feat/jm/etl-part-iv` (working branch) for `apps/`, `libs/`,
`tournament-etl/`, plus `origin/feat/jm/mhr-etl-migration` @ `bc677f5` for `mhr-etl/`.

**Schema at time of analysis:** 43 tables + 9 views + 16 functions.

> **Revision note.** An earlier pass was run without `mhr-etl/` in the tree and flagged the
> MHR stored procedures as callerless. That is now resolved — see below. Bringing the ETL
> into scope did not just close that gap, it **changed the priorities**: the ETL's write
> pattern turns out to be the root cause of the Tier 2 bloat and is itself the largest
> performance problem in the schema (new Tier 0).

---

## Verification caveat — read this first

`pg_stat_user_tables` / `pg_stat_user_indexes` are **reset** on this project. Every table
reports `n_live_tup = 0`, `n_dead_tup = 0`, and `last_analyze = null`.

Consequences:

- `idx_scan = 0` proves **nothing** about whether an index is used.
- The **67 `unused_index` advisor hits are unreliable** for the same reason and are
  deliberately not acted on below.

Everything here is based on **structural evidence** — duplicate object definitions, code
references, stored-procedure bodies, and physical on-disk sizes — not usage statistics.

### `mhr-etl` scope — resolved

`mhr-etl/` is absent from `feat/jm/etl-part-iv` but present on
`origin/feat/jm/mhr-etl-migration`, along with `.github/workflows/mhr-leagues.yml` and
`mhr-rankings.yml`. That branch adds **only** the ETL and its workflows — it makes no
changes under `apps/`, so every application-side finding below applies to both branches.

All DB access flows through one helper, `mhr-etl/src/helper/supabase.ts:24`
(`supabase.rpc(storedProc, params)`), called from `mhr-etl/src/helper/insert.ts`:

| Stored procedure | Call site | Status |
|---|---|---|
| `p_batch_leagues` | `insert.ts:31` | **Live** |
| `p_batch_orgs` | `insert.ts:122` | **Live** |
| `p_batch_rankings` | `insert.ts:128` | **Live** |

Two objects remain orphaned **even with the ETL branch in scope** (no reference anywhere on
either branch):

- **`p_add_location(_orgs jsonb)`** — the only thing that populates `associations.location`.
  See Tier 0, this is not merely dead code.
- **`scrape_runs`** (24 rows) — superseded by GitHub Actions job summaries
  (`mhr-etl/src/helper/summary.ts`). Safe to archive and drop.

---

## Progress

| Item | Status |
|---|---|
| Tier 0 — `rankings` natural key (`001`) | **Applied** 2026-08-03 |
| Tier 0 — `associations` `lower()` index (`002`) | **Applied** 2026-08-03 |
| Tier 0 — `p_batch_rankings` set-based rewrite (`003`) | **Applied** 2026-08-03 |
| Tier 0 — `p_batch_orgs` set-based rewrite (`004`) | **Applied** 2026-08-03 |
| Tier 0 — `p_find_nearby_teams` `ST_DWithin` (`005`) | **Applied** 2026-08-03 |
| Tier 0 — `association_location_gaps` view (`006`) | **Applied** 2026-08-03 |
| Tier 0 — geocoding backfill for the 64 gaps | **Open** — tracked in `post-fix-flags.md` |
| Tiers 1–4 | Not started |

**Tier 0 is complete except the geocoding backfill**, which is deferred by choice:
monitoring is in place so the gap is visible, but nothing yet populates
`associations.location` for new rows.

SQL for applied steps, with rollbacks, is in `db/refactor/tier0/`.

**Verification of 001–003** (full-scale, read-only dry run against all live rows):
payload 10,793 → resolved 10,793 → matched existing keys 10,793 → **value drift 0**.

**Verification of 004** (read-only, realistic 8x-duplicated payload):
9,656 input rows → 1,207 after dedup → **0 associations rewritten, 0 map tuples
allocated**. Previously both were 9,656 per run, which was the bloat source.

**Verification of 005** (read-only equivalence proof, 40 origins x 6 radii = 240
combinations): old and new predicates each matched **39,411 rows, 0 disagreements**.
Live call `p_find_nearby_teams(2983, false, '12u', 0, 100, 50)` returned 313 rows
with a farthest distance of 49.51 mi, respecting the 50-mile bound.

**Measured by 006:** 64 associations with no location, accounting for **299 teams
that can never be returned by opponent search** (2.8% of all 10,793 teams). Worst
single cases: Amherst Youth Hockey (37 teams), Vegas Jr Golden Knights (35),
The St James Hockey Club (18). All have valid city/state and are geocodable.

Function attributes preserved on both (`RETURNS void`, `plpgsql`,
`search_path=public, pg_temp`, not `SECURITY DEFINER`), so
`mhr-etl/src/helper/insert.ts` needs no changes at either call site.

**What is NOT yet proven:** the dry runs replay existing data, so they exercise the
"nothing changed" path thoroughly. New associations, changed `association_url`
values, and the 13-leg concurrency behaviour are first exercised by the live run —
`mhr-leagues.yml` Wed 11:00 UTC, then `mhr-rankings.yml` Wed 12:00 UTC.

---

## Tier 0 — ETL correctness & performance (new; highest impact)

These come directly from reading the stored-procedure bodies against the ETL call pattern.
The rankings job runs weekly as a **13-leg matrix** (`mhr-rankings.yml`), so every
inefficiency here is multiplied by 13 and repeated indefinitely.

### `p_batch_rankings` does a sequential scan per row — ~13M comparisons per run

The procedure loops row-by-row over `_rankings` and resolves the association with:

```sql
SELECT id INTO org_id FROM associations
WHERE name  ILIKE (item ->> 'association')
  AND city  ILIKE (item ->> 'city')
  AND state ILIKE (item ->> 'state')
LIMIT 1;
```

`ILIKE` **cannot use** the btree index on `associations(name, city, state)`. So each of the
**10,793** ranking rows triggers a **sequential scan over 1,207 associations** in a
4,120 kB (bloated) table — on the order of **13 million row comparisons per full run**.

This is also why the triple-duplicate index in Tier 1 buys nothing on reads: the hot lookup
can't use any of them.

**Fix:** if the case-insensitivity is actually needed, back it with an expression index and
match it exactly —

```sql
CREATE INDEX idx_associations_lower_name_city_state
  ON associations (lower(name), lower(city), lower(state));
```

— and rewrite the predicate to `lower(name) = lower(item->>'association')` etc. If the ETL
already normalizes case (worth checking `normalize.ts`), drop `ILIKE` for `=` and use the
existing unique index.

### `rankings` has no unique constraint on its natural key

`p_batch_rankings` emulates an upsert by hand:

```sql
UPDATE rankings SET ... WHERE age = ... AND association = org_id AND team_name = ...;
IF NOT FOUND THEN INSERT INTO rankings (...) VALUES (...); END IF;
```

There is no unique index on `(association, age, team_name)`, so this pattern is both
**race-prone** (concurrent matrix legs can double-insert) and slower than it needs to be.

**Fix:** add `UNIQUE (association, age, team_name)` and collapse the whole block into a
single set-based `INSERT ... ON CONFLICT DO UPDATE` — no loop. That one change removes the
per-row round trip *and* the sequential scan above.

### `p_batch_orgs` is the source of the `assoc_league_map` bloat

Inside its per-org loop it runs:

```sql
INSERT INTO assoc_league_map (association, league)
SELECT org_id, l.id FROM leagues l WHERE l.abbreviation IN (...)
ON CONFLICT (association, league) DO NOTHING;
```

In Postgres, an `ON CONFLICT DO NOTHING` insert **still allocates and then abandons a
tuple**. Nearly every row conflicts on every run. At ~2,011 mappings × 13 matrix legs ×
weekly, this generates continuous dead-tuple churn.

This is the **definitive explanation** for `assoc_league_map` sitting at **5,768 kB for
2,011 rows of 4 columns**, with a **1,536 kB primary key** on a bigint that should be ~64 kB.

**Fix:** pre-filter with `WHERE NOT EXISTS (...)` so unchanged mappings are never inserted,
and hoist the whole thing out of the loop into one set-based statement.

The same `ON CONFLICT DO UPDATE` on `associations` explains that table's 4,120 kB, and the
`UPDATE`-per-row in `p_batch_rankings` explains `rankings`.

### 64 associations are invisible to nearby-team search

`associations.location` (PostGIS geography) is populated **only** by `p_add_location` —
which nothing calls, on either branch. Meanwhile `p_batch_orgs` creates new associations
with no location at all.

Result: **64 of 1,207 associations (5.3%) have `location IS NULL`.** In
`p_find_nearby_teams`, `ST_Distance(NULL, ...)` yields `NULL`, so the distance predicate is
never true — those associations **can never be returned by opponent search**, silently. The
count grows every time the ETL discovers a new association.

**Fix:** either wire a geocoding step into the ETL that calls `p_add_location` after
`p_batch_orgs`, or add a monitoring check on the null count. This is a **product-visible
data gap**, not cosmetic.

### `p_find_nearby_teams` cannot use the GIST index for filtering

```sql
WHERE ... ST_Distance(a.location, ut.location) * 0.000621371 <= p_max_distance
```

A computed expression on both sides — **not index-usable**. `associations_geo_index`
(1,216 kB GIST) only assists the `ORDER BY a.location <-> ut.location` KNN sort. The
distance filter itself scans.

**Fix:** use `ST_DWithin(a.location, ut.location, p_max_distance * 1609.34)`, which is
index-accelerated, and keep `ST_Distance` only for the returned display value.

---

## Tier 1 — Provably redundant, zero risk

No code changes required. Structural duplicates, verified by definition.

### Three identical unique indexes on `associations(name, city, state)`

| Index | Size |
|---|---|
| `associations_name_city_state_idx` | 336 kB |
| `unique_association_combo` | 320 kB |
| `associations_name_city_state_key` | 168 kB |

Same columns, same uniqueness, same table. ~824 kB wasted and **3x write amplification**.

This is not theoretical: `p_batch_orgs` does `ON CONFLICT (name, city, state) DO UPDATE`
for **every association on every one of the 13 weekly matrix legs**, and all three indexes
are maintained on each. Keep `associations_name_city_state_key` (the named constraint),
drop the other two.

### Duplicate `contacts` email index

`contacts_email_key` (UNIQUE constraint) fully covers `idx_contacts_email` (plain btree).
176 kB. This is the single hit the Supabase linter flagged as `duplicate_index`.

### Redundant `api_users` auth index

`idx_api_users_auth_user_id` (plain) is covered by `idx_api_users_auth_user_id_unique`
(partial unique on the same column, `WHERE auth_user_id IS NOT NULL`) for every non-null
lookup — which is every lookup the code performs.

### Redundant `gamesfull` index

`idx_gamesfull_team_date` is a **strict prefix** of `idx_gamesfull_team_date_time`.
There are four indexes on a 7-row table.

### Doubled `updated_at` triggers

Two tables each fire two triggers doing identical work, on every row update:

| Table | Trigger | Function |
|---|---|---|
| `contacts` | `trg_contacts_updated_at` | `update_contacts_updated_at()` |
| `contacts` | `update_contacts_updated_at` | `update_updated_at_column()` |
| `email_templates` | `trg_email_templates_updated_at` | `update_email_templates_updated_at()` |
| `email_templates` | `update_email_templates_updated_at` | `update_updated_at_column()` |

Keep the generic `update_updated_at_column()` pair, drop the two bespoke functions.

### Orphan function

`trg_games_update_gamesfull_live()` exists but **no trigger references it**. Only
`trg_games_update_gamesfull` is wired up (on `games`, `AFTER INSERT OR DELETE OR UPDATE`).

---

## Tier 2 — Bloat (symptom of Tier 0)

| Table | Rows | Total size | Root cause |
|---|---:|---:|---|
| `assoc_league_map` | 2,011 | **5,768 kB** | `p_batch_orgs` `ON CONFLICT DO NOTHING` churn; PK alone is 1,536 kB vs ~64 kB expected |
| `associations` | 1,207 | **4,120 kB** | `p_batch_orgs` `ON CONFLICT DO UPDATE` per row |
| `rankings` | 10,793 | 2,304 kB | `p_batch_rankings` `UPDATE`-per-row; PK is 632 kB |

`last_autovacuum` is null across the board — autovacuum has apparently never kept up with
the weekly ETL churn.

`VACUUM FULL` + `REINDEX` reclaims roughly **8–9 MB**. Note this takes an ACCESS EXCLUSIVE
lock — schedule outside the Wed 11:00/12:00 UTC ETL windows.

**Important:** vacuuming alone is a treatment, not a cure. Without the Tier 0 procedure
rewrites the bloat simply returns. Consider also setting a more aggressive
`autovacuum_vacuum_scale_factor` on these three tables.

---

## Tier 3 — Application bugs

### Three tables the code writes to that do not exist

| Code | Table | Impact |
|---|---|---|
| `apps/api/src/open-ai/open-ai.service.ts:38` | `messages` | read |
| `apps/api/src/rinklink-gpt/rinklink-gpt.service.ts:2283` | `chat_audit_log` | insert |
| `apps/api/src/developer-portal/developer-portal.service.ts:470` | `api_request_log` | insert |

Both inserts are fire-and-forget, so the **audit trail and API request logging are silently
writing nothing.**

`open-ai.service.ts` has a *passing* spec (`open-ai.service.spec.ts:94`) asserting the
`messages` call — the Supabase client is mocked, so the missing table never surfaces in CI.

**Decision needed:** create the three tables, or strip the dead write paths.

### Inconsistent "no opponent" encoding

`games.opponent` is `bigint`; `gamesfull.opponent` is `jsonb`. Three different sentinels
are in play across the views:

| View | Predicate |
|---|---|
| `rinks` | `opponent <> '-1'::integer` |
| `open_game_slots` | `opponent IS NULL` |
| `dashboard_summary` | `opponent IS NULL OR jsonb_array_length(opponent) = 0 OR opponent->0->>'id' IS NULL` |

These **disagree about what an open game slot is**. `rinks` still references a `-1`
sentinel that nothing else acknowledges.

---

## Tier 4 — Structural simplification

### `gamesfull` is a table, not a view

A denormalized copy of `games` kept in sync by a per-row trigger
(`trg_games_update_gamesfull`, plus `refresh_gamesfull_row(uuid)`).

- **Writes** → `games`: `games.service.ts:9` (insert), `:109` (update), `:145` (delete)
- **Reads** → `gamesfull`: `games.service.ts:37,51,71,91`, `tournaments.service.ts:455`

At **7 rows** this is pure overhead, with a live divergence risk: `gamesfull.time` is `text`
while `games.time` is `time with time zone`. Converting it to a view deletes one table, two
functions, and one trigger.

### `app_user_profiles` duplicates `user_profile_details`

Same five-table join, near-identical projection. Only `user_profile_details` is referenced
in code (6 files); `app_user_profiles` has no non-build references.

The one substantive difference is a **join-correctness bug in the unused view**:

- `app_user_profiles` joins `association_members` on `user_id` alone
- `user_profile_details` correctly joins on `(user_id, association)`

So `app_user_profiles` returns duplicate rows for users in multiple associations. Drop it.

### `user_profiles` is a 2-column table

Columns: `user_id`, `display_name`. Zero direct code references. `app_users` already has a
`name` column — `user_profile_details` literally does `COALESCE(up.display_name, au.name)`.

Folding it into `app_users` also removes an odd double foreign key, where
`app_users.user_id` references **both** `auth.users(id)` (`app_users_user_id_fkey`) and
`user_profiles(user_id)` (`app_users_user_id_fkey1`).

### Two parallel billing models

`api_users` carries Stripe fields inline (`stripe_customer_id`, `stripe_subscription_id`,
`stripe_subscription_item_id`, `request_count`), while `subscriptions` is a proper
seat-based table (`total_seats`, `seats_in_use`, `status`, `current_period_end`, with a
`seats_check` constraint). Worth unifying before the developer portal grows.

### ~25 tables belong to a separate marketing/agent system

`agent_decisions`, `agent_directives`, `agent_events`, `agent_trace_events`, `campaigns`,
`contact_sequence_enrollments`, `contacts`, `content_generation_jobs`, `content_library`,
`drip_sequences`, `email_logs`, `email_queue`, `email_queue_batches`, `email_templates`,
`email_tracking_events`, `emails`, `experiments`, `leads`, `objections`, `scheduler_config`,
`scheduler_jobs`, `social_analytics`, `social_credentials`, `social_post_queue`,
`social_posts`, `strategic_memos`, `weekly_kpis`.

Zero references on **either** branch. All empty except `contacts` (2,752), `scheduler_jobs`
(74), and `content_generation_jobs` (11).

**Do not drop these.** The non-empty ones indicate something is actively writing to them,
most likely a separate service. But they are **more than half the schema**. Recommendation:
move them to a dedicated `growth` schema so `public` reflects the product — after
confirming which service owns them.

### Missing foreign key indexes

21 flagged. Notable ones on hot paths:

- `app_users.association` (`app_users_association_fkey1`), `app_users.team`
- `assoc_league_map.league` — relevant to `p_batch_orgs` and `p_find_nearby_teams`
- `games.team`, `games.association`

### RLS init-plan warning

One `auth_rls_initplan` WARN on `app_users` — an RLS policy calls `auth.<fn>()` unwrapped,
so it re-evaluates per row. Wrap in a scalar subquery: `(select auth.uid())`.

---

## Suggested order of work

1. **Tier 0 — `p_batch_rankings` rewrite.** Add `UNIQUE (association, age, team_name)`,
   replace the loop with set-based `INSERT ... ON CONFLICT`, kill the `ILIKE` scan. Biggest
   single win; also stops the `rankings` bloat at the source.
2. **Tier 0 — the 64 null-location associations.** Silent, user-visible, and growing.
3. **Tier 3 missing tables.** Active silent data loss on audit + request logging. Needs a
   product decision (create vs. remove).
4. **Tier 1.** Safe, no code changes; directly reduces ETL write cost on the `p_batch_orgs`
   hot path.
5. **Tier 0 — `p_batch_orgs` `assoc_league_map` insert**, then **Tier 2 vacuum/reindex** in
   that order, so the reclaimed space stays reclaimed.
6. **Tier 4.** `gamesfull` → view and dropping `app_user_profiles` are the best
   value-to-risk. Schema separation for the growth tables needs cross-service coordination.
