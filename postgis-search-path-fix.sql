-- PostGIS search_path fix — Option A from postgis-search-path-fix.md §5.
--
-- All four functions below reference PostGIS unqualified (ST_MakePoint,
-- ST_SetSRID, ST_Distance, ::geography, and the <-> operator) but pin
-- search_path to 'public, pg_temp'. PostGIS lives in `extensions`, so every
-- one of them fails at runtime. Adding `extensions` to the pinned path fixes
-- all of them without touching a single function body, and keeps the paths
-- immutable so the Supabase advisor stays satisfied.
--
-- Signatures verified against pg_proc on 2026-08-03.

ALTER FUNCTION public.p_save_tournaments(_tournaments jsonb)
  SET search_path = public, extensions, pg_temp;

ALTER FUNCTION public.p_add_location(_orgs jsonb)
  SET search_path = public, extensions, pg_temp;

ALTER FUNCTION public.p_nearby_tournaments(p_id bigint)
  SET search_path = public, extensions, pg_temp;

ALTER FUNCTION public.p_find_nearby_teams(
  p_id integer,
  p_girls_only boolean,
  p_age text,
  p_min_rating numeric,
  p_max_rating numeric,
  p_max_distance numeric
) SET search_path = public, extensions, pg_temp;

-- Verify:
--   select p.proname, p.proconfig
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.prosrc ~* '(geography|geometry|st_[a-z_]+)';
--   select public.p_save_tournaments('[]'::jsonb);
--
-- NOTE: a second migration, `fix_p_save_tournaments_jsonb_null_arrays`, later
-- replaced the body of p_save_tournaments to fix a 22023 on JSON-null age/level.
-- It restates the search_path above. Any future CREATE OR REPLACE of that
-- function MUST do the same, or it silently reverts this fix.
