-- Tags the sample products with colors and materials. Safe to re-run.

insert into public.product_colors (product_id, color_id)
select p.id, c.id
from (
  values
    ('blue-crystal-neckpiece', 'blue'), ('blue-crystal-neckpiece', 'gold'),
    ('pearl-mangalsutra', 'white'), ('pearl-mangalsutra', 'silver'),
    ('tanmani', 'white'), ('tanmani', 'gold'), ('tanmani', 'red'), ('tanmani', 'green'),
    ('blue-rectangular-glass-bead-necklace', 'blue'), ('blue-rectangular-glass-bead-necklace', 'silver'),
    ('red-white-glass-bead-bracelet', 'red'), ('red-white-glass-bead-bracelet', 'white'),
    ('red-black-glass-bead-bracelet', 'red'), ('red-black-glass-bead-bracelet', 'black'),
    ('red-pearl-bracelet', 'red'), ('red-pearl-bracelet', 'gold'),
    ('white-orange-pearl-bracelet', 'white'), ('white-orange-pearl-bracelet', 'orange')
) as v(product_slug, color_slug)
join public.products p on p.slug = v.product_slug
join public.colors c on c.slug = v.color_slug
on conflict do nothing;

insert into public.product_materials (product_id, material_id)
select p.id, m.id
from (
  values
    ('blue-crystal-neckpiece', 'crystal'), ('blue-crystal-neckpiece', 'metal'), ('blue-crystal-neckpiece', 'stones'),
    ('pearl-mangalsutra', 'pearl'), ('pearl-mangalsutra', 'metal'), ('pearl-mangalsutra', 'stones'),
    ('tanmani', 'pearl'), ('tanmani', 'metal'), ('tanmani', 'stones'),
    ('blue-rectangular-glass-bead-necklace', 'glass'), ('blue-rectangular-glass-bead-necklace', 'metal'),
    ('red-white-glass-bead-bracelet', 'glass'),
    ('red-black-glass-bead-bracelet', 'glass'),
    ('red-pearl-bracelet', 'pearl'),
    ('white-orange-pearl-bracelet', 'pearl'), ('white-orange-pearl-bracelet', 'glass')
) as v(product_slug, material_slug)
join public.products p on p.slug = v.product_slug
join public.materials m on m.slug = v.material_slug
on conflict do nothing;
