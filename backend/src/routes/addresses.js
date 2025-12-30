/**
 * ===========================================
 * ADDRESS ROUTES
 * ===========================================
 * User address management
 */

import { Router, json, error } from 'itty-router';

const router = Router({ base: '/api/v1/addresses' });

// ===========================================
// GET ALL ADDRESSES
// ===========================================
router.get('/', async (request) => {
  const { db, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  try {
    const addresses = await db`
      SELECT * FROM addresses
      WHERE user_id = ${user.id}
      ORDER BY is_default DESC, created_at DESC
    `;

    return json({
      addresses: addresses.map(addr => ({
        id: addr.id,
        name: addr.name,
        phone: addr.phone,
        line1: addr.line1,
        line2: addr.line2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postal_code,
        country: addr.country,
        type: addr.type,
        isDefault: addr.is_default,
        createdAt: addr.created_at
      }))
    });

  } catch (err) {
    console.error('Get addresses error:', err);
    return error(500, { message: 'Failed to fetch addresses' });
  }
});

// ===========================================
// GET SINGLE ADDRESS
// ===========================================
router.get('/:addressId', async (request) => {
  const { db, params, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  try {
    const addresses = await db`
      SELECT * FROM addresses
      WHERE id = ${params.addressId}::uuid AND user_id = ${user.id}
    `;

    if (addresses.length === 0) {
      return error(404, { message: 'Address not found' });
    }

    const addr = addresses[0];

    return json({
      address: {
        id: addr.id,
        name: addr.name,
        phone: addr.phone,
        line1: addr.line1,
        line2: addr.line2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postal_code,
        country: addr.country,
        type: addr.type,
        isDefault: addr.is_default,
        createdAt: addr.created_at
      }
    });

  } catch (err) {
    console.error('Get address error:', err);
    return error(500, { message: 'Failed to fetch address' });
  }
});

// ===========================================
// CREATE ADDRESS
// ===========================================
router.post('/', async (request) => {
  const { db, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { name, phone, line1, line2, city, state, postalCode, country, type, isDefault } = body;

  // Validate required fields
  if (!name || !phone || !line1 || !city || !state || !postalCode) {
    return error(400, {
      message: 'Name, phone, address line 1, city, state, and postal code are required'
    });
  }

  // Validate phone format (Indian)
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
    return error(400, { message: 'Invalid phone number format' });
  }

  // Validate postal code (Indian)
  const postalRegex = /^\d{6}$/;
  if (!postalRegex.test(postalCode)) {
    return error(400, { message: 'Invalid postal code format' });
  }

  try {
    // If setting as default, unset other defaults first
    if (isDefault) {
      await db`
        UPDATE addresses SET is_default = false
        WHERE user_id = ${user.id}
      `;
    }

    // Check if this is the first address (auto-set as default)
    const existingAddresses = await db`
      SELECT COUNT(*) as count FROM addresses WHERE user_id = ${user.id}
    `;
    const shouldBeDefault = isDefault || parseInt(existingAddresses[0].count) === 0;

    const addresses = await db`
      INSERT INTO addresses (
        user_id, name, phone, line1, line2, city, state, postal_code, country, type, is_default
      ) VALUES (
        ${user.id},
        ${name},
        ${phone.replace(/\D/g, '')},
        ${line1},
        ${line2 || null},
        ${city},
        ${state},
        ${postalCode},
        ${country || 'India'},
        ${type || 'shipping'},
        ${shouldBeDefault}
      )
      RETURNING *
    `;

    const addr = addresses[0];

    return json({
      success: true,
      address: {
        id: addr.id,
        name: addr.name,
        phone: addr.phone,
        line1: addr.line1,
        line2: addr.line2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postal_code,
        country: addr.country,
        type: addr.type,
        isDefault: addr.is_default,
        createdAt: addr.created_at
      }
    });

  } catch (err) {
    console.error('Create address error:', err);
    return error(500, { message: 'Failed to create address' });
  }
});

// ===========================================
// UPDATE ADDRESS
// ===========================================
router.patch('/:addressId', async (request) => {
  const { db, params, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, { message: 'Invalid request body' });
  }

  const { name, phone, line1, line2, city, state, postalCode, country, type, isDefault } = body;

  try {
    // Check ownership
    const existing = await db`
      SELECT * FROM addresses
      WHERE id = ${params.addressId}::uuid AND user_id = ${user.id}
    `;

    if (existing.length === 0) {
      return error(404, { message: 'Address not found' });
    }

    // Validate phone if provided
    if (phone) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
        return error(400, { message: 'Invalid phone number format' });
      }
    }

    // Validate postal code if provided
    if (postalCode) {
      const postalRegex = /^\d{6}$/;
      if (!postalRegex.test(postalCode)) {
        return error(400, { message: 'Invalid postal code format' });
      }
    }

    // If setting as default, unset other defaults first
    if (isDefault) {
      await db`
        UPDATE addresses SET is_default = false
        WHERE user_id = ${user.id} AND id != ${params.addressId}::uuid
      `;
    }

    const addresses = await db`
      UPDATE addresses
      SET
        name = COALESCE(${name}, name),
        phone = COALESCE(${phone ? phone.replace(/\D/g, '') : null}, phone),
        line1 = COALESCE(${line1}, line1),
        line2 = COALESCE(${line2}, line2),
        city = COALESCE(${city}, city),
        state = COALESCE(${state}, state),
        postal_code = COALESCE(${postalCode}, postal_code),
        country = COALESCE(${country}, country),
        type = COALESCE(${type}, type),
        is_default = COALESCE(${isDefault}, is_default),
        updated_at = NOW()
      WHERE id = ${params.addressId}::uuid
      RETURNING *
    `;

    const addr = addresses[0];

    return json({
      success: true,
      address: {
        id: addr.id,
        name: addr.name,
        phone: addr.phone,
        line1: addr.line1,
        line2: addr.line2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postal_code,
        country: addr.country,
        type: addr.type,
        isDefault: addr.is_default,
        createdAt: addr.created_at
      }
    });

  } catch (err) {
    console.error('Update address error:', err);
    return error(500, { message: 'Failed to update address' });
  }
});

// ===========================================
// DELETE ADDRESS
// ===========================================
router.delete('/:addressId', async (request) => {
  const { db, params, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  try {
    // Check ownership
    const existing = await db`
      SELECT * FROM addresses
      WHERE id = ${params.addressId}::uuid AND user_id = ${user.id}
    `;

    if (existing.length === 0) {
      return error(404, { message: 'Address not found' });
    }

    // Check if address is used in orders
    const usedInOrders = await db`
      SELECT 1 FROM orders
      WHERE (shipping_address_id = ${params.addressId}::uuid
         OR billing_address_id = ${params.addressId}::uuid)
      LIMIT 1
    `;

    if (usedInOrders.length > 0) {
      // Soft delete - mark as inactive but don't remove
      await db`
        UPDATE addresses
        SET is_default = false, updated_at = NOW()
        WHERE id = ${params.addressId}::uuid
      `;

      return json({
        success: true,
        message: 'Address archived (used in orders)'
      });
    }

    const wasDefault = existing[0].is_default;

    // Delete address
    await db`DELETE FROM addresses WHERE id = ${params.addressId}::uuid`;

    // If was default, set another address as default
    if (wasDefault) {
      await db`
        UPDATE addresses
        SET is_default = true
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 1
      `;
    }

    return json({ success: true });

  } catch (err) {
    console.error('Delete address error:', err);
    return error(500, { message: 'Failed to delete address' });
  }
});

// ===========================================
// SET DEFAULT ADDRESS
// ===========================================
router.post('/:addressId/default', async (request) => {
  const { db, params, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  try {
    // Check ownership
    const existing = await db`
      SELECT * FROM addresses
      WHERE id = ${params.addressId}::uuid AND user_id = ${user.id}
    `;

    if (existing.length === 0) {
      return error(404, { message: 'Address not found' });
    }

    // Unset other defaults
    await db`
      UPDATE addresses SET is_default = false
      WHERE user_id = ${user.id}
    `;

    // Set this as default
    await db`
      UPDATE addresses SET is_default = true
      WHERE id = ${params.addressId}::uuid
    `;

    return json({ success: true });

  } catch (err) {
    console.error('Set default address error:', err);
    return error(500, { message: 'Failed to set default address' });
  }
});

// ===========================================
// GET DEFAULT ADDRESS
// ===========================================
router.get('/default', async (request) => {
  const { db, user } = request;

  if (!user) {
    return error(401, { message: 'Authentication required' });
  }

  try {
    const addresses = await db`
      SELECT * FROM addresses
      WHERE user_id = ${user.id} AND is_default = true
      LIMIT 1
    `;

    if (addresses.length === 0) {
      // Try to get any address
      const anyAddress = await db`
        SELECT * FROM addresses
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (anyAddress.length === 0) {
        return json({ address: null });
      }

      const addr = anyAddress[0];
      return json({
        address: {
          id: addr.id,
          name: addr.name,
          phone: addr.phone,
          line1: addr.line1,
          line2: addr.line2,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postal_code,
          country: addr.country,
          type: addr.type,
          isDefault: false
        }
      });
    }

    const addr = addresses[0];

    return json({
      address: {
        id: addr.id,
        name: addr.name,
        phone: addr.phone,
        line1: addr.line1,
        line2: addr.line2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postal_code,
        country: addr.country,
        type: addr.type,
        isDefault: addr.is_default
      }
    });

  } catch (err) {
    console.error('Get default address error:', err);
    return error(500, { message: 'Failed to fetch default address' });
  }
});

// ===========================================
// GET INDIAN STATES (HELPER)
// ===========================================
router.get('/meta/states', async () => {
  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    // Union Territories
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  return json({ states });
});

export default router;
