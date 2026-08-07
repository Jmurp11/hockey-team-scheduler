-- Tier 1 / step 7 — drop provably redundant indexes.
--
-- Every drop below is justified by the index DEFINITION, not by usage statistics.
-- This matters: pg_stat_user_indexes is reset on this project (all idx_scan = 0,
-- last_analyze null), so the 67 "unused_index" advisor hits are NOT evidence and
-- are deliberately ignored. Only structural duplicates are touched here.
--
-- No code changes required by any of this.

-- ---------------------------------------------------------------------------
-- 1. associations(name, city, state) x3
-- ---------------------------------------------------------------------------
-- Three separate unique indexes on the identical column list:
--     associations_name_city_state_idx   336 kB  (bare index)
--     unique_association_combo           320 kB  (UNIQUE constraint)
--     associations_name_city_state_key   168 kB  (UNIQUE constraint)  <- KEEP
--
-- ~656 kB reclaimed, and 3x write amplification reduced to 1x on the hottest
-- write path in the schema: p_batch_orgs does ON CONFLICT (name, city, state)
-- for every distinct association on every run of BOTH weekly workflows.
--
-- Keeping associations_name_city_state_key: it is the conventional
-- Postgres-generated constraint name, so it is what a reader expects to find.
-- ON CONFLICT (name, city, state) infers its arbiter from the column list rather
-- than naming an index, so p_batch_orgs is unaffected by which one survives.
--
-- Verified: no foreign key references any of these constraints (all FKs into
-- associations target the id column).

DROP INDEX IF EXISTS public.associations_name_city_state_idx;

ALTER TABLE public.associations
    DROP CONSTRAINT IF EXISTS unique_association_combo;

-- ---------------------------------------------------------------------------
-- 2. contacts(email) x2
-- ---------------------------------------------------------------------------
-- contacts_email_key (UNIQUE constraint) fully covers idx_contacts_email
-- (plain btree on the same single column). 176 kB.
-- This is the one duplicate the Supabase linter independently flagged.

DROP INDEX IF EXISTS public.idx_contacts_email;

-- ---------------------------------------------------------------------------
-- 3. gamesfull(team, date) — prefix duplicate
-- ---------------------------------------------------------------------------
-- idx_gamesfull_team_date is a strict prefix of idx_gamesfull_team_date_time,
-- so the latter serves every query the former could. Four indexes on a 7-row
-- table.

DROP INDEX IF EXISTS public.idx_gamesfull_team_date;

-- ---------------------------------------------------------------------------
-- 4. api_users(auth_user_id) x2
-- ---------------------------------------------------------------------------
-- idx_api_users_auth_user_id (plain) vs idx_api_users_auth_user_id_unique
-- (UNIQUE, partial: WHERE auth_user_id IS NOT NULL).
--
-- CAVEAT, stated plainly: these are not perfectly equivalent. The partial index
-- cannot serve a `WHERE auth_user_id IS NULL` scan, and the user_access view does
-- contain such a branch:
--     (api.auth_user_id IS NULL AND api.email = au.email)
-- Dropping the plain index leaves that branch unindexed.
--
-- Accepted because api_users currently holds 1 row, where no index is consulted
-- at all. If the developer portal grows, the correct index for that branch is on
-- `email` (the column actually being compared), not a full index on auth_user_id.
-- Revisit then rather than keeping a duplicate now.

DROP INDEX IF EXISTS public.idx_api_users_auth_user_id;

-- ROLLBACK
--   See 007_rollback_redundant_indexes.sql
