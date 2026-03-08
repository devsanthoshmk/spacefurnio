import { AutoRouter, error } from 'itty-router';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getDb } from '../utils/db';
import { Env } from '../types';

export const addressRouter = AutoRouter<AuthRequest, [env: Env, ctx: ExecutionContext]>({ base: '/api/addresses' });

addressRouter.get('/', authenticate, async (request, env) => {
  try {
    const userId = request.user.sub;
    const { sql } = getDb(env);

    const addresses = await sql`
      SELECT id, address_line_1, address_line_2, city, state, postal_code, country, is_default, created_at
      FROM user_addresses
      WHERE user_id = ${userId}
      ORDER BY is_default DESC, created_at DESC
    `;

    return addresses.map(addr => ({
      id: addr.id,
      address_line_1: addr.address_line_1 || '',
      address_line_2: addr.address_line_2 || '',
      city: addr.city || '',
      state: addr.state || '',
      postal_code: addr.postal_code || '',
      country: addr.country || 'India',
      is_default: addr.is_default || false,
    }));
  } catch (e) {
    console.error('Failed to fetch addresses:', e);
    return error(500, { message: 'Failed to fetch addresses' });
  }
});

addressRouter.get('/default', authenticate, async (request, env) => {
  try {
    const userId = request.user.sub;
    const { sql } = getDb(env);

    const addresses = await sql`
      SELECT id, address_line_1, address_line_2, city, state, postal_code, country, is_default
      FROM user_addresses
      WHERE user_id = ${userId} AND is_default = true
      LIMIT 1
    `;

    if (addresses.length === 0) {
      return { id: null, address_line_1: '', address_line_2: '', city: '', state: '', postal_code: '', country: 'India' };
    }

    const addr = addresses[0];
    return {
      id: addr.id,
      address_line_1: addr.address_line_1 || '',
      address_line_2: addr.address_line_2 || '',
      city: addr.city || '',
      state: addr.state || '',
      postal_code: addr.postal_code || '',
      country: addr.country || 'India',
    };
  } catch (e) {
    console.error('Failed to fetch default address:', e);
    return error(500, { message: 'Failed to fetch default address' });
  }
});

addressRouter.get('/:addressId', authenticate, async (request, env) => {
  try {
    const { addressId } = request.params;
    const userId = request.user.sub;
    const { sql } = getDb(env);

    const addresses = await sql`
      SELECT id, address_line_1, address_line_2, city, state, postal_code, country, is_default
      FROM user_addresses
      WHERE id = ${addressId} AND user_id = ${userId}
    `;

    if (addresses.length === 0) {
      return error(404, { message: 'Address not found' });
    }

    const addr = addresses[0];
    return {
      id: addr.id,
      address_line_1: addr.address_line_1 || '',
      address_line_2: addr.address_line_2 || '',
      city: addr.city || '',
      state: addr.state || '',
      postal_code: addr.postal_code || '',
      country: addr.country || 'India',
      is_default: addr.is_default || false,
    };
  } catch (e) {
    console.error('Failed to fetch address:', e);
    return error(500, { message: 'Failed to fetch address' });
  }
});

addressRouter.post('/', authenticate, async (request, env) => {
  try {
    const userId = request.user.sub;
    const body = await request.json() as any;
    const { address_line_1, address_line_2, city, state, postal_code, country, is_default } = body;

    const addressId = crypto.randomUUID();
    const { sql } = getDb(env);

    if (is_default) {
      await sql`
        UPDATE user_addresses SET is_default = false WHERE user_id = ${userId}
      `;
    }

    await sql`
      INSERT INTO user_addresses (id, user_id, address_line_1, address_line_2, city, state, postal_code, country, is_default)
      VALUES (${addressId}, ${userId}, ${address_line_1 || ''}, ${address_line_2 || ''}, ${city || ''}, ${state || ''}, ${postal_code || ''}, ${country || 'India'}, ${is_default || false})
    `;

    return { success: true, id: addressId };
  } catch (e) {
    console.error('Failed to create address:', e);
    return error(500, { message: 'Failed to create address' });
  }
});

addressRouter.patch('/:addressId', authenticate, async (request, env) => {
  try {
    const { addressId } = request.params;
    const userId = request.user.sub;
    const body = await request.json() as any;
    const { address_line_1, address_line_2, city, state, postal_code, country, is_default } = body;

    const { sql } = getDb(env);

    if (is_default) {
      await sql`
        UPDATE user_addresses SET is_default = false WHERE user_id = ${userId}
      `;
    }

    const updated = await sql`
      UPDATE user_addresses
      SET address_line_1 = COALESCE(${address_line_1}, address_line_1),
          address_line_2 = COALESCE(${address_line_2}, address_line_2),
          city = COALESCE(${city}, city),
          state = COALESCE(${state}, state),
          postal_code = COALESCE(${postal_code}, postal_code),
          country = COALESCE(${country}, country),
          is_default = COALESCE(${is_default}, is_default)
      WHERE id = ${addressId} AND user_id = ${userId}
      RETURNING id, address_line_1, address_line_2, city, state, postal_code, country, is_default
    `;

    if (updated.length === 0) {
      return error(404, { message: 'Address not found' });
    }

    return { success: true, address: updated[0] };
  } catch (e) {
    console.error('Failed to update address:', e);
    return error(500, { message: 'Failed to update address' });
  }
});

addressRouter.delete('/:addressId', authenticate, async (request, env) => {
  try {
    const { addressId } = request.params;
    const userId = request.user.sub;
    const { sql } = getDb(env);

    const deleted = await sql`
      DELETE FROM user_addresses
      WHERE id = ${addressId} AND user_id = ${userId}
      RETURNING id
    `;

    if (deleted.length === 0) {
      return error(404, { message: 'Address not found' });
    }

    return { success: true };
  } catch (e) {
    console.error('Failed to delete address:', e);
    return error(500, { message: 'Failed to delete address' });
  }
});

addressRouter.post('/:addressId/default', authenticate, async (request, env) => {
  try {
    const { addressId } = request.params;
    const userId = request.user.sub;
    const { sql } = getDb(env);

    await sql`
      UPDATE user_addresses SET is_default = false WHERE user_id = ${userId}
    `;

    const updated = await sql`
      UPDATE user_addresses SET is_default = true
      WHERE id = ${addressId} AND user_id = ${userId}
      RETURNING id
    `;

    if (updated.length === 0) {
      return error(404, { message: 'Address not found' });
    }

    return { success: true };
  } catch (e) {
    console.error('Failed to set default address:', e);
    return error(500, { message: 'Failed to set default address' });
  }
});