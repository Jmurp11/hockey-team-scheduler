-- ROLLBACK for 005_p_find_nearby_teams_dwithin.sql
-- ORIGINAL production body, captured verbatim from pg_get_functiondef()
-- on 2026-08-03 before any change was applied.

CREATE OR REPLACE FUNCTION public.p_find_nearby_teams(p_id integer, p_girls_only boolean, p_age text, p_min_rating numeric, p_max_rating numeric, p_max_distance numeric)
 RETURNS TABLE(id bigint, team_name text, association bigint, rating real, record text, agd real, sched real, age text, girls_only boolean, name text, city text, state text, country text, leagues json, distance double precision)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$BEGIN
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
    AND ST_Distance(a.location, ut.location) * 0.000621371 <= p_max_distance
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
END;$function$;
