-- Ensure auth schema helper exists for Neon Data API RLS policies
-- Some environments may not allow creating functions in auth schema.
-- Main policies below use current_setting(...) directly and do not depend on auth.user_id().
DO $$
BEGIN
  BEGIN
    EXECUTE 'CREATE SCHEMA IF NOT EXISTS auth';
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION auth.user_id()
      RETURNS uuid
      LANGUAGE sql
      STABLE
      AS $$
        SELECT NULLIF((current_setting(''request.jwt.claims'', true)::jsonb ->> ''sub''), '''')::uuid
      $$
    $fn$;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping auth.user_id() creation due to privileges';
  END;
END $$;

-- Ensure authenticated role can read order resources via Neon Data API
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON TABLE orders TO authenticated;
GRANT SELECT ON TABLE order_items TO authenticated;
GRANT SELECT ON TABLE payments TO authenticated;

-- Enable RLS where needed
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Orders read policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND policyname = 'users_can_read_own_orders'
  ) THEN
    CREATE POLICY users_can_read_own_orders
      ON orders
      FOR SELECT
      TO authenticated
      USING ((user_id)::text = ((current_setting('request.jwt.claims', true))::jsonb ->> 'sub'));
  END IF;
END $$;

-- Orders update policy (kept for status-safe updates if used from Data API)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND policyname = 'users_can_update_own_orders'
  ) THEN
    CREATE POLICY users_can_update_own_orders
      ON orders
      FOR UPDATE
      TO authenticated
      USING ((user_id)::text = ((current_setting('request.jwt.claims', true))::jsonb ->> 'sub'))
      WITH CHECK ((user_id)::text = ((current_setting('request.jwt.claims', true))::jsonb ->> 'sub') AND status IN ('placed', 'paid', 'processing'));
  END IF;
END $$;

-- Order items read policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'order_items'
      AND policyname = 'users_can_read_own_order_items'
  ) THEN
    CREATE POLICY users_can_read_own_order_items
      ON order_items
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM orders o
          WHERE o.id = order_items.order_id
            AND (o.user_id)::text = ((current_setting('request.jwt.claims', true))::jsonb ->> 'sub')
        )
      );
  END IF;
END $$;

-- Payments read policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payments'
      AND policyname = 'users_can_read_own_payments'
  ) THEN
    CREATE POLICY users_can_read_own_payments
      ON payments
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM orders o
          WHERE o.id = payments.order_id
            AND (o.user_id)::text = ((current_setting('request.jwt.claims', true))::jsonb ->> 'sub')
        )
      );
  END IF;
END $$;
