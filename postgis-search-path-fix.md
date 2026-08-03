# PostGIS `search_path` outage — diagnosis & fix plan

> **Status:** ✅ **FIXED 2026-08-03** via Option A (§5), applied as migration
> `fix_postgis_search_path`. All four affected functions now pin
> `search_path = public, extensions, pg_temp`. See §11 for results.
>
> Two corrections to what follows: a **fourth** function was affected
> (`p_add_location`), and Option B was never truly viable — see §11.
>
> **Written:** 2026-08-03, from branch `feat/jm/etl-part-iv`.

---

## 1. Summary

Three PostGIS-dependent stored procedures fail at runtime because their pinned
`search_path` does not include the `extensions` schema, where PostGIS is installed.

| Function | Error | Feature affected | Impact |
|---|---|---|---|
| `p_save_tournaments` | `42704 type "geography" does not exist` | Tournament ETL | **No tournament has been inserted since 2025-12-01** |
| `p_find_nearby_teams` | `42883 function st_distance(extensions.geography, extensions.geography) does not exist` | Opponent Finder | Nearby-team search returns nothing |
| `p_nearby_tournaments` | `42704 type "geography" does not exist` | Tournament recommendations | Returns nothing |

All three fail **silently in production**: the API catches the error and returns `[]`
(e.g. `apps/api/src/tournaments/tournaments.service.ts:490-493`), and the ETL did not
check supabase-js's returned `error` at all, so it printed
`✅ Tournament ETL Process completed successfully!` on every failed run.

`p_batch_leagues`, `p_batch_orgs`, and `p_batch_rankings` are **unaffected** — they touch
no PostGIS. (`p_batch_leagues` was exercised successfully on 2026-08-03: 252 leagues written.)

---

## 2. Evidence

**Insert history for `tournaments`** — the ETL runs monthly on the 1st:

```
2025-10-24:  88 rows
2025-11-01:  11 rows
2025-12-01:  25 rows
   (nothing since — 8 consecutive monthly runs inserted 0 while reporting success)
```

Table total: 124 rows, 112 distinct `registrationUrl`.

**It is a missing type, not a missing column.** Postgres uses distinct SQLSTATEs, and both
were observed on this database:

```
registration_link  -> 42703  undefined_column   ("column tournaments.registration_link does not exist")
geography          -> 42704  undefined_object   (a TYPE, not a column)
```

The `geographic_point` column is healthy — it exists, is populated, and its type resolves:

```json
{"name":"2026 U18 Atlantic Championship",
 "geographic_point":"0101000020E61000003E7958A8357D50C030BB270F0BB54640"}
```

**Failure is row-dependent**, which localizes it to the geography expression:

```
p_save_tournaments with []        -> HTTP 204   (loop body never runs)
p_save_tournaments with one row   -> 42704      type "geography" does not exist
```

**`public` is on the search_path but `extensions` is not.** `p_save_tournaments` also
references `tournaments`, `jsonb_array_elements`, and `array_agg` unqualified; those all
resolved. A missing `public` would have produced `42P01 undefined_table` first.

**The `p_find_nearby_teams` error shows the same cause from the other side:** its arguments
resolved fine *as* `extensions.geography` (so reading the column works) — what is missing is
the `st_distance` **function**.

---

## 3. Root cause

`supabase-fixes.md:26` records the Supabase advisor recommendation:

> *"15 functions with mutable `search_path` (`SET search_path = ''`) … All dashboard/DDL
> settings, **no app impact**."*

That assessment was wrong. Pinning `search_path` without including `extensions` breaks every
unqualified PostGIS reference. The timeline matches: inserts worked through 2025-12-01 and
stopped immediately after.

The offending expression in `p_save_tournaments` has **three** unqualified PostGIS references:

```sql
ST_SetSRID(                          -- function, unqualified
    ST_MakePoint(                    -- function, unqualified
        (tournament ->> 'longitude')::float,
        (tournament ->> 'latitude')::float
    ),
    4326
)::geography                         -- type,     unqualified  <-- resolved first, throws 42704
```

---

## 4. Step 1 — Diagnose (run first, with MCP)

Find every function that had `search_path` pinned, and its exact identity signature:

```sql
select n.nspname,
       p.proname,
       pg_get_function_identity_arguments(p.oid) as args,
       p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proconfig is not null
order by p.proname;
```

Confirm where PostGIS actually lives (expected: `extensions`):

```sql
select extname, n.nspname
from pg_extension e join pg_namespace n on n.oid = e.extnamespace
where extname = 'postgis';
```

Identify which of those functions actually reference PostGIS, so the fix is scoped rather
than blanket-applied:

```sql
select p.proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosrc ~* '(geography|geometry|st_[a-z_]+)'
order by p.proname;
```

Capture the current bodies before changing anything:

```sql
select pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('p_save_tournaments','p_find_nearby_teams','p_nearby_tournaments');
```

---

## 5. Step 2 — Fix

### Option A (recommended): add `extensions` to the pinned `search_path`

Least invasive, leaves the bodies untouched, and **still satisfies the advisor** — the
warning is about a *mutable* `search_path`; a pinned multi-schema value is still immutable.

```sql
ALTER FUNCTION public.p_save_tournaments(_tournaments jsonb)
  SET search_path = public, extensions;

-- Signatures for these two are unknown — fill in from the §4 query before running:
-- ALTER FUNCTION public.p_find_nearby_teams(<args>)  SET search_path = public, extensions;
-- ALTER FUNCTION public.p_nearby_tournaments(<args>) SET search_path = public, extensions;
```

Apply to every function the third §4 query returns, not just these three.

### Option B: schema-qualify inside the bodies

Use if you want `search_path` to stay minimal. Requires a `CREATE OR REPLACE FUNCTION` per
function. In `p_save_tournaments` the expression becomes:

```sql
extensions.ST_SetSRID(
    extensions.ST_MakePoint(
        (tournament ->> 'longitude')::float,  -- X = lon
        (tournament ->> 'latitude')::float    -- Y = lat
    ),
    4326
)::extensions.geography
```

Do **not** mix approaches half-way — pick one so the next person isn't guessing.

### Not a workaround

Sending `latitude`/`longitude` as `null` will **not** help. plpgsql resolves the whole
`INSERT` at plan time, so `::geography` fails before the `CASE` can take its `ELSE NULL`
branch. (Deliberately not tested — it would write a junk row to production if wrong.)

---

## 6. Step 3 — Verify

**a) The RPCs respond without a PostGIS error.**

```sql
select public.p_save_tournaments('[]'::jsonb);   -- should already work (empty loop)
```

Then the real path — a single row through the ETL (see (c)).

**b) The two read RPCs return rows instead of erroring.** Via MCP, or REST:

```bash
# from repo root; tournament-etl/.env has SUPABASE_URL + SUPABASE_API_KEY
curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/p_nearby_tournaments" \
  -H "apikey: $SUPABASE_API_KEY" -H "Authorization: Bearer $SUPABASE_API_KEY" \
  -H "Content-Type: application/json" -d '{"p_id":1}'
```

Before the fix this returns `42704`. After, expect JSON rows (possibly `[]`, but **no error
object**).

**c) End-to-end ETL, and the dedup regression in one go.** Run twice:

```bash
cd tournament-etl
npx tsx src/run-etl.ts --location "Massachusetts" --locationType "states"
npx tsx src/run-etl.ts --location "Massachusetts" --locationType "states"
```

- Run 1: `[ETL] N already present, M new` with `M > 0`, and no error.
- Run 2: **`inserted: 0`** — this is the dedup fix (§7) proving itself against live data,
  the one link that could not be verified while the insert was broken.

Note each run costs one `gpt-5-mini` + `web_search` call and writes real rows.

**d) Row count moved.** Baseline is **124** as of 2026-08-03:

```sql
select count(*) from tournaments;
select max(created_at) from tournaments;   -- should become today
```

**e) The app feature works.** `GET /v1/teams/nearbyTeams` (Opponent Finder) should return
teams rather than an empty list.

---

## 7. Related code changes (already done, branch `feat/jm/etl-part-iv`)

Not committed. Covers improvements.md Part IV items 18 and 19 (light half). 35 tests
passing, lint/build/typecheck clean. Touches `tournament-etl/` only.

- **Dedup fix** — `tournaments.ts` compared `ft.registration_link`, which does not exist on
  the returned rows and is always `undefined`, so the filter matched nothing.
  **improvements.md #18 had the column name backwards**: the real column *is*
  `registrationUrl`, and "fixing" `supabase.ts` as the doc suggested would have broken a
  working query. improvements.md has been corrected in place.
- **`getTournaments` / `insertTournaments` now check supabase-js's returned `error`.** This
  is what surfaced the outage above — it was previously swallowed.
- **`Tournament` type reconciled** with the real schema (`location` string + `description`;
  nullable `level`/`age`/`latitude`/`longitude`). The old type declared
  `city`/`state`/`country`, which do not exist.
- **Retry/backoff + timeout** on the OpenAI call; clearer errors on malformed model output;
  per-run counts written to the GitHub Actions job summary.
- **`supabase.spec.ts` rewritten** — it previously re-implemented both functions inside
  `jest.mock('./supabase', …)`, so it tested a copy of the code, not the code. That is why
  the dedup bug passed CI.

---

## 8. Open decision — dedup key mismatch

`p_save_tournaments` upserts on:

```sql
ON CONFLICT (name, "startDate")
```

The client-side filter keys on `registrationUrl`. They disagree about identity, which means:

- The client filter is a **cost optimization, not a correctness guarantee** — the RPC would
  upsert those rows anyway.
- A tournament whose name or start date shifts slightly between runs inserts as a new row
  regardless of the client filter.
- It explains the observed duplicates: 7 `registrationUrl`s repeat (e.g.
  `hockeyfinder.com/tournaments` ×4) because those rows have different names/dates and never
  conflict. The model returned a **listing page** instead of a per-tournament registration
  link. `tournaments.ts` now logs these groups rather than silently merging them.

Aligning the client filter to `(name, startDate)` would make the two consistent. It was
deliberately **not** done in this branch — it is a behavior change that was not agreed.

---

## 9. Pitfalls

- **Do not rename `geographic_point`.** The column is correct and healthy; the error is a
  missing *type*, confirmed by SQLSTATE 42704 vs 42703.
- **Do not "fix" `registrationUrl` → `registration_link`** per the original improvements.md
  #18 text. `registration_link` does not exist (42703 verified).
- **Do not assume other pinned functions are fine.** 15 were flagged; only PostGIS-touching
  ones break, and only at runtime. Use the third §4 query.
- **Re-check the advisor after fixing** — Option A should keep the "mutable search_path"
  warning resolved. If it reappears, prefer Option B over reverting to an unpinned path.

---

## 10. Housekeeping

- This file is **untracked but NOT gitignored** on `feat/jm/etl-part-iv`. The
  `chore: gitignore local-only planning docs` commit (`a039741`) lives on
  `feat/jm/security-updates` and is not in `main`. Do not `git add -A` on this branch
  without checking, or this and the other planning docs will be committed.
- Local credentials used for the investigation: `tournament-etl/.env`
  (`SUPABASE_URL`, `SUPABASE_API_KEY`, `OPENAI_API_KEY`) and `mhr-etl/.env` (created
  2026-08-03, contains the production service-role key; gitignored).
- Separate open item from the mhr-etl migration: the old `mhr-data-fetch` repo's
  `leagues.yml` echoed the Supabase service-role key into workflow logs. Rotating that key
  is worth doing while making DB changes.

---

## 11. Outcome (2026-08-03)

Applied as migration `fix_postgis_search_path` — four `ALTER FUNCTION` statements, no
function bodies touched. SQL also kept at `postgis-search-path-fix.sql` (untracked).

### Two corrections to the plan above

**A fourth function was affected.** §1 lists three; the §4 scoping query returns
`p_add_location(_orgs jsonb)`, which writes `associations.location` using unqualified
`ST_SetSRID`/`ST_MakePoint`/`::geography`. That is the same column `p_find_nearby_teams`
reads, so association geocoding was broken too. It has no TypeScript caller anywhere in
the repo, which is likely why it was never noticed. **§4's third query is the authority on
scope — not §1's table.**

**Option B was not a real alternative.** `p_find_nearby_teams` orders by the `<->`
operator. Operators cannot be schema-qualified by prefixing; it would have to be rewritten
as `OPERATOR(extensions.<->)`. §5 presents A and B as a stylistic choice. They are not.

### Verification results

| Check | Result |
|---|---|
| §6 `proconfig` on all 4 | ✅ `search_path=public, extensions, pg_temp` |
| §6a `p_save_tournaments('[]')` | ✅ |
| Single-row insert path | ✅ exercised inside an aborted `DO` block — reached the `RAISE`, so the `::geography` INSERT succeeded where it previously threw `42704`, and nothing was written |
| §6b `p_nearby_tournaments(2967)` | ✅ 1 row, no error (was `42704`) |
| §6b `p_find_nearby_teams(2967, …)` | ✅ **219 rows**, no error (was `42883`) — Opponent Finder restored |
| §9 advisor re-check | ✅ still no `function_search_path_mutable` warning |
| §6c end-to-end ETL | ✅ inserted 2 rows, then 3 more — first successful inserts since 2025-12-01 |
| §7 dedup fix | ✅ verified deterministically — see below |
| §6d row count | ✅ **124 → 129**, `max(created_at)` now today |

The single-row probe supersedes §5's "Not a workaround" caveat about not being able to test
safely: wrapping the call in a `DO` block that raises after `PERFORM` exercises the real
plan and rolls back, so no junk row reaches production.

> **Follow-up (2026-08-03):** the yield problem described below has since been worked on —
> multi-pass search, prompt fixes, and a weekly cadence. See improvements.md #19.

### The ETL is high-variance, not broken

The first two §6c runs returned **0 tournaments** and inserted nothing. That looked like a
second bug the outage had been masking. It is not — a raw-response probe with identical
parameters returned a valid tournament, having issued four `web_search` calls
(`search`, then `open_page` on 200x85.com). The model simply returns an empty
`tournaments` array on some runs. Yield across five runs: **0, 0, 1 (probe), 2, 3**.

So `gpt-5-mini` at `reasoning: { effort: "low" }` finds 0–3 tournaments per call for a
whole state, non-deterministically. Worth tuning, but it is a *quality* problem, not a
correctness one — and it is why the monthly job only ever wrote 11–88 rows even when it
worked. The output_text is always schema-valid, so `parseTournaments` never throws.

### §6c's dedup check is not reproducible as written

§6c says run 2 should report `inserted: 0`. It cannot be relied on: run 3 returned three
Defender Hockey events with **zero overlap** with run 2's set, so `0 already present` was
correct behavior rather than a dedup failure. The check assumes a determinism the model
does not have.

Verified deterministically instead, with no OpenAI call: feed `getTournaments()` one
`registrationUrl` known to be in the table and one known absent, then apply the exact
filter `runETL` uses. Result: the known URL came back in `existingUrls`, only the absent
one survived as new. **The §7 dedup fix works against live data.** Prefer this over a
second ETL run when re-verifying.

### Confirmed side effects of the fix

`geographic_point` is being written correctly, including axis order — the Worcester row
stores `POINT(-71.8023 42.2626)`, i.e. X=lon, Y=lat as the body's comments intend.

The §8 duplicate-listing-page problem reproduced immediately: the second inserted row has
`registrationUrl = https://200x85.com/tournaments/`, a directory page rather than a
per-tournament link. That remains open.
