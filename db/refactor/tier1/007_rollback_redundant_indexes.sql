-- ROLLBACK for 007_redundant_indexes.sql
-- Recreates the four dropped indexes exactly as captured from pg_get_indexdef()
-- on 2026-08-03. Restoring these reintroduces the redundancy; it is here only so
-- the step is reversible.

CREATE UNIQUE INDEX IF NOT EXISTS associations_name_city_state_idx
    ON public.associations USING btree (name, city, state);

ALTER TABLE public.associations
    ADD CONSTRAINT unique_association_combo UNIQUE (name, city, state);

CREATE INDEX IF NOT EXISTS idx_contacts_email
    ON public.contacts USING btree (email);

CREATE INDEX IF NOT EXISTS idx_gamesfull_team_date
    ON public.gamesfull USING btree (team, date);

CREATE INDEX IF NOT EXISTS idx_api_users_auth_user_id
    ON public.api_users USING btree (auth_user_id);
