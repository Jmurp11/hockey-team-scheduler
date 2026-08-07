-- Tier 0 / step 3 — rewrite p_batch_rankings as a single set-based upsert.
--
-- REQUIRES: 001 (unique index on rankings) and 002 (lower() index on associations).
--
-- WHAT CHANGES
--   Before: per-row loop. For each of ~10,793 items -> one ILIKE seq scan over
--           associations, then an UPDATE, then conditionally an INSERT.
--           ~13M row comparisons per run, plus a dead tuple per UPDATE (this is
--           the source of the `rankings` table bloat).
--   After:  one INSERT ... SELECT ... ON CONFLICT DO UPDATE. Index-driven
--           association lookup, no procedural loop, no UPDATE-then-INSERT churn.
--
-- SIGNATURE / ATTRIBUTES PRESERVED
--   p_batch_rankings(_rankings jsonb) RETURNS void
--   LANGUAGE plpgsql, SET search_path TO 'public','pg_temp', NOT security definer.
--   The mhr-etl caller (mhr-etl/src/helper/insert.ts:128) needs NO changes.
--
-- BEHAVIOUR NOTES
--   1. ILIKE -> lower() =. Verified equivalent on current data (0 case-collision
--      groups). This also removes a latent bug: ILIKE treats % and _ in the
--      SCRAPED association name as wildcards. No such characters exist in the
--      data today, but an MHR name containing one would silently mis-match.
--   2. DISTINCT ON is required, not cosmetic. ON CONFLICT raises
--      "ON CONFLICT DO UPDATE command cannot affect row a second time" if the
--      input contains two rows with the same natural key. The old loop tolerated
--      that (last write won), so DISTINCT ON preserves that tolerance —
--      deterministically, by keeping the last occurrence in input order.
--   3. Rows whose association cannot be resolved are still skipped rather than
--      failing the batch. The old code raised one NOTICE per miss; this raises a
--      single summary NOTICE, which is more useful in the Actions log.
--   4. Casts follow the column types (rating/agd/sched are `real`). The old code
--      cast to NUMERIC and relied on an implicit narrowing on assignment.

CREATE OR REPLACE FUNCTION public.p_batch_rankings(_rankings jsonb)
    RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_total    int;
    v_upserted int;
BEGIN
    v_total := jsonb_array_length(_rankings);

    WITH item AS (
        SELECT value, ordinality
        FROM jsonb_array_elements(_rankings) WITH ORDINALITY AS t(value, ordinality)
    ),
    resolved AS (
        SELECT DISTINCT ON (a.id, item.value ->> 'age', item.value ->> 'team_name')
               a.id                                   AS association,
               item.value ->> 'age'                   AS age,
               item.value ->> 'team_name'             AS team_name,
               (item.value ->> 'rating')::real        AS rating,
               item.value ->> 'record'                AS record,
               (item.value ->> 'agd')::real           AS agd,
               (item.value ->> 'sched')::real         AS sched,
               (item.value ->> 'girls_only')::boolean AS girls_only
        FROM item
        -- LATERAL + LIMIT 1 reproduces the old lookup's LIMIT 1 exactly, so a
        -- future case-variant duplicate in `associations` can never fan out into
        -- duplicate ranking rows.
        JOIN LATERAL (
            SELECT a2.id
            FROM associations a2
            WHERE lower(a2.name)  = lower(item.value ->> 'association')
              AND lower(a2.city)  = lower(item.value ->> 'city')
              AND lower(a2.state) = lower(item.value ->> 'state')
            ORDER BY a2.id
            LIMIT 1
        ) a ON true
        -- Last occurrence in input order wins, matching the old loop.
        ORDER BY a.id, item.value ->> 'age', item.value ->> 'team_name',
                 item.ordinality DESC
    )
    INSERT INTO rankings (association, age, team_name,
                          rating, record, agd, sched, girls_only)
    SELECT association, age, team_name,
           rating, record, agd, sched, girls_only
    FROM resolved
    ON CONFLICT (association, age, team_name) DO UPDATE
        SET rating     = EXCLUDED.rating,
            record     = EXCLUDED.record,
            agd        = EXCLUDED.agd,
            sched      = EXCLUDED.sched,
            girls_only = EXCLUDED.girls_only;

    GET DIAGNOSTICS v_upserted = ROW_COUNT;

    IF v_upserted < v_total THEN
        RAISE NOTICE
            'p_batch_rankings: % of % rows written; % skipped (association not found or duplicate natural key)',
            v_upserted, v_total, v_total - v_upserted;
    END IF;
END;
$function$;

-- ROLLBACK
--   The previous body is preserved verbatim in 003_rollback_p_batch_rankings.sql.
