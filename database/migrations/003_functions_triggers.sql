-- ============================================
-- SPACEFURNIO DATABASE FUNCTIONS & TRIGGERS
-- Migration: 003_functions_triggers.sql
-- Description: Utility functions, triggers, and stored procedures
-- ============================================

-- ============================================
-- SESSION CONTEXT FUNCTIONS
-- Used by backend to set user context for RLS
-- ============================================

-- Set current user for RLS policies
CREATE OR REPLACE FUNCTION set_current_user(user_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id::TEXT, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set current session for guest cart access
CREATE OR REPLACE FUNCTION set_current_session(session_id VARCHAR)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.session_id', session_id, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clear user context
CREATE OR REPLACE FUNCTION clear_user_context()
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', '', TRUE);
    PERFORM set_config('app.session_id', '', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- Auto-update timestamp on row changes
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_carts_updated_at
    BEFORE UPDATE ON carts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_wishlists_updated_at
    BEFORE UPDATE ON wishlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_addresses_updated_at
    BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ORDER NUMBER GENERATION
-- ============================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR AS $$
DECLARE
    order_num VARCHAR(50);
    counter INTEGER;
BEGIN
    -- Format: SF-YYYYMMDD-XXXX (e.g., SF-20250615-0042)
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(order_number FROM 13) AS INTEGER)
    ), 0) + 1
    INTO counter
    FROM orders
    WHERE order_number LIKE 'SF-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%';
    
    order_num := 'SF-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CART TOTAL CALCULATION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_cart_totals(p_cart_id UUID)
RETURNS VOID AS $$
DECLARE
    v_subtotal DECIMAL(12, 2);
    v_discount DECIMAL(12, 2) := 0;
    v_tax DECIMAL(12, 2) := 0;
    v_coupon_code VARCHAR(50);
    v_coupon_discount DECIMAL(12, 2) := 0;
BEGIN
    -- Calculate subtotal
    SELECT COALESCE(SUM(total_price), 0)
    INTO v_subtotal
    FROM cart_items
    WHERE cart_id = p_cart_id;
    
    -- Get coupon code
    SELECT coupon_code INTO v_coupon_code
    FROM carts WHERE id = p_cart_id;
    
    -- Calculate coupon discount if applicable
    IF v_coupon_code IS NOT NULL THEN
        SELECT 
            CASE 
                WHEN c.discount_type = 'percentage' THEN
                    LEAST(
                        v_subtotal * (c.discount_value / 100),
                        COALESCE(c.maximum_discount, v_subtotal)
                    )
                WHEN c.discount_type = 'fixed_amount' THEN
                    LEAST(c.discount_value, v_subtotal)
                ELSE 0
            END
        INTO v_coupon_discount
        FROM coupons c
        WHERE c.code = v_coupon_code
            AND c.is_active = TRUE
            AND c.starts_at <= NOW()
            AND (c.expires_at IS NULL OR c.expires_at > NOW())
            AND (c.minimum_amount IS NULL OR v_subtotal >= c.minimum_amount);
        
        v_coupon_discount := COALESCE(v_coupon_discount, 0);
    END IF;
    
    v_discount := v_coupon_discount;
    
    -- Calculate tax (18% GST) - can be customized
    v_tax := (v_subtotal - v_discount) * 0.18;
    
    -- Update cart
    UPDATE carts
    SET 
        subtotal = v_subtotal,
        discount_total = v_discount,
        tax_total = v_tax,
        total = v_subtotal - v_discount + v_tax,
        updated_at = NOW()
    WHERE id = p_cart_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate cart on item changes
CREATE OR REPLACE FUNCTION recalculate_cart_on_item_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_cart_totals(OLD.cart_id);
        RETURN OLD;
    ELSE
        PERFORM calculate_cart_totals(NEW.cart_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cart_item_insert
    AFTER INSERT ON cart_items
    FOR EACH ROW EXECUTE FUNCTION recalculate_cart_on_item_change();

CREATE TRIGGER trigger_cart_item_update
    AFTER UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION recalculate_cart_on_item_change();

CREATE TRIGGER trigger_cart_item_delete
    AFTER DELETE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION recalculate_cart_on_item_change();

-- ============================================
-- REVIEW RATING UPDATE
-- Update product rating when reviews change
-- ============================================

CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_product_id UUID;
    v_avg DECIMAL(3, 2);
    v_count INTEGER;
    v_review_count INTEGER;
BEGIN
    -- Get the product_id
    IF TG_OP = 'DELETE' THEN
        v_product_id := OLD.product_id;
    ELSE
        v_product_id := NEW.product_id;
    END IF;
    
    -- Calculate new rating stats (only approved reviews)
    SELECT 
        COALESCE(AVG(rating), 0),
        COUNT(*),
        COUNT(*)
    INTO v_avg, v_count, v_review_count
    FROM reviews
    WHERE product_id = v_product_id AND status = 'approved';
    
    -- Update product
    UPDATE products
    SET 
        rating_average = v_avg,
        rating_count = v_count,
        review_count = v_review_count
    WHERE id = v_product_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_review_insert
    AFTER INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_rating();

CREATE TRIGGER trigger_review_update
    AFTER UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_rating();

CREATE TRIGGER trigger_review_delete
    AFTER DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- ============================================
-- REVIEW HELPFUL COUNT UPDATE
-- ============================================

CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
DECLARE
    v_review_id UUID;
    v_helpful INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_review_id := OLD.review_id;
    ELSE
        v_review_id := NEW.review_id;
    END IF;
    
    SELECT COUNT(*) INTO v_helpful
    FROM review_votes
    WHERE review_id = v_review_id AND is_helpful = TRUE;
    
    UPDATE reviews
    SET helpful_count = v_helpful
    WHERE id = v_review_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_review_vote_change
    AFTER INSERT OR UPDATE OR DELETE ON review_votes
    FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

-- ============================================
-- COUPON USAGE UPDATE
-- ============================================

CREATE OR REPLACE FUNCTION update_coupon_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE coupons
    SET usage_count = (
        SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = NEW.coupon_id
    )
    WHERE id = NEW.coupon_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_coupon_usage_insert
    AFTER INSERT ON coupon_usage
    FOR EACH ROW EXECUTE FUNCTION update_coupon_usage_count();

-- ============================================
-- MERGE GUEST CART TO USER CART
-- Called when user logs in
-- ============================================

CREATE OR REPLACE FUNCTION merge_carts(p_user_id UUID, p_session_id VARCHAR)
RETURNS UUID AS $$
DECLARE
    v_user_cart_id UUID;
    v_guest_cart_id UUID;
BEGIN
    -- Find user's existing cart
    SELECT id INTO v_user_cart_id
    FROM carts
    WHERE user_id = p_user_id AND status = 'active'
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- Find guest cart
    SELECT id INTO v_guest_cart_id
    FROM carts
    WHERE session_id = p_session_id AND user_id IS NULL AND status = 'active'
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- If no guest cart, just return user cart
    IF v_guest_cart_id IS NULL THEN
        -- Create user cart if doesn't exist
        IF v_user_cart_id IS NULL THEN
            INSERT INTO carts (user_id, status)
            VALUES (p_user_id, 'active')
            RETURNING id INTO v_user_cart_id;
        END IF;
        RETURN v_user_cart_id;
    END IF;
    
    -- If no user cart, convert guest cart to user cart
    IF v_user_cart_id IS NULL THEN
        UPDATE carts
        SET user_id = p_user_id, session_id = NULL
        WHERE id = v_guest_cart_id;
        RETURN v_guest_cart_id;
    END IF;
    
    -- Merge: move items from guest cart to user cart
    -- Update existing items, insert new ones
    WITH guest_items AS (
        SELECT * FROM cart_items WHERE cart_id = v_guest_cart_id
    )
    INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, unit_price, total_price, selected_color, selected_options)
    SELECT 
        v_user_cart_id, 
        gi.product_id, 
        gi.variant_id, 
        gi.quantity, 
        gi.unit_price, 
        gi.total_price,
        gi.selected_color,
        gi.selected_options
    FROM guest_items gi
    ON CONFLICT (cart_id, product_id, variant_id, selected_color) 
    DO UPDATE SET 
        quantity = cart_items.quantity + EXCLUDED.quantity,
        total_price = (cart_items.quantity + EXCLUDED.quantity) * cart_items.unit_price,
        updated_at = NOW();
    
    -- Mark guest cart as converted
    UPDATE carts
    SET status = 'converted'
    WHERE id = v_guest_cart_id;
    
    -- Recalculate totals
    PERFORM calculate_cart_totals(v_user_cart_id);
    
    RETURN v_user_cart_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PRODUCT SEARCH FUNCTION
-- Full-text search with filters
-- ============================================

CREATE OR REPLACE FUNCTION search_products(
    p_query TEXT DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_min_price DECIMAL DEFAULT NULL,
    p_max_price DECIMAL DEFAULT NULL,
    p_room VARCHAR DEFAULT NULL,
    p_style VARCHAR DEFAULT NULL,
    p_brand VARCHAR DEFAULT NULL,
    p_sort_by VARCHAR DEFAULT 'created_at',
    p_sort_order VARCHAR DEFAULT 'DESC',
    p_page INTEGER DEFAULT 1,
    p_per_page INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    slug VARCHAR,
    description TEXT,
    short_description VARCHAR,
    price DECIMAL,
    compare_at_price DECIMAL,
    images JSONB,
    category_id UUID,
    category_name VARCHAR,
    brand VARCHAR,
    rating_average DECIMAL,
    rating_count INTEGER,
    total_count BIGINT
) AS $$
DECLARE
    v_offset INTEGER;
    v_total BIGINT;
BEGIN
    v_offset := (p_page - 1) * p_per_page;
    
    -- Get total count
    SELECT COUNT(*) INTO v_total
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'active'
        AND (p_query IS NULL OR to_tsvector('english', 
            COALESCE(p.name, '') || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.brand, '')
        ) @@ plainto_tsquery('english', p_query))
        AND (p_category_id IS NULL OR p.category_id = p_category_id)
        AND (p_min_price IS NULL OR p.price >= p_min_price)
        AND (p_max_price IS NULL OR p.price <= p_max_price)
        AND (p_room IS NULL OR p.room = p_room)
        AND (p_style IS NULL OR p.style = p_style)
        AND (p_brand IS NULL OR p.brand = p_brand);
    
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.short_description,
        p.price,
        p.compare_at_price,
        p.images,
        p.category_id,
        c.name AS category_name,
        p.brand,
        p.rating_average,
        p.rating_count,
        v_total AS total_count
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'active'
        AND (p_query IS NULL OR to_tsvector('english', 
            COALESCE(p.name, '') || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.brand, '')
        ) @@ plainto_tsquery('english', p_query))
        AND (p_category_id IS NULL OR p.category_id = p_category_id)
        AND (p_min_price IS NULL OR p.price >= p_min_price)
        AND (p_max_price IS NULL OR p.price <= p_max_price)
        AND (p_room IS NULL OR p.room = p_room)
        AND (p_style IS NULL OR p.style = p_style)
        AND (p_brand IS NULL OR p.brand = p_brand)
    ORDER BY
        CASE WHEN p_sort_by = 'price' AND p_sort_order = 'ASC' THEN p.price END ASC,
        CASE WHEN p_sort_by = 'price' AND p_sort_order = 'DESC' THEN p.price END DESC,
        CASE WHEN p_sort_by = 'rating' AND p_sort_order = 'DESC' THEN p.rating_average END DESC,
        CASE WHEN p_sort_by = 'name' AND p_sort_order = 'ASC' THEN p.name END ASC,
        CASE WHEN p_sort_by = 'name' AND p_sort_order = 'DESC' THEN p.name END DESC,
        CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'DESC' THEN p.created_at END DESC,
        CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'ASC' THEN p.created_at END ASC
    LIMIT p_per_page
    OFFSET v_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- GET PRODUCT WITH FULL DETAILS
-- ============================================

CREATE OR REPLACE FUNCTION get_product_details(p_slug VARCHAR)
RETURNS TABLE (
    product JSONB,
    variants JSONB,
    reviews JSONB,
    related_products JSONB
) AS $$
DECLARE
    v_product_id UUID;
    v_category_id UUID;
BEGIN
    -- Get product ID
    SELECT id, category_id INTO v_product_id, v_category_id
    FROM products
    WHERE slug = p_slug AND status = 'active';
    
    IF v_product_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT
        -- Product
        (SELECT to_jsonb(p.*) FROM products p WHERE p.id = v_product_id) AS product,
        
        -- Variants
        (SELECT COALESCE(jsonb_agg(v.*), '[]'::jsonb)
         FROM product_variants v
         WHERE v.product_id = v_product_id AND v.is_active = TRUE) AS variants,
        
        -- Reviews (top 5)
        (SELECT COALESCE(jsonb_agg(r.* ORDER BY r.helpful_count DESC, r.created_at DESC), '[]'::jsonb)
         FROM (
             SELECT rev.*, u.name AS user_name, u.avatar_url
             FROM reviews rev
             JOIN users u ON rev.user_id = u.id
             WHERE rev.product_id = v_product_id AND rev.status = 'approved'
             LIMIT 5
         ) r) AS reviews,
        
        -- Related products (same category)
        (SELECT COALESCE(jsonb_agg(rp.*), '[]'::jsonb)
         FROM (
             SELECT p.id, p.name, p.slug, p.price, p.compare_at_price, 
                    p.images, p.rating_average
             FROM products p
             WHERE p.category_id = v_category_id 
               AND p.id != v_product_id 
               AND p.status = 'active'
             ORDER BY p.rating_average DESC
             LIMIT 4
         ) rp) AS related_products;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- CLEANUP FUNCTIONS
-- Used by cron jobs
-- ============================================

-- Cleanup expired magic links
CREATE OR REPLACE FUNCTION cleanup_expired_magic_links()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM magic_links
    WHERE expires_at < NOW() OR used_at IS NOT NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Mark abandoned carts (inactive for 30 days)
CREATE OR REPLACE FUNCTION mark_abandoned_carts()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE carts
    SET status = 'abandoned'
    WHERE status = 'active'
      AND updated_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup old abandoned carts (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_carts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM carts
    WHERE status = 'abandoned'
      AND updated_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INVENTORY MANAGEMENT
-- ============================================

-- Reserve inventory when order is placed
CREATE OR REPLACE FUNCTION reserve_inventory(p_order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    item RECORD;
BEGIN
    FOR item IN
        SELECT product_id, variant_id, quantity
        FROM order_items
        WHERE order_id = p_order_id
    LOOP
        IF item.variant_id IS NOT NULL THEN
            UPDATE product_variants
            SET quantity = quantity - item.quantity
            WHERE id = item.variant_id
              AND quantity >= item.quantity;
            
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Insufficient inventory for variant %', item.variant_id;
            END IF;
        ELSE
            UPDATE products
            SET quantity = quantity - item.quantity
            WHERE id = item.product_id
              AND quantity >= item.quantity;
            
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Insufficient inventory for product %', item.product_id;
            END IF;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Release inventory when order is cancelled
CREATE OR REPLACE FUNCTION release_inventory(p_order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    item RECORD;
BEGIN
    FOR item IN
        SELECT product_id, variant_id, quantity
        FROM order_items
        WHERE order_id = p_order_id
    LOOP
        IF item.variant_id IS NOT NULL THEN
            UPDATE product_variants
            SET quantity = quantity + item.quantity
            WHERE id = item.variant_id;
        ELSE
            UPDATE products
            SET quantity = quantity + item.quantity
            WHERE id = item.product_id;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ANALYTICS HELPERS
-- ============================================

-- Get dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    total_orders BIGINT,
    total_revenue DECIMAL,
    new_customers BIGINT,
    average_order_value DECIMAL,
    orders_by_status JSONB,
    revenue_by_day JSONB,
    top_products JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM orders WHERE created_at > NOW() - (p_days || ' days')::INTERVAL),
        (SELECT COALESCE(SUM(total), 0) FROM orders 
         WHERE created_at > NOW() - (p_days || ' days')::INTERVAL 
         AND payment_status = 'paid'),
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - (p_days || ' days')::INTERVAL),
        (SELECT COALESCE(AVG(total), 0) FROM orders 
         WHERE created_at > NOW() - (p_days || ' days')::INTERVAL 
         AND payment_status = 'paid'),
        (SELECT jsonb_object_agg(status, cnt)
         FROM (
             SELECT status, COUNT(*) as cnt
             FROM orders
             WHERE created_at > NOW() - (p_days || ' days')::INTERVAL
             GROUP BY status
         ) s),
        (SELECT jsonb_agg(jsonb_build_object('date', date, 'revenue', revenue))
         FROM (
             SELECT DATE(created_at) as date, SUM(total) as revenue
             FROM orders
             WHERE created_at > NOW() - (p_days || ' days')::INTERVAL
               AND payment_status = 'paid'
             GROUP BY DATE(created_at)
             ORDER BY date
         ) d),
        (SELECT jsonb_agg(jsonb_build_object(
             'product_id', product_id,
             'product_name', product_name,
             'quantity_sold', qty,
             'revenue', rev
         ))
         FROM (
             SELECT oi.product_id, oi.product_name, 
                    SUM(oi.quantity) as qty,
                    SUM(oi.total_price) as rev
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             WHERE o.created_at > NOW() - (p_days || ' days')::INTERVAL
               AND o.payment_status = 'paid'
             GROUP BY oi.product_id, oi.product_name
             ORDER BY qty DESC
             LIMIT 10
         ) tp);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- VALIDATE COUPON
-- ============================================

CREATE OR REPLACE FUNCTION validate_coupon(
    p_code VARCHAR,
    p_user_id UUID DEFAULT NULL,
    p_cart_total DECIMAL DEFAULT 0
)
RETURNS TABLE (
    is_valid BOOLEAN,
    coupon_id UUID,
    discount_type VARCHAR,
    discount_value DECIMAL,
    calculated_discount DECIMAL,
    error_message TEXT
) AS $$
DECLARE
    v_coupon RECORD;
    v_user_usage INTEGER;
BEGIN
    -- Find coupon
    SELECT * INTO v_coupon
    FROM coupons
    WHERE code = UPPER(p_code);
    
    IF v_coupon IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, NULL::DECIMAL, 
                            NULL::DECIMAL, 'Coupon not found'::TEXT;
        RETURN;
    END IF;
    
    -- Check if active
    IF NOT v_coupon.is_active THEN
        RETURN QUERY SELECT FALSE, v_coupon.id, v_coupon.discount_type, v_coupon.discount_value,
                            NULL::DECIMAL, 'Coupon is not active'::TEXT;
        RETURN;
    END IF;
    
    -- Check dates
    IF v_coupon.starts_at > NOW() THEN
        RETURN QUERY SELECT FALSE, v_coupon.id, v_coupon.discount_type, v_coupon.discount_value,
                            NULL::DECIMAL, 'Coupon is not yet valid'::TEXT;
        RETURN;
    END IF;
    
    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
        RETURN QUERY SELECT FALSE, v_coupon.id, v_coupon.discount_type, v_coupon.discount_value,
                            NULL::DECIMAL, 'Coupon has expired'::TEXT;
        RETURN;
    END IF;
    
    -- Check usage limit
    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
        RETURN QUERY SELECT FALSE, v_coupon.id, v_coupon.discount_type, v_coupon.discount_value,
                            NULL::DECIMAL, 'Coupon usage limit reached'::TEXT;
        RETURN;
    END IF;
    
    -- Check minimum amount
    IF v_coupon.minimum_amount IS NOT NULL AND p_cart_total < v_coupon.minimum_amount THEN
        RETURN QUERY SELECT FALSE, v_coupon.id, v_coupon.discount_type, v_coupon.discount_value,
                            NULL::DECIMAL, 
                            ('Minimum order amount is ₹' || v_coupon.minimum_amount)::TEXT;
        RETURN;
    END IF;
    
    -- Check per-user limit
    IF p_user_id IS NOT NULL AND v_coupon.usage_limit_per_user IS NOT NULL THEN
        SELECT COUNT(*) INTO v_user_usage
        FROM coupon_usage
        WHERE coupon_id = v_coupon.id AND user_id = p_user_id;
        
        IF v_user_usage >= v_coupon.usage_limit_per_user THEN
            RETURN QUERY SELECT FALSE, v_coupon.id, v_coupon.discount_type, v_coupon.discount_value,
                                NULL::DECIMAL, 'You have already used this coupon'::TEXT;
            RETURN;
        END IF;
    END IF;
    
    -- Calculate discount
    RETURN QUERY
    SELECT 
        TRUE,
        v_coupon.id,
        v_coupon.discount_type,
        v_coupon.discount_value,
        CASE 
            WHEN v_coupon.discount_type = 'percentage' THEN
                LEAST(
                    p_cart_total * (v_coupon.discount_value / 100),
                    COALESCE(v_coupon.maximum_discount, p_cart_total)
                )
            WHEN v_coupon.discount_type = 'fixed_amount' THEN
                LEAST(v_coupon.discount_value, p_cart_total)
            ELSE 0
        END,
        NULL::TEXT;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- ACTIVITY LOGGING HELPER
-- ============================================

CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_action VARCHAR,
    p_entity_type VARCHAR DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO activity_logs (
        user_id, action, entity_type, entity_id,
        old_values, new_values, ip_address, user_agent
    ) VALUES (
        p_user_id, p_action, p_entity_type, p_entity_id,
        p_old_values, p_new_values, p_ip_address, p_user_agent
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CREATE DEFAULT WISHLIST FOR NEW USERS
-- ============================================

CREATE OR REPLACE FUNCTION create_default_wishlist()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wishlists (user_id, name, is_default)
    VALUES (NEW.id, 'My Wishlist', TRUE);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_wishlist
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_default_wishlist();
