-- Colors and materials as admin-managed filter options, linked to products many-to-many
-- (one piece can be several colors and materials).

create table public.colors (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  hex text not null default '#cccccc' check (hex ~ '^#[0-9a-fA-F]{6}$'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.product_colors (
  product_id uuid not null references public.products (id) on delete cascade,
  color_id uuid not null references public.colors (id) on delete cascade,
  primary key (product_id, color_id)
);

create table public.product_materials (
  product_id uuid not null references public.products (id) on delete cascade,
  material_id uuid not null references public.materials (id) on delete cascade,
  primary key (product_id, material_id)
);

create index product_colors_color_id_idx on public.product_colors (color_id);
create index product_materials_material_id_idx on public.product_materials (material_id);

-- Grants (RLS below decides which rows)
grant select on public.colors, public.materials, public.product_colors, public.product_materials
  to anon, authenticated;
grant insert, update, delete on public.colors, public.materials, public.product_colors, public.product_materials
  to authenticated;

alter table public.colors enable row level security;
alter table public.materials enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_materials enable row level security;

create policy "Public can read colors"
  on public.colors for select to anon, authenticated using (true);
create policy "Admins manage colors"
  on public.colors for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Public can read materials"
  on public.materials for select to anon, authenticated using (true);
create policy "Admins manage materials"
  on public.materials for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Public can read colors of visible products"
  on public.product_colors for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_colors.product_id and p.is_visible));
create policy "Admins manage product colors"
  on public.product_colors for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Public can read materials of visible products"
  on public.product_materials for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_materials.product_id and p.is_visible));
create policy "Admins manage product materials"
  on public.product_materials for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Starter options (editable later from the admin dashboard)
insert into public.colors (name, slug, hex, sort_order) values
  ('Red', 'red', '#c62828', 1),
  ('White', 'white', '#f5f3ee', 2),
  ('Black', 'black', '#1a1a1a', 3),
  ('Blue', 'blue', '#1e4fa8', 4),
  ('Green', 'green', '#2e7d4f', 5),
  ('Orange', 'orange', '#e07b28', 6),
  ('Gold', 'gold', '#c9a227', 7),
  ('Silver', 'silver', '#b8bcc2', 8)
on conflict (slug) do nothing;

insert into public.materials (name, slug, sort_order) values
  ('Pearl', 'pearl', 1),
  ('Glass', 'glass', 2),
  ('Crystal', 'crystal', 3),
  ('Plastic', 'plastic', 4),
  ('Metal', 'metal', 5),
  ('Stones (kundan)', 'stones', 6)
on conflict (slug) do nothing;
