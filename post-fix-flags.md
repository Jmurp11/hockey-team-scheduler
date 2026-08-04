# Post-Fix Flags

Open items surfaced during the database refactor that were **not** resolved by the fixes
applied. Each entry states what is broken, what was done about it, and what is still needed.

Companion to `database-refactor-analysis.md` (findings and applied migrations).

---

## 1. Geocoding gap — 299 teams invisible to opponent search

**Status:** Open. Monitoring in place, no fix.
**Flagged:** 2026-08-03
**Severity:** Product-visible, silent, and growing weekly.

### What is broken

`associations.location` (PostGIS geography) is populated **only** by `p_add_location`.
Nothing calls it — not on `feat/jm/etl-part-iv`, not on `feat/jm/mhr-etl-migration`. The
original geocoding script is lost.

Meanwhile the weekly ETL (`p_batch_orgs`) creates new associations with **no location at
all**, so the gap widens every Wednesday.

`p_find_nearby_teams` filters with `ST_DWithin(a.location, ut.location, ...)`. Since
`ST_DWithin(NULL, ...)` evaluates to `NULL`, an association with no location can **never**
be returned by opponent search. There is no error, no warning, and no empty-state message —
the teams simply are not there.

### Measured impact (2026-08-03)

| Metric | Value |
|---|---:|
| Associations with no location | **64** of 1,207 (5.3%) |
| Teams rendered unfindable | **299** of 10,793 (2.8%) |
| Worst single association | Amherst Youth Hockey — 37 teams |

Next worst: Vegas Jr Golden Knights House Association (35), The St James Hockey Club (18),
Monument Rebels Travel Hockey (16), Mass Admirals Hockey Club (12).

All 64 have valid `city` and `state` values, so they are straightforwardly geocodable. This
is not a data-quality problem; it is a missing pipeline step.

### What was done

- **`006_association_location_gaps_view.sql`** — created
  `public.association_location_gaps`, listing every affected association with a
  `team_count` column that doubles as backfill priority order.

  ```sql
  SELECT count(*), sum(team_count) FROM association_location_gaps;
  ```

- Nothing else. The view **measures** the gap; it does not close it.

### Explicitly NOT caused by the Tier 0 work

`005` changed the distance filter from `ST_Distance(...) <= p_max_distance` to
`ST_DWithin(...)`. Both yield `NULL` against a `NULL` location, so these associations were
already excluded before that change and are excluded by exactly the same rows afterward
(verified: 240 origin/radius combinations, 0 disagreements). The refactor neither caused
nor worsened this. It is pre-existing.

### What is still needed

1. **Pick a geocoding provider.** Deferred on 2026-08-03. Options considered were Google
   Maps Geocoding (best accuracy for US/CA, paid, needs key), Mapbox (good free tier, needs
   key), and Nominatim/OSM (free, no key, ~1 req/sec, weaker on non-address names).
   Volume is trivial — 64 rows for the backfill, a handful per week ongoing.
2. **Backfill the 64 existing rows** via `p_add_location`, which already accepts
   `[{id, latitude, longitude}, ...]` and needs no changes.
3. **Wire geocoding into the ETL** so `p_add_location` is called after `p_batch_orgs` for
   any association still lacking a location. Without this, step 2 is a one-time patch and
   the gap starts growing again immediately — which is exactly how the current situation
   arose.
4. **Alert on regrowth.** The view makes the number queryable but nothing surfaces it.
   A step in `mhr-etl` reporting the count through `summary.ts` to the GitHub Actions job
   summary would match the existing pattern. (Considered on 2026-08-03; "database view
   only" was chosen for now, so this remains open.)

### Verification once fixed

```sql
-- Should trend to 0
SELECT count(*) AS gap_associations, sum(team_count) AS teams_unfindable
FROM association_location_gaps;
```
