-- Add shipping fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_first_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_last_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_pincode text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone text;

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own orders
CREATE POLICY "users_can_read_own_orders" ON orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.user_id());

-- Policy: Users can update their own orders only when status is 'placed' or 'processing'
CREATE POLICY "users_can_update_own_orders" ON orders
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.user_id())
  WITH CHECK (user_id = auth.user_id() AND status IN ('placed', 'processing'));
