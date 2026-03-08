# Spacefurnio Documentation

## Quick Links

| Document | Description |
|----------|-------------|
| [01-Neon-Data-API](01-NEON-DATA-API.md) | Neon Data API usage for carts, wishlists, orders |

## Architecture Overview

### Frontend (`/frontend`)
- Vue 3 + Vite + Pinia
- Uses Neon Data API for user data (carts, wishlist)
- Uses Neon serverless driver for products (catalog DB)

### Backend (`/backend/ecommerce-backend`)
- Cloudflare Workers
- Drizzle ORM for database migrations
- Custom RS256 JWT authentication

### Database
- **Main DB** (`proud-shadow-42759289`): Users, carts, wishlists, orders
- **Catalog DB** (`icy-union-81751721`): Products, categories, brands

## Common Tasks

### Adding a New Table
1. Create table in Drizzle schema
2. Run migration
3. Add RLS policy using `auth.user_id()`
4. Grant permissions to `authenticated` role
5. Update frontend API client

### Updating RLS Policies
```sql
-- Always use auth.user_id() for user-based filtering
CREATE POLICY "policy_name" ON table_name
FOR ALL TO authenticated
USING (user_id = auth.user_id())
WITH CHECK (user_id = auth.user_id());
```

### Testing Data API
```bash
TOKEN="your-jwt-token"
curl -X GET 'https://ep-ancient-frog-aimehta7.apirest.c-4.us-east-1.aws.neon.tech/neondb/rest/v1/carts' \
  -H 'neon-connection-string: postgresql://authenticator@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require' \
  -H "Authorization: Bearer $TOKEN"
```