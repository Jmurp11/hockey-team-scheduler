-- Tier 0 / step 5 — make the distance filter in p_find_nearby_teams index-able.
--
-- WHY
--   The distance predicate was:
--       ST_Distance(a.location, ut.location) * 0.000621371 <= p_max_distance
--   Both sides are computed, so the planner cannot use associations_geo_index
--   (1,216 kB GIST). That index was only ever assisting the ORDER BY ... <-> KNN
--   sort; the filter itself evaluated ST_Distance for every candidate row.
--
-- THE CHANGE
--       ST_DWithin(a.location, ut.location, p_max_distance / 0.000621371)
--   ST_DWithin on geography takes METRES and is index-accelerated.
--
--   The bound is written as `p_max_distance / 0.000621371` rather than
--   `p_max_distance * 1609.344` deliberately: it is the exact algebraic
--   rearrangement of the original inequality
--       d * 0.000621371 <= p_max_distance   <=>   d <= p_max_distance / 0.000621371
--   so the cutoff is identical to what callers see today. Substituting a
--   differently-rounded miles-to-metres constant would shift the boundary
--   slightly and could add or drop teams at the edge of a search radius.
--
--   The SELECTed `distance` value still uses ST_Distance with the original
--   *0.000621371 conversion and rounding, so returned values are unchanged.
--
-- ATTRIBUTES PRESERVED
--   RETURNS TABLE(...) identical, LANGUAGE plpgsql, STABLE,
--   SET search_path TO 'public', 'extensions', 'pg_temp'  <- note 'extensions',
--   which is where PostGIS lives; dropping it would break every ST_* call.
--   Not SECURITY DEFINER.
--
-- NULL LOCATIONS ARE UNCHANGED BY THIS
--   64 associations have location IS NULL. ST_Distance(NULL, ...) returned NULL
--   and so failed the old predicate; ST_DWithin(NULL, ...) likewise returns NULL
--   and fails the new one. Those associations remain invisible to opponent
--   search either way. That is a separate defect — see 006 and the geocoding
--   backfill still to be scheduled. This step neither fixes nor worsens it.
--
-- CALLERS (no code changes needed — signature is unchanged)
--   apps/api/src/teams/teams.service.ts
--   apps/api/src/game-matching/game-matching.service.ts

CREATE OR REPLACE FUNCTION public.p_find_nearby_teams(
    p_id integer,
    p_girls_only boolean,
    p_age text,
    p_min_rating numeric,
    p_max_rating numeric,
    p_max_distance numeric
)
RETURNS TABLE(
    id bigint, team_name text, association bigint, rating real, record text,
    agd real, sched real, age text, girls_only boolean, name text, city text,
    state text, country text, leagues json, distance double precision
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  WITH user_team AS (
    SELECT a.id, a.location
    FROM associations a
    WHERE a.id = p_id
  )
  SELECT
    r.id,
    r.team_name,
    r.association,
    r.rating,
    r.record,
    r.agd,
    r.sched,
    r.age,
    r.girls_only,
    a.name,
    a.city,
    a.state,
    a.country,
    json_agg(
      DISTINCT json_build_object(
        'league', l.name,
        'abbreviation', l.abbreviation,
        'location', l.location
      )::text
    ) AS leagues,
    round((ST_Distance(a.location, ut.location) * 0.000621371)::numeric, 2)::double precision AS distance
  FROM rankings r
    LEFT JOIN associations a ON r.association = a.id
    LEFT JOIN assoc_league_map alm ON a.id = alm.association
    LEFT JOIN leagues l ON alm.league = l.id,
    user_team ut
  WHERE r.age LIKE p_age
    AND r.girls_only = p_girls_only
    AND r.rating >= p_min_rating
    AND r.rating <= p_max_rating
    -- index-accelerated equivalent of the previous computed distance filter
    AND ST_DWithin(a.location, ut.location,
                   (p_max_distance / 0.000621371)::double precision)
    AND a.id != ut.id
  GROUP BY
    r.id,
    r.created_at,
    r.team_name,
    r.association,
    r.rating,
    r.record,
    r.agd,
    r.sched,
    r.age,
    r.girls_only,
    a.name,
    a.city,
    a.state,
    a.country,
    a.location,
    ut.location
  ORDER BY a.location <-> ut.location, r.rating desc;
END;
$function$;

-- ROLLBACK
--   Previous body preserved verbatim in 005_rollback_p_find_nearby_teams.sql.
