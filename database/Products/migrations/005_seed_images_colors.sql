-- ============================================================
-- SpaceFurnio E-Commerce Products Database  
-- Migration 005: Seed Product Images & Product Colors
-- ============================================================
BEGIN;

-- -----------------------------------------------------------
-- Product Images (primary image per product)
-- -----------------------------------------------------------
INSERT INTO product_images (product_id, src, alt, sort_order, is_primary)
SELECT p.id, v.src, v.alt, 0, true
FROM (VALUES
  ('modern-oak-dining-table','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop','Modern oak dining table with clean lines'),
  ('velvet-accent-chair','https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500&h=500&fit=crop','Luxurious velvet accent chair'),
  ('industrial-bookshelf','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop','Industrial style bookshelf with steel frame'),
  ('abstract-canvas-print','https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=500&h=500&fit=crop','Modern abstract canvas artwork'),
  ('botanical-gallery-wall-set','https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500&h=500&fit=crop','Set of botanical prints for gallery wall'),
  ('vintage-map-collection','https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500&h=500&fit=crop','Collection of vintage world maps'),
  ('ceramic-vase-collection','https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop','Set of modern ceramic vases'),
  ('woven-throw-pillows','https://images.unsplash.com/photo-1586227740560-8cf2732c1531?w=500&h=500&fit=crop','Textured woven throw pillows'),
  ('macrame-wall-hanging','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop','Handmade macrame wall decoration'),
  ('edison-bulb-pendant-light','https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=500&h=500&fit=crop','Vintage Edison bulb pendant light'),
  ('modern-floor-lamp','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop','Sleek modern floor lamp'),
  ('crystal-chandelier','https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=500&h=500&fit=crop','Elegant crystal chandelier'),
  ('entryway-console-table','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop','Modern glass coffee table set'),
  ('dining-room-chandelier','https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=500&h=500&fit=crop','Elegant dining room chandelier'),
  ('extendable-dining-table','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop','Beautiful extendable dining table'),
  ('kitchen-island-cart','https://m.media-amazon.com/images/I/71u3F2NZ9gL._SX569_.jpg','Functional kitchen island cart'),
  ('pendant-light-trio','https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=500&h=500&fit=crop','Set of three kitchen pendant lights'),
  ('executive-desk','https://m.media-amazon.com/images/I/71u3F2NZ9gL._SX569_.jpg','Modern executive office desk'),
  ('ergonomic-office-chair','https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500&h=500&fit=crop','Ergonomic mesh office chair'),
  ('platform-bed-frame','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop','Modern upholstered platform bed'),
  ('bedside-table-pair','https://m.media-amazon.com/images/I/71u3F2NZ9gL._SX569_.jpg','Set of matching bedside tables'),
  ('vanity-mirror-with-lights','https://m.media-amazon.com/images/I/71u3F2NZ9gL._SX569_.jpg','LED vanity mirror for bathroom'),
  ('storage-cabinet','https://m.media-amazon.com/images/I/71u3F2NZ9gL._SX569_.jpg','Bathroom storage cabinet'),
  ('outdoor-bistro-set','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop','Compact outdoor bistro dining set'),
  ('weather-resistant-planters','https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop','Set of outdoor planters'),
  ('chaise-lounge','https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500&h=500&fit=crop','Luxurious velvet chaise lounge'),
  ('reading-floor-lamp','https://m.media-amazon.com/images/I/71u3F2NZ9gL._SX569_.jpg','Adjustable reading floor lamp'),
  ('pool-lounge-chairs','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop','Set of poolside lounge chairs'),
  ('outdoor-umbrella','https://m.media-amazon.com/images/I/71u3F2NZ9gL._SX569_.jpg','Large outdoor patio umbrella'),
  ('concrete-block-coffee-table','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop','Raw concrete block coffee table'),
  ('steel-frame-bookshelf','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop','Brutalist steel frame bookshelf'),
  ('clean-line-dining-table','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop','Minimalist oak dining table'),
  ('simple-storage-bench','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop','Clean minimalist storage bench'),
  ('reclaimed-wood-console','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop','Sustainable reclaimed wood console'),
  ('bamboo-desk-organizer','https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop','Eco-friendly bamboo desk organizer'),
  ('algorithmic-wall-art','https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=500&h=500&fit=crop','Parametric algorithmic wall sculpture'),
  ('geometric-room-divider','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop','Parametric geometric room divider'),
  ('imperfect-ceramic-vase','https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop','Handmade imperfect ceramic vase'),
  ('weathered-wood-stool','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop','Rustic weathered wood stool'),
  ('ornate-wooden-armchair','https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500&h=500&fit=crop','Traditional ornate wooden armchair'),
  ('classic-persian-style-rug','https://images.unsplash.com/photo-1586227740560-8cf2732c1531?w=500&h=500&fit=crop','Traditional Persian-style area rug'),
  ('retro-bar-cart','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop','Mid-century modern bar cart'),
  ('sunburst-mirror','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop','Vintage sunburst wall mirror'),
  ('victorian-velvet-sofa','https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500&h=500&fit=crop','Elegant Victorian velvet sofa'),
  ('ornate-gilt-mirror','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop','Victorian ornate gilded mirror'),
  ('zen-platform-bed','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop','Japandi style platform bed'),
  ('minimalist-tea-table','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop','Simple Japanese-inspired tea table'),
  ('moroccan-pouf-ottoman','https://images.unsplash.com/photo-1586227740560-8cf2732c1531?w=500&h=500&fit=crop','Handcrafted Moroccan leather pouf'),
  ('geometric-tile-side-table','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop','Moroccan geometric tile side table')
) AS v(slug, src, alt)
JOIN products p ON p.slug = v.slug;

-- -----------------------------------------------------------
-- Product Colors (M:N junction)
-- -----------------------------------------------------------
INSERT INTO product_colors (product_id, color_id, sort_order)
SELECT p.id, c.id, v.ord
FROM (VALUES
  ('modern-oak-dining-table','Natural',0),('modern-oak-dining-table','Dark Brown',1),
  ('velvet-accent-chair','Navy Blue',0),('velvet-accent-chair','Emerald Green',1),('velvet-accent-chair','Blush Pink',2),
  ('industrial-bookshelf','Black',0),('industrial-bookshelf','Rustic Brown',1),
  ('abstract-canvas-print','Multi-Color',0),('abstract-canvas-print','Black & White',1),
  ('botanical-gallery-wall-set','Green',0),('botanical-gallery-wall-set','Natural',1),
  ('vintage-map-collection','Sepia',0),('vintage-map-collection','Vintage Brown',1),
  ('ceramic-vase-collection','White',0),('ceramic-vase-collection','Terracotta',1),('ceramic-vase-collection','Sage Green',2),
  ('woven-throw-pillows','Cream',0),('woven-throw-pillows','Mustard',1),('woven-throw-pillows','Rust Orange',2),
  ('macrame-wall-hanging','Natural',0),('macrame-wall-hanging','Cream',1),
  ('edison-bulb-pendant-light','Black',0),('edison-bulb-pendant-light','Brass',1),('edison-bulb-pendant-light','Copper',2),
  ('modern-floor-lamp','White',0),('modern-floor-lamp','Black',1),('modern-floor-lamp','Gold',2),
  ('crystal-chandelier','Clear',0),('crystal-chandelier','Amber',1),
  ('entryway-console-table','Dark Walnut',0),('entryway-console-table','Natural Oak',1),
  ('dining-room-chandelier','Brass',0),('dining-room-chandelier','Chrome',1),
  ('extendable-dining-table','Oak',0),('extendable-dining-table','Mahogany',1),('extendable-dining-table','White Oak',2),
  ('kitchen-island-cart','Natural',0),('kitchen-island-cart','White',1),('kitchen-island-cart','Gray',2),
  ('pendant-light-trio','Brass',0),('pendant-light-trio','Black',1),('pendant-light-trio','Nickel',2),
  ('executive-desk','Espresso',0),('executive-desk','White',1),('executive-desk','Gray',2),
  ('ergonomic-office-chair','Black',0),('ergonomic-office-chair','Gray',1),('ergonomic-office-chair','White',2),
  ('platform-bed-frame','Charcoal',0),('platform-bed-frame','Beige',1),('platform-bed-frame','Navy',2),
  ('bedside-table-pair','Walnut',0),('bedside-table-pair','White',1),('bedside-table-pair','Black',2),
  ('vanity-mirror-with-lights','White Light',0),('vanity-mirror-with-lights','Warm Light',1),
  ('storage-cabinet','White',0),('storage-cabinet','Gray',1),('storage-cabinet','Natural',2),
  ('outdoor-bistro-set','Black',0),('outdoor-bistro-set','Bronze',1),('outdoor-bistro-set','White',2),
  ('weather-resistant-planters','Terracotta',0),('weather-resistant-planters','White',1),('weather-resistant-planters','Black',2),
  ('chaise-lounge','Emerald',0),('chaise-lounge','Navy',1),('chaise-lounge','Blush',2),
  ('reading-floor-lamp','Brass',0),('reading-floor-lamp','Black',1),('reading-floor-lamp','White',2),
  ('pool-lounge-chairs','Navy',0),('pool-lounge-chairs','Gray',1),('pool-lounge-chairs','White',2),
  ('outdoor-umbrella','Navy',0),('outdoor-umbrella','Beige',1),('outdoor-umbrella','Forest Green',2),
  ('concrete-block-coffee-table','Gray',0),('concrete-block-coffee-table','Charcoal',1),
  ('steel-frame-bookshelf','Black Steel',0),('steel-frame-bookshelf','Raw Steel',1),
  ('clean-line-dining-table','Natural',0),('clean-line-dining-table','White Stain',1),
  ('simple-storage-bench','Natural',0),('simple-storage-bench','White',1),
  ('reclaimed-wood-console','Natural Reclaimed',0),('reclaimed-wood-console','Weathered Gray',1),
  ('bamboo-desk-organizer','Natural Bamboo',0),
  ('algorithmic-wall-art','White',0),('algorithmic-wall-art','Black',1),('algorithmic-wall-art','Metallic',2),
  ('geometric-room-divider','White',0),('geometric-room-divider','Gold',1),('geometric-room-divider','Black',2),
  ('imperfect-ceramic-vase','Earth Tone',0),('imperfect-ceramic-vase','Matte Black',1),
  ('weathered-wood-stool','Natural Weathered',0),
  ('ornate-wooden-armchair','Rich Mahogany',0),('ornate-wooden-armchair','Cherry',1),
  ('classic-persian-style-rug','Red & Gold',0),('classic-persian-style-rug','Blue & Cream',1),
  ('retro-bar-cart','Brass',0),('retro-bar-cart','Chrome',1),
  ('sunburst-mirror','Gold',0),('sunburst-mirror','Bronze',1),
  ('victorian-velvet-sofa','Burgundy',0),('victorian-velvet-sofa','Forest Green',1),('victorian-velvet-sofa','Navy',2),
  ('ornate-gilt-mirror','Antique Gold',0),
  ('zen-platform-bed','Natural Oak',0),('zen-platform-bed','White Oak',1),
  ('minimalist-tea-table','Natural Ash',0),('minimalist-tea-table','White Stain',1),
  ('moroccan-pouf-ottoman','Tan',0),('moroccan-pouf-ottoman','Black',1),('moroccan-pouf-ottoman','Burgundy',2),
  ('geometric-tile-side-table','Blue & White',0),('geometric-tile-side-table','Black & Gold',1)
) AS v(slug, color_name, ord)
JOIN products p ON p.slug = v.slug
JOIN colors  c ON c.name = v.color_name;

COMMIT;
