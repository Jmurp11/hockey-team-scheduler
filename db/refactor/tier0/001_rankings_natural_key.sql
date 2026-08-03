-- Tier 0 / step 1 — give `rankings` a real natural key.
--
-- WHY
--   p_batch_rankings currently emulates an upsert by hand:
--       UPDATE rankings SET ... WHERE age = ... AND association = ... AND team_name = ...;
--       IF NOT FOUND THEN INSERT ...
--   There is no unique index behind that triple, so the pattern is race-prone
--   (the rankings workflow runs 13 concurrent matrix legs) and cannot be
--   expressed as a set-based ON CONFLICT upsert.
--
-- PRE-VERIFIED AGAINST PRODUCTION (2026-08-03)
--   SELECT count(*) FROM (
--     SELECT association, age, team_name FROM rankings
--     GROUP BY 1,2,3 HAVING count(*) > 1) d;
--   -> 0 duplicate groups, 0 extra rows. The index will build cleanly.
--
-- LOCKING
--   Plain (non-CONCURRENT) build. `rankings` is 10,793 rows / 2.3 MB, so this
--   takes well under a second. CREATE INDEX CONCURRENTLY cannot run inside a
--   transaction block, which is why it is not used here. Still, prefer to run
--   this outside the Wed 12:00 UTC rankings window.
--
-- NOTE ON girls_only
--   girls_only is deliberately NOT part of the key. The existing procedure
--   matches on (age, association, team_name) and *assigns* girls_only, so the
--   triple is already the effective natural key. This preserves that exactly.

CREATE UNIQUE INDEX IF NOT EXISTS rankings_association_age_team_name_key
    ON public.rankings (association, age, team_name);

-- No ALTER TABLE ... ADD CONSTRAINT is needed: `INSERT ... ON CONFLICT` binds to
-- a unique *index* just as well as to a named constraint, and skipping the
-- constraint avoids a second catalog object to keep in sync.

-- ROLLBACK
--   DROP INDEX IF EXISTS public.rankings_association_age_team_name_key;
