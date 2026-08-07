-- Tier 1 / step 8 — remove doubled updated_at triggers and one broken function.
--
-- ---------------------------------------------------------------------------
-- 1. contacts and email_templates each fire TWO updated_at triggers
-- ---------------------------------------------------------------------------
-- Current state — both triggers fire BEFORE UPDATE FOR EACH ROW:
--
--   contacts         trg_contacts_updated_at        -> update_contacts_updated_at()
--   contacts         update_contacts_updated_at     -> update_updated_at_column()
--   email_templates  trg_email_templates_updated_at -> update_email_templates_updated_at()
--   email_templates  update_email_templates_updated_at -> update_updated_at_column()
--
-- NOTE the confusing naming: `update_contacts_updated_at` is BOTH a trigger name
-- (using the generic function) and a function name (used by the other trigger).
-- Same for email_templates. Read the DROP statements below carefully.
--
-- VERIFIED IDENTICAL — all three function bodies are byte-for-byte equivalent:
--     BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
-- So one of each pair is pure duplicated work on every row update.
--
-- Keeping the trigger that calls the shared update_updated_at_column(), because
-- that function is also used by campaigns and drip_sequences. The two bespoke
-- functions have no other caller and are dropped with their triggers.

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON public.contacts;
DROP FUNCTION IF EXISTS public.update_contacts_updated_at();

DROP TRIGGER IF EXISTS trg_email_templates_updated_at ON public.email_templates;
DROP FUNCTION IF EXISTS public.update_email_templates_updated_at();

-- Surviving triggers after this step:
--   contacts         update_contacts_updated_at        -> update_updated_at_column()
--   email_templates  update_email_templates_updated_at -> update_updated_at_column()

-- ---------------------------------------------------------------------------
-- 2. trg_games_update_gamesfull_live() — orphaned AND broken
-- ---------------------------------------------------------------------------
-- No trigger references this function. More than that, its body is not runnable:
--
--     DELETE FROM gamesfull_live WHERE id = OLD.id;
--     PERFORM refresh_gamesfull_live_row(NEW.id);
--
-- Neither `gamesfull_live` (table) nor `refresh_gamesfull_live_row()` (function)
-- exists in this database. This is residue from a rename — corroborated by the
-- fact that gamesfull's primary key is STILL named `gamesfull_live_pkey`.
-- Attaching it to a trigger today would fail at runtime.
--
-- The live equivalent, trg_games_update_gamesfull() -> refresh_gamesfull_row(),
-- is wired to `games` and is NOT touched here.

DROP FUNCTION IF EXISTS public.trg_games_update_gamesfull_live();

-- ROLLBACK
--   See 008_rollback_duplicate_triggers_and_orphan.sql
