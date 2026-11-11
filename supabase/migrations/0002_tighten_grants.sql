-- Supabase's default privileges gave anon/authenticated access to every table in public,
-- so RLS was the only layer protecting admins and enquiries. Reset table privileges to
-- exactly what the app needs. RLS still decides which rows each role can see.

-- Remove all existing table privileges from the API roles
revoke all on all tables in schema public from anon, authenticated;

-- Stop future tables from being exposed automatically
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;

-- Visitors: read the catalog, submit enquiries
grant select on public.categories, public.products, public.product_images, public.exhibitions
  to anon, authenticated;
grant insert on public.enquiries to anon, authenticated;

-- Logged-in users: full catalog access (RLS limits writes to admins)
grant insert, update, delete on public.categories, public.products, public.product_images, public.exhibitions
  to authenticated;
grant select, delete on public.enquiries to authenticated;
grant select on public.admins to authenticated;
