-- Avishkar Creations: database schema, Row Level Security, and storage.
-- Run once in the Supabase SQL editor on a fresh project.
-- "Automatically expose new tables" is OFF, so every table below gets explicit grants.

-- =========================================================
-- Helpers
-- =========================================================

-- Keeps updated_at current on every edit
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- Tables
-- =========================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 2000),
  price_inr integer not null check (price_inr >= 0),
  category_id uuid references public.categories (id) on delete set null,
  is_featured boolean not null default false,
  is_visible boolean not null default true,
  is_sold_out boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null default '' check (char_length(alt_text) <= 200),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.exhibitions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  venue text not null check (char_length(venue) between 1 and 120),
  city text not null check (char_length(city) between 1 and 60),
  start_date date not null,
  end_date date not null,
  notes text not null default '' check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  phone text check (phone is null or phone ~ '^\+?[0-9 ()-]{7,20}$'),
  email text check (
    email is null
    or (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
  ),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now(),
  check (phone is not null or email is not null)
);

-- Admin allowlist. Managed only from the Supabase dashboard, never through the API.
create table public.admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

-- Indexes for common lookups
create index products_category_id_idx on public.products (category_id);
create index product_images_product_id_idx on public.product_images (product_id, sort_order);
create index exhibitions_end_date_idx on public.exhibitions (end_date);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger exhibitions_set_updated_at
  before update on public.exhibitions
  for each row execute function public.set_updated_at();

-- =========================================================
-- Admin check
-- =========================================================

-- True when the logged-in user's email is on the allowlist.
-- security definer lets it read public.admins, which visitors can't.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- =========================================================
-- Grants (which tables each role can reach; RLS then decides which rows)
-- =========================================================

grant usage on schema public to anon, authenticated;

-- Visitors: read the catalog, submit enquiries
grant select on public.categories, public.products, public.product_images, public.exhibitions
  to anon, authenticated;
grant insert on public.enquiries to anon, authenticated;

-- Logged-in users: full catalog access (RLS limits writes to admins)
grant insert, update, delete on public.categories, public.products, public.product_images, public.exhibitions
  to authenticated;
grant select, delete on public.enquiries to authenticated;
grant select on public.admins to authenticated;

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.exhibitions enable row level security;
alter table public.enquiries enable row level security;
alter table public.admins enable row level security;

-- categories
create policy "Public can read categories"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "Admins manage categories"
  on public.categories for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- products: visitors only see visible products; admins see everything
create policy "Public can read visible products"
  on public.products for select
  to anon, authenticated
  using (is_visible);

create policy "Admins manage products"
  on public.products for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- product_images: only images of visible products are public
create policy "Public can read images of visible products"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.is_visible
    )
  );

create policy "Admins manage product images"
  on public.product_images for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- exhibitions: visitors only see current and upcoming ones
create policy "Public can read upcoming exhibitions"
  on public.exhibitions for select
  to anon, authenticated
  using (end_date >= current_date);

create policy "Admins manage exhibitions"
  on public.exhibitions for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- enquiries: anyone can submit, only admins can read or delete
create policy "Anyone can submit an enquiry"
  on public.enquiries for insert
  to anon, authenticated
  with check (true);

create policy "Admins read enquiries"
  on public.enquiries for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins delete enquiries"
  on public.enquiries for delete
  to authenticated
  using ((select public.is_admin()));

-- admins: admins can see the allowlist; no one can change it through the API
create policy "Admins read admin list"
  on public.admins for select
  to authenticated
  using ((select public.is_admin()));

-- =========================================================
-- Storage: product images
-- =========================================================

-- Public bucket: anyone can view images by URL. Max 5 MB, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Admins read product image files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

create policy "Admins upload product image files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "Admins update product image files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "Admins delete product image files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
