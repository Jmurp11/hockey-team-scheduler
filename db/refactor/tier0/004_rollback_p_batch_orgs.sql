-- ROLLBACK for 004_p_batch_orgs_setbased.sql
-- ORIGINAL production body, captured verbatim from pg_get_functiondef()
-- on 2026-08-03 before any change was applied.

CREATE OR REPLACE FUNCTION public.p_batch_orgs(_orgs jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$DECLARE
      org jsonb;
      org_id int;
  BEGIN
      FOR org IN
          SELECT *
          FROM jsonb_array_elements(_orgs)
      LOOP
          INSERT INTO associations (name, city, state, country, association_url)
          VALUES (
              org ->> 'name',
              org ->> 'city',
              org ->> 'state',
              org ->> 'country',
              org ->> 'association_url'
          )
          ON CONFLICT (name, city, state)
          DO UPDATE
              SET country = EXCLUDED.country,
                  association_url = COALESCE(EXCLUDED.association_url, associations.association_url)
          RETURNING id INTO org_id;

          RAISE LOG 'org_id is %', org_id;
          RAISE LOG 'orgLeagues: %', org -> 'orgLeagues';

          INSERT INTO assoc_league_map (association, league)
          SELECT
              org_id,
              l.id
          FROM leagues l
          WHERE l.abbreviation IN (
              SELECT value
              FROM jsonb_array_elements_text(org -> 'orgLeagues') AS t(value)
          )
          ON CONFLICT (association, league) DO NOTHING;

      END LOOP;
  END;$function$;
