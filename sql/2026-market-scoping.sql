-- Run once, manually, in the Supabase SQL editor for the shared project —
-- before the US deployment (VITE_MARKET=us) goes live.
--
-- Scopes scout_user_data by (id, market) instead of just (id), so the same
-- account can sync separate Berlin and US data without either deployment
-- overwriting the other's rows. Existing rows are backfilled as 'berlin'
-- (correct, since all current data belongs to the Berlin deployment).

alter table scout_user_data add column market text not null default 'berlin';
alter table scout_user_data drop constraint scout_user_data_pkey;
alter table scout_user_data add primary key (id, market);
