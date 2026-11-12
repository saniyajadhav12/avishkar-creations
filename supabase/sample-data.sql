-- Sample products for development and launch, using photos from Instagram.
-- Prices are placeholders. Safe to re-run: existing rows are skipped.
-- Photos are uploaded to the product-images bucket under samples/<slug>.jpg.

insert into public.products (name, slug, description, price_inr, category_id, is_featured, is_sold_out)
select v.name, v.slug, v.description, v.price_inr, c.id, v.is_featured, v.is_sold_out
from (
  values
    ('Blue Crystal Neckpiece', 'blue-crystal-neckpiece',
     'Faceted midnight-blue crystal beads with gold-tone spacers, finished with an ornate temple-style pendant set with ruby and emerald stones. Comes with matching jhumka earrings.',
     1450, 'pendant-sets', true, false),
    ('Pearl Mangalsutra', 'pearl-mangalsutra',
     'Three strands of white pearls with an oxidised silver pendant centred on a ruby stone and finished with pearl drops. Comes with matching oxidised floral studs.',
     950, 'pendant-sets', true, false),
    ('Tanmani', 'tanmani',
     'A traditional Maharashtrian tanmani: two pearl strands with a gold-tone kundan pendant of ruby and emerald stones edged with pearls. Comes with matching earrings.',
     1250, 'pendant-sets', true, false),
    ('Blue Rectangular Glass Bead Necklace', 'blue-rectangular-glass-bead-necklace',
     'Cobalt-blue rectangular glass beads with antique-gold rims and silver-tone spacers. Comes with a matching bracelet and oxidised drop earrings.',
     850, 'necklaces', true, false),
    ('Red & White Glass Bead Bracelet', 'red-white-glass-bead-bracelet',
     'Alternating ruby-red and milky-white oval glass beads with silver-tone accents and an adjustable clasp.',
     350, 'bracelets', false, false),
    ('Red & Black Glass Bead Bracelet', 'red-black-glass-bead-bracelet',
     'Ruby-red and jet-black oval glass beads with gold-tone spacers and an adjustable clasp.',
     350, 'bracelets', false, true),
    ('Red Pearl Bracelet', 'red-pearl-bracelet',
     'Two delicate strands of red pearls separated by tiny gold-tone beads, with an adjustable clasp.',
     300, 'bracelets', false, false),
    ('White & Orange Pearl Bracelet', 'white-orange-pearl-bracelet',
     'Two strands of white pearls and translucent orange beads with gold-tone spacers and an adjustable clasp.',
     400, 'bracelets', false, false)
) as v(name, slug, description, price_inr, category_slug, is_featured, is_sold_out)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;

insert into public.product_images (product_id, storage_path, alt_text, sort_order)
select p.id, 'samples/' || p.slug || '.jpg', v.alt_text, 0
from (
  values
    ('blue-crystal-neckpiece', 'Blue crystal bead necklace with gold temple pendant and matching jhumkas'),
    ('pearl-mangalsutra', 'Three-strand pearl mangalsutra with oxidised silver pendant and matching studs'),
    ('tanmani', 'Pearl tanmani with ruby and emerald kundan pendant and matching earrings'),
    ('blue-rectangular-glass-bead-necklace', 'Blue rectangular glass bead necklace with matching bracelet and earrings'),
    ('red-white-glass-bead-bracelet', 'Red and white oval glass bead bracelet'),
    ('red-black-glass-bead-bracelet', 'Red and black oval glass bead bracelet'),
    ('red-pearl-bracelet', 'Two-strand red pearl bracelet with gold-tone beads'),
    ('white-orange-pearl-bracelet', 'Two-strand white pearl and orange bead bracelet')
) as v(slug, alt_text)
join public.products p on p.slug = v.slug
on conflict (storage_path) do nothing;
