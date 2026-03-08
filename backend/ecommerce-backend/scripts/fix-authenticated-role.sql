-- =====================================================
-- FIX: Grant permissions to 'authenticated' role
-- =====================================================
-- The backend now issues JWTs with role: "authenticated"
-- instead of role: "customer" (which didn't exist as a DB role).
--
-- This script ensures the 'authenticated' role has proper
-- permissions on all shopping-related tables.
-- =====================================================

-- 1. Ensure the 'authenticated' role exists and authenticator can switch to it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
END $$;

GRANT authenticated TO authenticator;

-- 2. Grant schema access
GRANT USAGE ON SCHEMA public TO authenticated;

-- 3. Grant table permissions for shopping tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE carts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE cart_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE wishlists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE wishlist_items TO authenticated;
GRANT SELECT ON TABLE orders TO authenticated;
GRANT SELECT ON TABLE order_items TO authenticated;
GRANT SELECT ON TABLE payments TO authenticated;
GRANT SELECT ON TABLE user_addresses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_addresses TO authenticated;

-- 4. Grant sequence usage (needed for any serial/auto-increment columns)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 5. Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO authenticated;

-- 6. Ensure RLS policies exist for wishlists (if RLS is enabled)
-- Check if RLS is enabled on wishlists
DO $$
BEGIN
    -- Enable RLS on wishlists if not already
    ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
    ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

    -- Create policy for wishlists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'wishlists' AND policyname = 'Users can manage own wishlists'
    ) THEN
        CREATE POLICY "Users can manage own wishlists"
        ON wishlists FOR ALL USING (
            (user_id)::text = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
        );
    END IF;

    -- Create policy for wishlist_items
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'wishlist_items' AND policyname = 'Users can manage own wishlist items'
    ) THEN
        CREATE POLICY "Users can manage own wishlist items"
        ON wishlist_items FOR ALL USING (
            wishlist_id IN (
                SELECT id FROM wishlists
                WHERE user_id::text = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
            )
        );
    END IF;
END $$;

-- 7. Verify setup
SELECT rolname FROM pg_roles WHERE rolname IN ('authenticated', 'admin', 'authenticator') ORDER BY rolname;
