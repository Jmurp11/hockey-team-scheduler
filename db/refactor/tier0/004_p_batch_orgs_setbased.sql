-- Tier 0 / step 4 — rewrite p_batch_orgs to stop generating dead tuples.
--
-- ROOT CAUSE THIS ADDRESSES
--   assoc_league_map is 5,768 kB for 2,011 rows of 4 columns, with a 1,536 kB PK
--   on a bigint that should be ~64 kB. associations is 4,120 kB for 1,207 rows.
--   Both are dead-tuple bloat produced by this procedure, three ways:
--
--   1. INPUT DUPLICATION. mhr-etl/src/helper/insert.ts:75-83 appends an entry to
--      `associations` inside the per-TEAM loop, so _orgs contains roughly one
--      entry per team (~800-1000 per leg) covering only ~1,207 distinct orgs.
--      The old loop therefore ran the same upsert for the same association many
--      times per run.
--   2. UNCONDITIONAL DO UPDATE. ON CONFLICT DO UPDATE rewrites the row even when
--      country and association_url are unchanged, and every rewrite leaves a dead
--      tuple. On a weekly 13-leg matrix that is relentless.
--   3. ON CONFLICT DO NOTHING ON assoc_league_map. Postgres still allocates and
--      then abandons a tuple for each conflicting row. Nearly every mapping
--      conflicts on every run.
--
-- WHAT CHANGES
--   - Deduplicate _orgs once, up front (also REQUIRED: a set-based
--     ON CONFLICT DO UPDATE raises "cannot affect row a second time" on
--     duplicate keys within a single statement).
--   - Add a WHERE clause to DO UPDATE so unchanged rows are not rewritten at all.
--   - Filter assoc_league_map inserts with NOT EXISTS so existing mappings never
--     produce an abandoned tuple. ON CONFLICT DO NOTHING is kept only as a
--     backstop for duplicates arising within the same statement, which
--     NOT EXISTS cannot see (CTEs read a single snapshot).
--   - Drop the two per-row RAISE LOG calls (debug noise, ~1000 log lines/leg).
--
-- SIGNATURE / ATTRIBUTES PRESERVED
--   p_batch_orgs(_orgs jsonb) RETURNS void, LANGUAGE plpgsql,
--   SET search_path TO 'public','pg_temp', NOT security definer.
--   Caller mhr-etl/src/helper/insert.ts:122 needs NO changes.
--
-- BEHAVIOUR PRESERVED
--   - Dedup key is the EXACT (name, city, state) triple, matching the
--     ON CONFLICT target. Deliberately not lower() — p_batch_orgs may legitimately
--     hold case-variant rows as distinct associations, and deduping on lower()
--     would silently drop one of them.
--   - Last occurrence in input order wins, matching the old loop's overwrite order.
--   - association_url keeps its COALESCE semantics: a NULL from the scrape never
--     erases a previously stored URL.
--   - leagues.abbreviation is NOT unique (the unique key is
--     name+location+abbreviation), so one abbreviation may match several leagues.
--     The old code inserted a mapping for each; SELECT DISTINCT preserves that
--     while making the statement safe against intra-statement duplicates.
--
-- CALLED BY BOTH WORKFLOWS: mhr-leagues.yml (Wed 11:00 UTC) and
-- mhr-rankings.yml (Wed 12:00 UTC).

CREATE OR REPLACE FUNCTION public.p_batch_orgs(_orgs jsonb)
    RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_input    int;
    v_distinct int;
    v_touched  int;
    v_mapped   int;
BEGIN
    v_input := jsonb_array_length(_orgs);

    -- The dedup CTE is repeated in both statements below rather than
    -- materialised into a TEMPORARY TABLE. That is deliberate: a temp table
    -- would depend on the ETL role holding TEMP privilege on the database and
    -- on transaction scoping behaviour, and if either assumption were wrong the
    -- weekly job would fail outright. Re-scanning ~9,656 jsonb elements a second
    -- time is negligible next to that risk.

    SELECT count(*) INTO v_distinct
    FROM (
        SELECT DISTINCT value ->> 'name', value ->> 'city', value ->> 'state'
        FROM jsonb_array_elements(_orgs) AS t(value)
    ) d;

    -- 1. Upsert associations, but only actually write when something changed.
    WITH src AS (
        SELECT DISTINCT ON (value ->> 'name', value ->> 'city', value ->> 'state')
               value ->> 'name'            AS name,
               value ->> 'city'            AS city,
               value ->> 'state'           AS state,
               value ->> 'country'         AS country,
               value ->> 'association_url' AS association_url
        FROM jsonb_array_elements(_orgs) WITH ORDINALITY AS t(value, ordinality)
        ORDER BY value ->> 'name', value ->> 'city', value ->> 'state',
                 ordinality DESC   -- last occurrence wins, as before
    )
    INSERT INTO associations (name, city, state, country, association_url)
    SELECT name, city, state, country, association_url
    FROM src
    ON CONFLICT (name, city, state) DO UPDATE
        SET country         = EXCLUDED.country,
            association_url = COALESCE(EXCLUDED.association_url,
                                       associations.association_url)
        WHERE associations.country IS DISTINCT FROM EXCLUDED.country
           OR associations.association_url IS DISTINCT FROM
              COALESCE(EXCLUDED.association_url, associations.association_url);

    GET DIAGNOSTICS v_touched = ROW_COUNT;

    -- 2. Map associations to leagues, skipping mappings that already exist so no
    --    dead tuple is produced for the ~2,011 steady-state rows.
    --    Joining `associations` (rather than RETURNING from statement 1) is
    --    required for correctness: with the WHERE guard above, unchanged rows are
    --    not returned, and newly inserted ones would not be visible to a CTE
    --    sharing statement 1's snapshot.
    WITH src AS (
        SELECT DISTINCT ON (value ->> 'name', value ->> 'city', value ->> 'state')
               value ->> 'name'      AS name,
               value ->> 'city'      AS city,
               value ->> 'state'     AS state,
               value -> 'orgLeagues' AS org_leagues
        FROM jsonb_array_elements(_orgs) WITH ORDINALITY AS t(value, ordinality)
        ORDER BY value ->> 'name', value ->> 'city', value ->> 'state',
                 ordinality DESC
    )
    INSERT INTO assoc_league_map (association, league)
    SELECT DISTINCT a.id, l.id
    FROM src s
    JOIN associations a
      ON a.name = s.name AND a.city = s.city AND a.state = s.state
    CROSS JOIN LATERAL jsonb_array_elements_text(
        COALESCE(s.org_leagues, '[]'::jsonb)) AS t(abbr)
    JOIN leagues l ON l.abbreviation = t.abbr
    WHERE NOT EXISTS (
        SELECT 1 FROM assoc_league_map m
        WHERE m.association = a.id AND m.league = l.id
    )
    ON CONFLICT (association, league) DO NOTHING;

    GET DIAGNOSTICS v_mapped = ROW_COUNT;

    RAISE NOTICE
        'p_batch_orgs: % input rows -> % distinct orgs; % associations changed; % new league mappings',
        v_input, v_distinct, v_touched, v_mapped;
END;
$function$;

-- ROLLBACK
--   The previous body is preserved verbatim in 004_rollback_p_batch_orgs.sql.
