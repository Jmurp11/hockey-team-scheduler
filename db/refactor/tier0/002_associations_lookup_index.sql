-- Tier 0 / step 2 — make the association lookup in p_batch_rankings index-able.
--
-- WHY
--   p_batch_rankings resolves each ranking row to an association with:
--       WHERE name  ILIKE (item ->> 'association')
--         AND city  ILIKE (item ->> 'city')
--         AND state ILIKE (item ->> 'state')
--   ILIKE cannot use the btree index on associations(name, city, state), so every
--   one of the ~10,793 ranking rows drives a sequential scan over 1,207
--   associations in a bloated 4.1 MB table: on the order of 13 million row
--   comparisons per full run, 13 matrix legs per week.
--
--   Step 003 rewrites the predicate to lower(...) = lower(...). This index is what
--   makes that rewrite fast. Apply 002 BEFORE 003.
--
-- WHY NOT UNIQUE
--   A unique lower() index is tempting (it would also guarantee a single match),
--   but p_batch_orgs upserts on ON CONFLICT (name, city, state) — the EXACT
--   values. It can therefore legitimately create 'ABC Hockey' and 'Abc Hockey' as
--   two distinct rows. A unique lower() index would reject that insert and break
--   the leagues/orgs ETL outright. Non-unique gives the speedup with no new
--   failure mode; step 003 keeps an explicit LIMIT 1 to stay deterministic.
--
-- PRE-VERIFIED AGAINST PRODUCTION (2026-08-03)
--   Case-collision groups on (lower(name), lower(city), lower(state)): 0
--   -> lower()-matching is currently equivalent to the existing ILIKE matching,
--      so step 003 is behaviour-preserving on today's data.
--
-- LOCKING
--   1,207 rows. Effectively instant.

CREATE INDEX IF NOT EXISTS idx_associations_lower_name_city_state
    ON public.associations (lower(name), lower(city), lower(state));

-- ROLLBACK
--   DROP INDEX IF EXISTS public.idx_associations_lower_name_city_state;
