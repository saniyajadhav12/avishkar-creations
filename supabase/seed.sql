-- Starter categories. Editable later from the admin dashboard.
insert into public.categories (name, slug, sort_order) values
  ('Necklaces', 'necklaces', 1),
  ('Earrings', 'earrings', 2),
  ('Bracelets', 'bracelets', 3),
  ('Pendant Sets', 'pendant-sets', 4),
  ('Earring Sets', 'earring-sets', 5)
on conflict (slug) do nothing;
