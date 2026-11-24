-- Customer accounts: profiles, wishlists, and site settings (login-to-message switch).

-- =========================================================
-- Profiles (one per account, created automatically on sign-up)
-- =========================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 100),
  phone text check (phone is null or phone ~ '^\+?[0-9 ()-]{7,20}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Runs as the table owner so new users get a profile without needing insert rights themselves.
-- Email sign-up passes full_name; Google provides full_name or name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 100)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for accounts that existed before this migration
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- =========================================================
-- Wishlists
-- =========================================================

create table public.wishlist_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index wishlist_items_product_id_idx on public.wishlist_items (product_id);

-- =========================================================
-- Site settings (exactly one row)
-- =========================================================

create table public.site_settings (
  id boolean primary key default true check (id),
  require_login_to_message boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

insert into public.site_settings (id) values (true)
on conflict (id) do nothing;

-- =========================================================
-- Grants (RLS below decides which rows)
-- =========================================================

grant select, update on public.profiles to authenticated;
grant select, insert, delete on public.wishlist_items to authenticated;
grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.profiles enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.site_settings enable row level security;

create policy "Users read own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Users read own wishlist"
  on public.wishlist_items for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users add to own wishlist"
  on public.wishlist_items for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users remove from own wishlist"
  on public.wishlist_items for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "Anyone can read site settings"
  on public.site_settings for select to anon, authenticated
  using (true);

create policy "Admins update site settings"
  on public.site_settings for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
