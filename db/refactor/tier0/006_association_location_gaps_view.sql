-- Tier 0 / step 6 — surface associations that are invisible to opponent search.
--
-- THE DEFECT THIS MONITORS
--   associations.location (PostGIS geography) is populated ONLY by p_add_location,
--   which nothing calls on any branch — the original geocoding script is lost.
--   Meanwhile p_batch_orgs creates new associations with no location at all.
--
--   In p_find_nearby_teams the distance filter is ST_DWithin(a.location, ...),
--   and ST_DWithin(NULL, ...) is NULL, so these associations can NEVER be
--   returned by opponent search. The failure is silent, and the count grows every
--   time the weekly ETL discovers a new association.
--
--   As of 2026-08-03: 64 of 1,207 associations (5.3%).
--
-- WHAT THIS IS AND IS NOT
--   This is monitoring only. It does not fix the gap — that needs a geocoding
--   backfill, deferred pending a provider decision. The view exists so the number
--   is queryable and the problem stops being invisible.
--
--   team_count is the impact measure: it is the number of teams rendered
--   unfindable by each missing location, so it doubles as a backfill priority
--   order.
--
-- CONVENTION
--   security_invoker=on, matching all nine existing views in this schema.

CREATE OR REPLACE VIEW public.association_location_gaps
WITH (security_invoker = on) AS
SELECT
    a.id,
    a.name,
    a.city,
    a.state,
    a.country,
    a.created_at,
    count(r.id)::integer AS team_count
FROM associations a
LEFT JOIN rankings r ON r.association = a.id
WHERE a.location IS NULL
GROUP BY a.id, a.name, a.city, a.state, a.country, a.created_at
ORDER BY count(r.id) DESC, a.name;

COMMENT ON VIEW public.association_location_gaps IS
    'Associations with no PostGIS location. These are silently excluded from '
    'p_find_nearby_teams opponent search because ST_DWithin(NULL, ...) is NULL. '
    'team_count = teams made unfindable, and serves as backfill priority order. '
    'Populated by p_add_location, which currently has no caller.';

-- ROLLBACK
--   DROP VIEW IF EXISTS public.association_location_gaps;
