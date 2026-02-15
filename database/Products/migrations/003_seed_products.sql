-- ============================================================
-- SpaceFurnio E-Commerce Products Database
-- Migration 003: Seed Products (Category Products 1-12)
-- ============================================================
BEGIN;

-- Helper: insert products using subqueries to resolve FKs by name
-- Category Products (listing_type = 'category')

INSERT INTO products (name, slug, price_cents, brand_id, category_id, material_id, listing_type, rating, review_count, popularity, href, created_at) VALUES
('Modern Oak Dining Table','modern-oak-dining-table',89900,(SELECT id FROM brands WHERE slug='nordic-home'),(SELECT id FROM categories WHERE slug='furniture'),(SELECT id FROM materials WHERE name='Oak Wood'),'category',4.5,128,95,'./1','2024-01-15'),
('Velvet Accent Chair','velvet-accent-chair',45900,(SELECT id FROM brands WHERE slug='comfort-living'),(SELECT id FROM categories WHERE slug='furniture'),(SELECT id FROM materials WHERE name='Velvet'),'category',4.2,89,87,'./2','2024-02-03'),
('Industrial Bookshelf','industrial-bookshelf',32900,(SELECT id FROM brands WHERE slug='urban-steel'),(SELECT id FROM categories WHERE slug='furniture'),(SELECT id FROM materials WHERE name='Steel & Wood'),'category',4.7,156,92,'./3','2024-01-28'),
('Abstract Canvas Print','abstract-canvas-print',12900,(SELECT id FROM brands WHERE slug='art-studio'),(SELECT id FROM categories WHERE slug='wall-art'),(SELECT id FROM materials WHERE name='Canvas'),'category',4.3,73,78,'./4','2024-02-10'),
('Botanical Gallery Wall Set','botanical-gallery-wall-set',18900,(SELECT id FROM brands WHERE slug='natures-art'),(SELECT id FROM categories WHERE slug='wall-art'),(SELECT id FROM materials WHERE name='Paper Print'),'category',4.6,94,89,'./5','2024-01-20'),
('Vintage Map Collection','vintage-map-collection',24900,(SELECT id FROM brands WHERE slug='heritage-prints'),(SELECT id FROM categories WHERE slug='wall-art'),(SELECT id FROM materials WHERE name='Aged Paper'),'category',4.4,67,82,'./6','2024-02-15'),
('Ceramic Vase Collection','ceramic-vase-collection',8900,(SELECT id FROM brands WHERE slug='potters-choice'),(SELECT id FROM categories WHERE slug='decor'),(SELECT id FROM materials WHERE name='Ceramic'),'category',4.1,112,75,'./7','2024-01-12'),
('Woven Throw Pillows','woven-throw-pillows',4900,(SELECT id FROM brands WHERE slug='textile-co'),(SELECT id FROM categories WHERE slug='decor'),(SELECT id FROM materials WHERE name='Cotton Blend'),'category',4.0,203,88,'./8','2024-02-05'),
('Macrame Wall Hanging','macrame-wall-hanging',7900,(SELECT id FROM brands WHERE slug='boho-craft'),(SELECT id FROM categories WHERE slug='decor'),(SELECT id FROM materials WHERE name='Cotton Rope'),'category',4.2,85,71,'./9','2024-01-25'),
('Edison Bulb Pendant Light','edison-bulb-pendant-light',17900,(SELECT id FROM brands WHERE slug='industrial-lighting'),(SELECT id FROM categories WHERE slug='lights'),(SELECT id FROM materials WHERE name='Metal & Glass'),'category',4.5,145,93,'./10','2024-01-30'),
('Modern Floor Lamp','modern-floor-lamp',29900,(SELECT id FROM brands WHERE slug='bright-ideas'),(SELECT id FROM categories WHERE slug='lights'),(SELECT id FROM materials WHERE name='Steel & Fabric'),'category',4.3,98,84,'./11','2024-02-08'),
('Crystal Chandelier','crystal-chandelier',129900,(SELECT id FROM brands WHERE slug='luxury-lighting'),(SELECT id FROM categories WHERE slug='lights'),(SELECT id FROM materials WHERE name='Crystal & Metal'),'category',4.8,42,96,'./12','2024-01-18');

-- Design-Space Products (listing_type = 'design-space')

INSERT INTO products (name, slug, price_cents, brand_id, space_id, room_id, material_id, listing_type, rating, review_count, popularity, href, created_at) VALUES
('Entryway Console Table','entryway-console-table',42900,(SELECT id FROM brands WHERE slug='welcome-home'),(SELECT id FROM spaces WHERE slug='foyer'),(SELECT id FROM rooms WHERE slug='foyer'),(SELECT id FROM materials WHERE name='Walnut Wood'),'design-space',4.4,87,89,'./101','2024-01-22'),
('Dining Room Chandelier','dining-room-chandelier',67900,(SELECT id FROM brands WHERE slug='elegant-dining'),(SELECT id FROM spaces WHERE slug='dining'),(SELECT id FROM rooms WHERE slug='dining-room'),(SELECT id FROM materials WHERE name='Crystal & Brass'),'design-space',4.7,123,91,'./105','2024-01-28'),
('Extendable Dining Table','extendable-dining-table',124900,(SELECT id FROM brands WHERE slug='family-gatherings'),(SELECT id FROM spaces WHERE slug='dining'),(SELECT id FROM rooms WHERE slug='dining-room'),(SELECT id FROM materials WHERE name='Solid Wood'),'design-space',4.5,167,88,'./106','2024-02-05'),
('Kitchen Island Cart','kitchen-island-cart',59900,(SELECT id FROM brands WHERE slug='chefs-choice'),(SELECT id FROM spaces WHERE slug='kitchen'),(SELECT id FROM rooms WHERE slug='kitchen'),(SELECT id FROM materials WHERE name='Butcher Block'),'design-space',4.4,145,86,'./107','2024-01-18'),
('Pendant Light Trio','pendant-light-trio',28900,(SELECT id FROM brands WHERE slug='kitchen-lighting'),(SELECT id FROM spaces WHERE slug='kitchen'),(SELECT id FROM rooms WHERE slug='kitchen'),(SELECT id FROM materials WHERE name='Metal & Glass'),'design-space',4.3,178,83,'./108','2024-02-09'),
('Executive Desk','executive-desk',89900,(SELECT id FROM brands WHERE slug='professional-workspace'),(SELECT id FROM spaces WHERE slug='home-office'),(SELECT id FROM rooms WHERE slug='home-office'),(SELECT id FROM materials WHERE name='Engineered Wood'),'design-space',4.6,203,92,'./109','2024-01-25'),
('Ergonomic Office Chair','ergonomic-office-chair',54900,(SELECT id FROM brands WHERE slug='comfort-work'),(SELECT id FROM spaces WHERE slug='home-office'),(SELECT id FROM rooms WHERE slug='home-office'),(SELECT id FROM materials WHERE name='Mesh & Plastic'),'design-space',4.4,298,89,'./110','2024-02-03'),
('Platform Bed Frame','platform-bed-frame',74900,(SELECT id FROM brands WHERE slug='sleep-well'),(SELECT id FROM spaces WHERE slug='bedroom'),(SELECT id FROM rooms WHERE slug='bedroom'),(SELECT id FROM materials WHERE name='Upholstered Fabric'),'design-space',4.5,187,90,'./111','2024-01-20'),
('Bedside Table Pair','bedside-table-pair',32900,(SELECT id FROM brands WHERE slug='bedroom-essentials'),(SELECT id FROM spaces WHERE slug='bedroom'),(SELECT id FROM rooms WHERE slug='bedroom'),(SELECT id FROM materials WHERE name='Wood'),'design-space',4.2,134,78,'./112','2024-02-14'),
('Vanity Mirror with Lights','vanity-mirror-with-lights',39900,(SELECT id FROM brands WHERE slug='bathroom-luxury'),(SELECT id FROM spaces WHERE slug='bathroom'),(SELECT id FROM rooms WHERE slug='bathroom'),(SELECT id FROM materials WHERE name='Glass & LED'),'design-space',4.7,156,94,'./113','2024-01-30'),
('Storage Cabinet','storage-cabinet',24900,(SELECT id FROM brands WHERE slug='bath-organization'),(SELECT id FROM spaces WHERE slug='bathroom'),(SELECT id FROM rooms WHERE slug='bathroom'),(SELECT id FROM materials WHERE name='Water-Resistant Wood'),'design-space',4.3,89,75,'./114','2024-02-07'),
('Outdoor Bistro Set','outdoor-bistro-set',44900,(SELECT id FROM brands WHERE slug='balcony-living'),(SELECT id FROM spaces WHERE slug='balcony'),(SELECT id FROM rooms WHERE slug='balcony'),(SELECT id FROM materials WHERE name='Aluminum & Textilene'),'design-space',4.4,112,81,'./115','2024-01-15'),
('Weather-Resistant Planters','weather-resistant-planters',12900,(SELECT id FROM brands WHERE slug='garden-style'),(SELECT id FROM spaces WHERE slug='balcony'),(SELECT id FROM rooms WHERE slug='balcony'),(SELECT id FROM materials WHERE name='Fiberglass'),'design-space',4.1,98,72,'./116','2024-02-11'),
('Chaise Lounge','chaise-lounge',79900,(SELECT id FROM brands WHERE slug='relaxation-co'),(SELECT id FROM spaces WHERE slug='lounge'),(SELECT id FROM rooms WHERE slug='lounge'),(SELECT id FROM materials WHERE name='Velvet'),'design-space',4.6,143,87,'./117','2024-01-28'),
('Reading Floor Lamp','reading-floor-lamp',19900,(SELECT id FROM brands WHERE slug='light-reading'),(SELECT id FROM spaces WHERE slug='lounge'),(SELECT id FROM rooms WHERE slug='lounge'),(SELECT id FROM materials WHERE name='Metal & Fabric'),'design-space',4.3,87,79,'./118','2024-02-15'),
('Pool Lounge Chairs','pool-lounge-chairs',89900,(SELECT id FROM brands WHERE slug='poolside-paradise'),(SELECT id FROM spaces WHERE slug='poolside'),(SELECT id FROM rooms WHERE slug='poolside'),(SELECT id FROM materials WHERE name='Aluminum & Quick-Dry Fabric'),'design-space',4.5,167,93,'./119','2024-01-12'),
('Outdoor Umbrella','outdoor-umbrella',34900,(SELECT id FROM brands WHERE slug='shade-solutions'),(SELECT id FROM spaces WHERE slug='poolside'),(SELECT id FROM rooms WHERE slug='poolside'),(SELECT id FROM materials WHERE name='UV-Resistant Fabric'),'design-space',4.2,124,76,'./120','2024-02-06');

COMMIT;
