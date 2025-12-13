-- Add UTM and extras storage to leads
alter table leads add column if not exists utm jsonb;
alter table leads add column if not exists extras jsonb;

-- Optional: allow authenticated users to read these columns if RLS is on
-- (Adjust policy names if they already exist.)
-- Example read policy (manager sees own leads via join in your views; tailor as needed):
-- create policy "leads read all for managers"
-- on leads for select to authenticated using (true);
