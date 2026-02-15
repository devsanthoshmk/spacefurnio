# SpaceFurnio — Products Database (PostgreSQL)

> Schema & seed migrations for the SpaceFurnio e-commerce product catalog.

---

## 📁 Migration Files

All migrations live in `Products/migrations/` and **must be run in order**:

| #   | File                          | Purpose                                         |
| --- | ----------------------------- | ----------------------------------------------- |
| 001 | `001_create_tables.sql`       | Create all tables, indexes, triggers & ENUMs     |
| 002 | `002_seed_data.sql`           | Seed lookup tables (brands, categories, etc.)    |
| 003 | `003_seed_products.sql`       | Insert Category & Design-Space products          |
| 004 | `004_seed_style_products.sql` | Insert Design-Style products                     |
| 005 | `005_seed_images_colors.sql`  | Seed product images & product ↔ color mappings   |

### Running Migrations

```bash
# Connect to your Postgres instance and run sequentially
psql -U <user> -d <database> -f Products/migrations/001_create_tables.sql
psql -U <user> -d <database> -f Products/migrations/002_seed_data.sql
psql -U <user> -d <database> -f Products/migrations/003_seed_products.sql
psql -U <user> -d <database> -f Products/migrations/004_seed_style_products.sql
psql -U <user> -d <database> -f Products/migrations/005_seed_images_colors.sql
```

---

## 🗂️ Schema Overview

### Entity-Relationship Diagram (Text)

```
brands ──────┐
categories ──┤
spaces ──────┤
styles ──────┼──→  products  ←──→  product_colors  ←──→  colors
rooms ───────┤         │
materials ───┘         │
                       └──→  product_images
```

### Tables

#### Lookup / Dimension Tables

| Table        | Description                                       | Rows  |
| ------------ | ------------------------------------------------- | ----- |
| `brands`     | Product manufacturers / labels                    | 49    |
| `categories` | Product type (furniture, wall-art, decor, lights)  | 4     |
| `spaces`     | Room/space for design-space products               | 9     |
| `styles`     | Design style for design-style products             | 10    |
| `rooms`      | Generic room label used across spaces & styles     | 13    |
| `colors`     | Reusable color palette                             | 61    |
| `materials`  | Product material catalog                           | 46    |

#### Core Tables

| Table             | Description                              | Rows  |
| ----------------- | ---------------------------------------- | ----- |
| `products`        | Main product catalog                     | 49    |
| `product_colors`  | M:N junction — product ↔ color           | ~110  |
| `product_images`  | Product image URLs (one-to-many)         | 49    |

### Product Listing Types

Products are categorized into **three listing types** via the `product_listing_type` ENUM:

| Type            | Source JSON                   | Products | Key FK          |
| --------------- | ----------------------------- | -------- | --------------- |
| `category`      | `category-products.json`      | 12       | `category_id`   |
| `design-space`  | `design-space-products.json`  | 17       | `space_id`      |
| `design-style`  | `design-style-products.json`  | 20       | `style_id`      |

---

## 🔧 Design Decisions & Optimizations

### 1. Normalized Schema
- **Lookup tables** for brands, categories, spaces, styles, rooms, colors, and materials prevent data duplication and enable efficient filtering.
- **Junction table** (`product_colors`) for the M:N product ↔ color relationship.

### 2. Price as Integer Cents
- `price_cents INTEGER` (e.g., `$899` → `89900`) avoids floating-point precision issues. Divide by 100 at the application layer.

### 3. Indexing Strategy
- **Partial indexes** on nullable FKs (`category_id`, `space_id`, `style_id`) — only indexes rows where the column is populated.
- **Composite indexes** for common frontend queries: `(category_id, popularity DESC)`, `(space_id, popularity DESC)`, `(style_id, popularity DESC)`.
- **GIN trigram index** on `products.name` for fast `ILIKE '%search%'` queries.
- **Descending indexes** on `rating`, `popularity`, and `created_at` for sort-heavy queries.

### 4. Referential Integrity
- `ON DELETE RESTRICT` for brands (prevent orphan products).
- `ON DELETE SET NULL` for optional dimensions (category, space, style, room, material).
- `ON DELETE CASCADE` for images and colors (they don't exist without a product).

### 5. Auto-Updated Timestamps
- A `BEFORE UPDATE` trigger on `products` automatically refreshes `updated_at`.

### 6. CHECK Constraints
- `price_cents >= 0` — no negative prices.
- `rating` between 0 and 5 (with one decimal place via `NUMERIC(2,1)`).
- `popularity` between 0 and 100.
- `review_count >= 0`.

---

## 📊 Common Queries

### Get all products in a category, sorted by popularity
```sql
SELECT p.*, b.name AS brand_name
FROM products p
JOIN brands b ON b.id = p.brand_id
WHERE p.category_id = (SELECT id FROM categories WHERE slug = 'furniture')
ORDER BY p.popularity DESC;
```

### Get product with all its colors and primary image
```sql
SELECT p.name, p.price_cents, b.name AS brand,
       array_agg(DISTINCT c.name) AS colors,
       pi.src AS image_url
FROM products p
JOIN brands b ON b.id = p.brand_id
LEFT JOIN product_colors pc ON pc.product_id = p.id
LEFT JOIN colors c ON c.id = pc.color_id
LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
WHERE p.slug = 'velvet-accent-chair'
GROUP BY p.id, p.name, p.price_cents, b.name, pi.src;
```

### Search products by name
```sql
SELECT id, name, price_cents
FROM products
WHERE name ILIKE '%table%'
ORDER BY popularity DESC
LIMIT 20;
```

### Get products by design style with room info
```sql
SELECT p.name, p.price_cents, s.name AS style, r.name AS room
FROM products p
JOIN styles s ON s.id = p.style_id
LEFT JOIN rooms r ON r.id = p.room_id
WHERE p.listing_type = 'design-style'
ORDER BY p.popularity DESC;
```

---

## 📝 Notes

- **Extensions required**: `pgcrypto` (UUID support), `pg_trgm` (trigram search).
- All migrations are wrapped in `BEGIN; ... COMMIT;` for transactional safety.
- The `href` field stores the frontend route path (e.g., `./1`, `./201`).
- Product slugs are auto-derived from names during seed; ensure uniqueness in application logic for future inserts.
