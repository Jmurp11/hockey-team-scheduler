-- ROLLBACK for 003_p_batch_rankings_setbased.sql
-- This is the ORIGINAL production body, captured verbatim from
-- pg_get_functiondef() on 2026-08-03 before any change was applied.
-- Applying this file restores the pre-refactor behaviour exactly.
--
-- Safe to run whether or not 001/002 were applied: the old body does not depend
-- on either index (that is precisely the problem it had).

CREATE OR REPLACE FUNCTION public.p_batch_rankings(_rankings jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$DECLARE item JSONB;

org_id INT;

BEGIN -- Loop over each JSON object from _rankings array
FOR item IN
SELECT
  *
FROM
  jsonb_array_elements(_rankings) LOOP -- Look up the org ID based on association details
SELECT
  id INTO org_id
FROM
  associations
WHERE
  name ILIKE (item ->> 'association')
  AND city ILIKE (item ->> 'city')
  AND state ILIKE (item ->> 'state')
LIMIT
  1;

-- If no matching organization found, raise notice and continue to next item
IF org_id IS NULL THEN RAISE NOTICE 'Association not found for %',
item ->> 'association';

CONTINUE;

END IF;

-- Try to update the existing ranking record
UPDATE
  rankings
SET
  rating = (item ->> 'rating') :: NUMERIC,
  record = item ->> 'record',
  agd = (item ->> 'agd') :: NUMERIC,
  sched = (item ->> 'sched') :: NUMERIC,
  girls_only = (item ->> 'girls_only') :: BOOL
WHERE
  age = item ->> 'age'
  AND association = org_id
  AND team_name = item ->> 'team_name';

-- If no rows updated, insert a new ranking record
IF NOT FOUND THEN
INSERT INTO
  rankings (
    age,
    rating,
    record,
    agd,
    sched,
    association,
    team_name,
    girls_only
  )
VALUES
  (
    item ->> 'age',
    (item ->> 'rating') :: NUMERIC,
    item ->> 'record',
    (item ->> 'agd') :: NUMERIC,
    (item ->> 'sched') :: NUMERIC,
    org_id,
    item ->> 'team_name',
    (item ->> 'girls_only') :: BOOL
  );

END IF;

END LOOP;

END;$function$;
