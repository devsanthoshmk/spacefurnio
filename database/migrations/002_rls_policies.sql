-- ============================================
-- SPACEFURNIO ROW-LEVEL SECURITY POLICIES
-- Migration: 002_rls_policies.sql
-- Description: Implements RLS for secure multi-tenant access
-- ============================================

-- ============================================
-- CREATE DATABASE ROLES
-- ============================================

-- Anonymous role for unauthenticated requests
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
END
$$;

-- Authenticated role for logged-in users
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
END
$$;

-- Service role for backend operations (bypasses RLS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN BYPASSRLS;
    END IF;
END
$$;

-- ============================================
-- GRANT BASE PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Anonymous can read public data
GRANT SELECT ON products, categories, product_variants, reviews TO anon;

-- Authenticated can do more
GRANT SELECT, INSERT, UPDATE, DELETE ON 
    users, sessions, carts, cart_items, wishlists, wishlist_items,
    addresses, orders, order_items, reviews, review_votes
TO authenticated;

GRANT SELECT ON 
    products, categories, product_variants, coupons
TO authenticated;

-- Service role has full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Function to get current user ID from session variable
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_is_admin BOOLEAN;
BEGIN
    SELECT is_admin INTO user_is_admin
    FROM users
    WHERE id = current_user_id();
    
    RETURN COALESCE(user_is_admin, FALSE);
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get current cart session ID
CREATE OR REPLACE FUNCTION current_session_id()
RETURNS VARCHAR AS $$
BEGIN
    RETURN NULLIF(current_setting('app.session_id', TRUE), '');
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY users_select_own ON users
    FOR SELECT TO authenticated
    USING (id = current_user_id());

-- Users can update their own profile
CREATE POLICY users_update_own ON users
    FOR UPDATE TO authenticated
    USING (id = current_user_id())
    WITH CHECK (id = current_user_id());

-- Admin can read all users
CREATE POLICY users_admin_select ON users
    FOR SELECT TO authenticated
    USING (is_admin());

-- Admin can update all users
CREATE POLICY users_admin_update ON users
    FOR UPDATE TO authenticated
    USING (is_admin());

-- ============================================
-- MAGIC LINKS POLICIES (service role only)
-- ============================================

-- No direct access to magic_links for regular users
-- All operations go through service_role

-- ============================================
-- SESSIONS POLICIES
-- ============================================

-- Users can only see their own sessions
CREATE POLICY sessions_select_own ON sessions
    FOR SELECT TO authenticated
    USING (user_id = current_user_id());

-- Users can delete their own sessions (logout)
CREATE POLICY sessions_delete_own ON sessions
    FOR DELETE TO authenticated
    USING (user_id = current_user_id());

-- ============================================
-- ADMIN ACCESS POLICIES (service role only)
-- ============================================

-- Admin access managed only through service_role

-- ============================================
-- CATEGORIES POLICIES
-- ============================================

-- Everyone can read active categories
CREATE POLICY categories_select_public ON categories
    FOR SELECT TO anon, authenticated
    USING (is_active = TRUE);

-- Admin can read all categories
CREATE POLICY categories_admin_select ON categories
    FOR SELECT TO authenticated
    USING (is_admin());

-- Admin can manage categories
CREATE POLICY categories_admin_all ON categories
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================
-- PRODUCTS POLICIES
-- ============================================

-- Everyone can read active products
CREATE POLICY products_select_public ON products
    FOR SELECT TO anon, authenticated
    USING (status = 'active');

-- Admin can read all products
CREATE POLICY products_admin_select ON products
    FOR SELECT TO authenticated
    USING (is_admin());

-- Admin can manage products
CREATE POLICY products_admin_all ON products
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================
-- PRODUCT VARIANTS POLICIES
-- ============================================

-- Everyone can read active variants of active products
CREATE POLICY variants_select_public ON product_variants
    FOR SELECT TO anon, authenticated
    USING (
        is_active = TRUE AND
        EXISTS (SELECT 1 FROM products WHERE id = product_id AND status = 'active')
    );

-- Admin can manage variants
CREATE POLICY variants_admin_all ON product_variants
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================
-- CARTS POLICIES
-- ============================================

-- Users can access their own cart (by user_id or session_id)
CREATE POLICY carts_select_own ON carts
    FOR SELECT TO authenticated
    USING (
        user_id = current_user_id() OR
        session_id = current_session_id()
    );

-- Anonymous can access carts by session
CREATE POLICY carts_select_anon ON carts
    FOR SELECT TO anon
    USING (session_id = current_session_id() AND user_id IS NULL);

-- Users can create carts
CREATE POLICY carts_insert_own ON carts
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = current_user_id() OR
        (user_id IS NULL AND session_id = current_session_id())
    );

-- Anonymous can create guest carts
CREATE POLICY carts_insert_anon ON carts
    FOR INSERT TO anon
    WITH CHECK (user_id IS NULL AND session_id = current_session_id());

-- Users can update their own cart
CREATE POLICY carts_update_own ON carts
    FOR UPDATE TO authenticated
    USING (
        user_id = current_user_id() OR
        session_id = current_session_id()
    );

-- Anonymous can update guest carts
CREATE POLICY carts_update_anon ON carts
    FOR UPDATE TO anon
    USING (session_id = current_session_id() AND user_id IS NULL);

-- Users can delete their own cart
CREATE POLICY carts_delete_own ON carts
    FOR DELETE TO authenticated
    USING (user_id = current_user_id());

-- ============================================
-- CART ITEMS POLICIES
-- ============================================

-- Access cart items through cart ownership
CREATE POLICY cart_items_select_own ON cart_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM carts
            WHERE id = cart_id
            AND (user_id = current_user_id() OR session_id = current_session_id())
        )
    );

CREATE POLICY cart_items_select_anon ON cart_items
    FOR SELECT TO anon
    USING (
        EXISTS (
            SELECT 1 FROM carts
            WHERE id = cart_id
            AND session_id = current_session_id()
            AND user_id IS NULL
        )
    );

CREATE POLICY cart_items_insert_own ON cart_items
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM carts
            WHERE id = cart_id
            AND (user_id = current_user_id() OR session_id = current_session_id())
        )
    );

CREATE POLICY cart_items_insert_anon ON cart_items
    FOR INSERT TO anon
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM carts
            WHERE id = cart_id
            AND session_id = current_session_id()
            AND user_id IS NULL
        )
    );

CREATE POLICY cart_items_update_own ON cart_items
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM carts
            WHERE id = cart_id
            AND (user_id = current_user_id() OR session_id = current_session_id())
        )
    );

CREATE POLICY cart_items_update_anon ON cart_items
    FOR UPDATE TO anon
    USING (
        EXISTS (
            SELECT 1 FROM carts
            WHERE id = cart_id
            AND session_id = current_session_id()
            AND user_id IS NULL
        )
    );

CREATE POLICY cart_items_delete_own ON cart_items
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM carts
            WHERE id = cart_id
            AND (user_id = current_user_id() OR session_id = current_session_id())
        )
    );

CREATE POLICY cart_items_delete_anon ON cart_items
    FOR DELETE TO anon
    USING (
        EXISTS (
            SELECT 1 FROM carts
            WHERE id = cart_id
            AND session_id = current_session_id()
            AND user_id IS NULL
        )
    );

-- ============================================
-- WISHLISTS POLICIES
-- ============================================

-- Users can manage their own wishlists
CREATE POLICY wishlists_select_own ON wishlists
    FOR SELECT TO authenticated
    USING (user_id = current_user_id());

CREATE POLICY wishlists_insert_own ON wishlists
    FOR INSERT TO authenticated
    WITH CHECK (user_id = current_user_id());

CREATE POLICY wishlists_update_own ON wishlists
    FOR UPDATE TO authenticated
    USING (user_id = current_user_id());

CREATE POLICY wishlists_delete_own ON wishlists
    FOR DELETE TO authenticated
    USING (user_id = current_user_id());

-- Anyone can view public wishlists
CREATE POLICY wishlists_select_public ON wishlists
    FOR SELECT TO anon, authenticated
    USING (is_public = TRUE);

-- ============================================
-- WISHLIST ITEMS POLICIES
-- ============================================

CREATE POLICY wishlist_items_select_own ON wishlist_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM wishlists
            WHERE id = wishlist_id AND user_id = current_user_id()
        )
    );

CREATE POLICY wishlist_items_insert_own ON wishlist_items
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM wishlists
            WHERE id = wishlist_id AND user_id = current_user_id()
        )
    );

CREATE POLICY wishlist_items_delete_own ON wishlist_items
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM wishlists
            WHERE id = wishlist_id AND user_id = current_user_id()
        )
    );

-- Anyone can view items in public wishlists
CREATE POLICY wishlist_items_select_public ON wishlist_items
    FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM wishlists
            WHERE id = wishlist_id AND is_public = TRUE
        )
    );

-- ============================================
-- ADDRESSES POLICIES
-- ============================================

CREATE POLICY addresses_select_own ON addresses
    FOR SELECT TO authenticated
    USING (user_id = current_user_id());

CREATE POLICY addresses_insert_own ON addresses
    FOR INSERT TO authenticated
    WITH CHECK (user_id = current_user_id());

CREATE POLICY addresses_update_own ON addresses
    FOR UPDATE TO authenticated
    USING (user_id = current_user_id());

CREATE POLICY addresses_delete_own ON addresses
    FOR DELETE TO authenticated
    USING (user_id = current_user_id());

-- ============================================
-- ORDERS POLICIES
-- ============================================

-- Users can view their own orders
CREATE POLICY orders_select_own ON orders
    FOR SELECT TO authenticated
    USING (user_id = current_user_id());

-- Admin can view all orders
CREATE POLICY orders_admin_select ON orders
    FOR SELECT TO authenticated
    USING (is_admin());

-- Admin can update orders
CREATE POLICY orders_admin_update ON orders
    FOR UPDATE TO authenticated
    USING (is_admin());

-- Orders are created through service_role only

-- ============================================
-- ORDER ITEMS POLICIES
-- ============================================

CREATE POLICY order_items_select_own ON order_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE id = order_id AND user_id = current_user_id()
        )
    );

CREATE POLICY order_items_admin_select ON order_items
    FOR SELECT TO authenticated
    USING (is_admin());

-- ============================================
-- REVIEWS POLICIES
-- ============================================

-- Everyone can read approved reviews
CREATE POLICY reviews_select_public ON reviews
    FOR SELECT TO anon, authenticated
    USING (status = 'approved');

-- Users can see their own reviews (any status)
CREATE POLICY reviews_select_own ON reviews
    FOR SELECT TO authenticated
    USING (user_id = current_user_id());

-- Users can create reviews
CREATE POLICY reviews_insert_own ON reviews
    FOR INSERT TO authenticated
    WITH CHECK (user_id = current_user_id());

-- Users can update their own pending reviews
CREATE POLICY reviews_update_own ON reviews
    FOR UPDATE TO authenticated
    USING (user_id = current_user_id() AND status = 'pending');

-- Users can delete their own reviews
CREATE POLICY reviews_delete_own ON reviews
    FOR DELETE TO authenticated
    USING (user_id = current_user_id());

-- Admin can manage all reviews
CREATE POLICY reviews_admin_all ON reviews
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================
-- REVIEW VOTES POLICIES
-- ============================================

CREATE POLICY review_votes_select_public ON review_votes
    FOR SELECT TO authenticated
    USING (TRUE);

CREATE POLICY review_votes_insert_own ON review_votes
    FOR INSERT TO authenticated
    WITH CHECK (user_id = current_user_id());

CREATE POLICY review_votes_update_own ON review_votes
    FOR UPDATE TO authenticated
    USING (user_id = current_user_id());

CREATE POLICY review_votes_delete_own ON review_votes
    FOR DELETE TO authenticated
    USING (user_id = current_user_id());

-- ============================================
-- COUPONS POLICIES
-- ============================================

-- Users can read active coupons (public ones)
CREATE POLICY coupons_select_public ON coupons
    FOR SELECT TO authenticated
    USING (
        is_active = TRUE AND
        starts_at <= NOW() AND
        (expires_at IS NULL OR expires_at > NOW())
    );

-- Admin can manage coupons
CREATE POLICY coupons_admin_all ON coupons
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================
-- COUPON USAGE POLICIES
-- ============================================

CREATE POLICY coupon_usage_select_own ON coupon_usage
    FOR SELECT TO authenticated
    USING (user_id = current_user_id());

-- Coupon usage tracked through service_role

-- ============================================
-- SITE SETTINGS POLICIES
-- ============================================

-- Read-only for authenticated users
CREATE POLICY site_settings_select_public ON site_settings
    FOR SELECT TO authenticated
    USING (TRUE);

-- Admin can manage settings
CREATE POLICY site_settings_admin_all ON site_settings
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================
-- ACTIVITY LOGS POLICIES
-- ============================================

-- Only admins can view activity logs
CREATE POLICY activity_logs_admin_select ON activity_logs
    FOR SELECT TO authenticated
    USING (is_admin());

-- Activity logs created through service_role
