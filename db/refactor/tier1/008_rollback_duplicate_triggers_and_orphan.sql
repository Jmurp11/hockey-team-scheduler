-- ROLLBACK for 008_duplicate_triggers_and_orphan.sql
-- Function bodies and trigger definitions captured verbatim from
-- pg_get_functiondef() / pg_get_triggerdef() on 2026-08-03.
--
-- Restoring these reintroduces duplicated per-row work (and one function that
-- references objects which do not exist). Here only for reversibility.

CREATE OR REPLACE FUNCTION public.update_contacts_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $function$;

CREATE TRIGGER trg_contacts_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION update_contacts_updated_at();

CREATE OR REPLACE FUNCTION public.update_email_templates_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $function$;

CREATE TRIGGER trg_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW EXECUTE FUNCTION update_email_templates_updated_at();

-- NOTE: this function references gamesfull_live and refresh_gamesfull_live_row(),
-- neither of which exists. It will create successfully (plpgsql bodies are not
-- validated at definition time) but would fail if ever executed.
CREATE OR REPLACE FUNCTION public.trg_games_update_gamesfull_live()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF TG_OP = 'DELETE' THEN
        DELETE FROM gamesfull_live WHERE id = OLD.id;
        RETURN OLD;
    ELSE
        PERFORM refresh_gamesfull_live_row(NEW.id);
        RETURN NEW;
    END IF;
END;
$function$;
