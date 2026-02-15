-- ============================================================
-- SpaceFurnio E-Commerce Products Database
-- Migration 002: Seed Data
-- ============================================================
BEGIN;

-- -----------------------------------------------------------
-- 1. Brands
-- -----------------------------------------------------------
INSERT INTO brands (name, slug) VALUES
('Nordic Home','nordic-home'),('Comfort Living','comfort-living'),('Urban Steel','urban-steel'),
('Art Studio','art-studio'),('Nature''s Art','natures-art'),('Heritage Prints','heritage-prints'),
('Potter''s Choice','potters-choice'),('Textile Co.','textile-co'),('Boho Craft','boho-craft'),
('Industrial Lighting','industrial-lighting'),('Bright Ideas','bright-ideas'),('Luxury Lighting','luxury-lighting'),
('Welcome Home','welcome-home'),('Elegant Dining','elegant-dining'),('Family Gatherings','family-gatherings'),
('Chef''s Choice','chefs-choice'),('Kitchen Lighting','kitchen-lighting'),('Professional Workspace','professional-workspace'),
('Comfort Work','comfort-work'),('Sleep Well','sleep-well'),('Bedroom Essentials','bedroom-essentials'),
('Bathroom Luxury','bathroom-luxury'),('Bath Organization','bath-organization'),('Balcony Living','balcony-living'),
('Garden Style','garden-style'),('Relaxation Co','relaxation-co'),('Light Reading','light-reading'),
('Poolside Paradise','poolside-paradise'),('Shade Solutions','shade-solutions'),
('Raw Design','raw-design'),('Industrial Form','industrial-form'),('Minimal Living','minimal-living'),
('Less Is More','less-is-more'),('Eco Furniture','eco-furniture'),('Green Office','green-office'),
('Digital Craft','digital-craft'),('Form Function','form-function'),('Wabi Ceramics','wabi-ceramics'),
('Natural Living','natural-living'),('Heritage Furniture','heritage-furniture'),('Traditional Textiles','traditional-textiles'),
('Vintage Revival','vintage-revival'),('Retro Reflections','retro-reflections'),('Royal Comfort','royal-comfort'),
('Victorian Elegance','victorian-elegance'),('Peaceful Sleep','peaceful-sleep'),('Serene Living','serene-living'),
('Desert Dreams','desert-dreams'),('Marrakech Modern','marrakech-modern');

-- -----------------------------------------------------------
-- 2. Categories
-- -----------------------------------------------------------
INSERT INTO categories (name, slug) VALUES
('Furniture','furniture'),('Wall Art','wall-art'),('Decor','decor'),('Lights','lights');

-- -----------------------------------------------------------
-- 3. Spaces
-- -----------------------------------------------------------
INSERT INTO spaces (name, slug) VALUES
('Foyer','foyer'),('Dining Room','dining'),('Kitchen','kitchen'),('Home Office','home-office'),
('Bedroom','bedroom'),('Bathroom','bathroom'),('Balcony','balcony'),('Lounge','lounge'),('Poolside','poolside');

-- -----------------------------------------------------------
-- 4. Styles
-- -----------------------------------------------------------
INSERT INTO styles (name, slug) VALUES
('Brutalist','brutalist'),('Minimalist','minimalist'),('Sustainable','sustainable'),
('Parametric','parametric'),('Wabi-Sabi','wabi-sabi'),('Traditional','traditional'),
('Vintage Retro','vintage-retro'),('Victorian','victorian'),('Japandi','japandi'),('Moroccan','moroccan');

-- -----------------------------------------------------------
-- 5. Rooms
-- -----------------------------------------------------------
INSERT INTO rooms (name, slug) VALUES
('Living Room','living-room'),('Study','study'),('Dining Room','dining-room'),
('Bedroom','bedroom'),('Home Office','home-office'),('Any Room','any-room'),
('Open Space','open-space'),('Foyer','foyer'),('Kitchen','kitchen'),
('Bathroom','bathroom'),('Balcony','balcony'),('Lounge','lounge'),('Poolside','poolside');

-- -----------------------------------------------------------
-- 6. Materials
-- -----------------------------------------------------------
INSERT INTO materials (name) VALUES
('Oak Wood'),('Velvet'),('Steel & Wood'),('Canvas'),('Paper Print'),('Aged Paper'),
('Ceramic'),('Cotton Blend'),('Cotton Rope'),('Metal & Glass'),('Steel & Fabric'),
('Crystal & Metal'),('Walnut Wood'),('Crystal & Brass'),('Solid Wood'),('Butcher Block'),
('Engineered Wood'),('Mesh & Plastic'),('Upholstered Fabric'),('Wood'),('Glass & LED'),
('Water-Resistant Wood'),('Aluminum & Textilene'),('Fiberglass'),('Metal & Fabric'),
('Aluminum & Quick-Dry Fabric'),('UV-Resistant Fabric'),('Concrete'),('White Oak'),
('Plywood'),('Reclaimed Wood'),('Bamboo'),('3D Printed Polymer'),('Metal'),('Stoneware'),
('Aged Wood'),('Mahogany'),('Wool'),('Brass & Glass'),('Metal & Mirror'),
('Velvet & Carved Wood'),('Carved Wood & Gold Leaf'),('Oak & Linen'),('Ash Wood'),
('Leather'),('Ceramic Tile & Metal');

-- -----------------------------------------------------------
-- 7. Colors
-- -----------------------------------------------------------
INSERT INTO colors (name) VALUES
('Natural'),('Dark Brown'),('Navy Blue'),('Emerald Green'),('Blush Pink'),('Black'),
('Rustic Brown'),('Multi-Color'),('Black & White'),('Green'),('Sepia'),('Vintage Brown'),
('White'),('Terracotta'),('Sage Green'),('Cream'),('Mustard'),('Rust Orange'),('Brass'),
('Copper'),('Gold'),('Clear'),('Amber'),('Dark Walnut'),('Natural Oak'),('Chrome'),
('Oak'),('Mahogany'),('White Oak'),('Gray'),('Espresso'),('Charcoal'),('Beige'),('Navy'),
('White Light'),('Warm Light'),('Bronze'),('Emerald'),('Blush'),('Black Steel'),
('Raw Steel'),('White Stain'),('Natural Reclaimed'),('Weathered Gray'),('Natural Bamboo'),
('Metallic'),('Earth Tone'),('Matte Black'),('Natural Weathered'),('Rich Mahogany'),
('Cherry'),('Red & Gold'),('Blue & Cream'),('Burgundy'),('Forest Green'),('Antique Gold'),
('Natural Ash'),('Tan'),('Blue & White'),('Black & Gold'),('Nickel');

COMMIT;
