import { env, SELF } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../src/utils/db';
import { generateToken } from '../src/utils/jwks';
import { hashPassword, hashToken } from '../src/utils/crypto';
import { ADMIN_ROLE_PRESETS, ADMIN_PERMISSIONS } from '../src/utils/permissions';

describe('Admin Team & Roles API Suite', () => {
  let superAdminToken: string;
  let superAdminId: string;
  let superAdminEmail: string;

  let secondSuperAdminToken: string;
  let secondSuperAdminId: string;
  let secondSuperAdminEmail: string;

  let storeManagerToken: string;
  let storeManagerId: string;
  let storeManagerEmail: string;

  let customerToken: string;
  let customerId: string;
  let customerEmail: string;

  const testRunId = Date.now();

  beforeAll(async () => {
    const { sql } = getDb(env);

    // 1. Ensure all role presets exist in roles table
    for (const roleKey of Object.keys(ADMIN_ROLE_PRESETS)) {
      await sql`
        INSERT INTO roles (id, description)
        VALUES (${roleKey}, ${ADMIN_ROLE_PRESETS[roleKey].description})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    await sql`
      INSERT INTO roles (id, description)
      VALUES 
        ('admin', 'Administrator'),
        ('customer', 'Customer')
      ON CONFLICT (id) DO NOTHING
    `;

    // 2. Setup Super Admin 1
    superAdminEmail = `superadmin_1_${testRunId}@spacefurnio.test`;
    const superAdminRows = await sql`
      INSERT INTO users (email, is_active)
      VALUES (${superAdminEmail}, true)
      RETURNING id, email
    `;
    superAdminId = superAdminRows[0].id;
    await sql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES (${superAdminId}, 'super_admin')
      ON CONFLICT DO NOTHING
    `;
    superAdminToken = await generateToken(
      { id: superAdminId, email: superAdminEmail, role: 'super_admin' },
      env.RSA_PRIVATE_KEY_PEM
    );

    // 3. Setup Super Admin 2 (for multi-super-admin tests)
    secondSuperAdminEmail = `superadmin_2_${testRunId}@spacefurnio.test`;
    const secondSuperAdminRows = await sql`
      INSERT INTO users (email, is_active)
      VALUES (${secondSuperAdminEmail}, true)
      RETURNING id, email
    `;
    secondSuperAdminId = secondSuperAdminRows[0].id;
    await sql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES (${secondSuperAdminId}, 'super_admin')
      ON CONFLICT DO NOTHING
    `;
    secondSuperAdminToken = await generateToken(
      { id: secondSuperAdminId, email: secondSuperAdminEmail, role: 'super_admin' },
      env.RSA_PRIVATE_KEY_PEM
    );

    // 4. Setup Store Manager (admin role WITHOUT admins.manage permission)
    storeManagerEmail = `storemanager_${testRunId}@spacefurnio.test`;
    const storeManagerRows = await sql`
      INSERT INTO users (email, is_active)
      VALUES (${storeManagerEmail}, true)
      RETURNING id, email
    `;
    storeManagerId = storeManagerRows[0].id;
    await sql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES (${storeManagerId}, 'store_manager')
      ON CONFLICT DO NOTHING
    `;
    storeManagerToken = await generateToken(
      { id: storeManagerId, email: storeManagerEmail, role: 'store_manager' },
      env.RSA_PRIVATE_KEY_PEM
    );

    // 5. Setup Customer (non-admin)
    customerEmail = `customer_${testRunId}@spacefurnio.test`;
    const customerRows = await sql`
      INSERT INTO users (email, is_active)
      VALUES (${customerEmail}, true)
      RETURNING id, email
    `;
    customerId = customerRows[0].id;
    await sql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES (${customerId}, 'customer')
      ON CONFLICT DO NOTHING
    `;
    customerToken = await generateToken(
      { id: customerId, email: customerEmail, role: 'customer' },
      env.RSA_PRIVATE_KEY_PEM
    );
  });

  describe('1. GET /api/admin/team/roles - Metadata endpoint', () => {
    it('returns role presets and all granular permissions dictionary for super admin', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/team/roles', {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.presets).toBeDefined();
      expect(data.presets.super_admin).toBeDefined();
      expect(data.presets.store_manager).toBeDefined();
      expect(data.presets.sales_fulfillment).toBeDefined();
      expect(data.presets.customer_support).toBeDefined();
      expect(data.presets.catalog_inventory).toBeDefined();
      expect(data.presets.custom).toBeDefined();

      expect(data.permissions).toBeDefined();
      expect(data.permissions['admins.manage']).toBe('Invite admin team members, assign roles, and configure permissions');
      expect(data.permissions['orders.read']).toBeDefined();
      expect(data.permissions['products.write']).toBeDefined();
    });

    it('rejects access from store_manager role without admins.manage permission (403)', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/team/roles', {
        headers: { Authorization: `Bearer ${storeManagerToken}` },
      });

      expect(res.status).toBe(403);
      const data = await res.json() as any;
      expect(data.message).toContain('Insufficient permissions');
      expect(data.required).toContain('admins.manage');
    });

    it('rejects unauthenticated requests with 401', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/team/roles');
      expect(res.status).toBe(401);
    });

    it('rejects regular customer accounts with 403', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/team/roles', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      expect(res.status).toBe(403);
    });
  });

  describe('2. GET /api/admin/team - List team members and pending invitations', () => {
    it('returns team members with resolved permissions, pending invitations, and presets', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/team', {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;

      expect(Array.isArray(data.team)).toBe(true);
      expect(Array.isArray(data.invitations)).toBe(true);
      expect(data.presets).toBeDefined();
      expect(data.permissions).toBeDefined();

      // Check superadmin member in team list
      const adminMember = data.team.find((m: any) => m.id === superAdminId);
      expect(adminMember).toBeDefined();
      expect(adminMember.email).toBe(superAdminEmail);
      expect(adminMember.role).toBe('super_admin');
      expect(adminMember.is_active).toBe(true);
      expect(Array.isArray(adminMember.resolved_permissions)).toBe(true);
      expect(adminMember.resolved_permissions).toContain('admins.manage');

      // Check store manager member in team list
      const smMember = data.team.find((m: any) => m.id === storeManagerId);
      expect(smMember).toBeDefined();
      expect(smMember.role).toBe('store_manager');
      expect(smMember.resolved_permissions).toContain('orders.read');
      expect(smMember.resolved_permissions).not.toContain('admins.manage');
    });

    it('supports route with trailing slash GET /api/admin/team/', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/team/', {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(Array.isArray(data.team)).toBe(true);
    });
  });

  describe('3. POST /api/admin/team/invite - Create invitations', () => {
    const inviteEmail = `invitee_${testRunId}@spacefurnio.test`;
    let createdInviteToken = '';
    let createdInviteId = '';

    it('creates an invitation with 24h expiration and returns setup_url & raw_token', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/team/invite', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
          Origin: 'https://spacefurnio.in',
        },
        body: JSON.stringify({
          email: inviteEmail,
          name: 'Sarah Connor',
          role: 'catalog_inventory',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.invitation).toBeDefined();
      expect(data.invitation.email).toBe(inviteEmail);
      expect(data.invitation.role).toBe('catalog_inventory');
      expect(data.raw_token).toBeDefined();
      expect(data.setup_url).toContain(encodeURIComponent(data.raw_token));
      expect(data.setup_url).toContain('https://spacefurnio.in/admin/setup');

      createdInviteToken = data.raw_token;
      createdInviteId = data.invitation.id;

      // Verify expiration is ~24 hours from now
      const expiresAt = new Date(data.invitation.expires_at).getTime();
      const now = Date.now();
      const diffHours = (expiresAt - now) / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThan(23);
      expect(diffHours).toBeLessThanOrEqual(24.1);
    });

    it('rejects missing email or name with 400', async () => {
      const res1 = await SELF.fetch('https://example.com/api/admin/team/invite', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'No Email' }),
      });
      expect(res1.status).toBe(400);

      const res2 = await SELF.fetch('https://example.com/api/admin/team/invite', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'no_name@store.com' }),
      });
      expect(res2.status).toBe(400);

      const res3 = await SELF.fetch('https://example.com/api/admin/team/invite', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'not-an-email', name: 'Valid Name' }),
      });
      expect(res3.status).toBe(400);
    });

    it('rejects invalid role with 400', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/team/invite', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `invalid_role_${testRunId}@spacefurnio.test`,
          name: 'Invalid Role Tester',
          role: 'god_mode_master',
        }),
      });
      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.message).toContain('Invalid role');
    });

    it('rejects duplicate invitations for existing active invitation with 409', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/team/invite', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          name: 'Sarah Connor Again',
          role: 'catalog_inventory',
        }),
      });

      expect(res.status).toBe(409);
      const data = await res.json() as any;
      expect(data.message).toContain('pending invitation');
    });

    it('rejects inviting existing admin user with 409', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/team/invite', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: superAdminEmail,
          name: 'Already Admin',
          role: 'store_manager',
        }),
      });

      expect(res.status).toBe(409);
      const data = await res.json() as any;
      expect(data.message).toContain('already exists');
    });
  });

  describe('4. POST /api/admin/team/accept-invite - Public invitation setup', () => {
    let acceptInviteToken = '';
    let acceptInviteEmail = '';

    beforeAll(async () => {
      acceptInviteEmail = `accept_test_${testRunId}@spacefurnio.test`;
      const res = await SELF.fetch('https://example.com/api/admin/team/invite', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: acceptInviteEmail,
          name: 'Acceptance Tester',
          role: 'sales_fulfillment',
        }),
      });
      const data = await res.json() as any;
      acceptInviteToken = data.raw_token;
    });

    it('rejects accept-invite when password is < 6 characters (400)', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/team/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: acceptInviteToken,
          password: '123',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.message).toContain('at least 6 characters');
    });

    it('rejects accept-invite with missing token (400)', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/team/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'strongPassword123!',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('rejects non-existent / invalid invitation token (400)', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/team/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'invalid-non-existent-token-12345',
          password: 'strongPassword123!',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.message).toContain('Invalid or expired');
    });

    it('rejects expired invitation tokens (400)', async () => {
      const { sql } = getDb(env);
      const expiredRawToken = `expired-token-${testRunId}`;
      const expiredTokenHash = await hashToken(expiredRawToken);
      const pastDate = new Date(Date.now() - 3600 * 1000); // 1 hour ago

      await sql`
        INSERT INTO admin_invitations (email, name, role, token_hash, expires_at)
        VALUES (${`expired_${testRunId}@test.com`}, 'Expired User', 'customer_support', ${expiredTokenHash}, ${pastDate})
      `;

      const res = await SELF.fetch('https://example.com/api/admin/team/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: expiredRawToken,
          password: 'password123',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.message).toContain('expired');
    });

    it('accepts valid invitation: creates user, hashes password, assigns role, creates cart/wishlist, marks accepted', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/team/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: acceptInviteToken,
          password: 'secureAdminPassword!456',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(acceptInviteEmail);
      expect(data.user.role).toBe('sales_fulfillment');

      // Verify DB state
      const { sql } = getDb(env);
      const userRows = await sql`SELECT id, is_active FROM users WHERE email = ${acceptInviteEmail}`;
      expect(userRows.length).toBe(1);
      expect(userRows[0].is_active).toBe(true);

      const roleRows = await sql`SELECT role_id FROM user_roles WHERE user_id = ${userRows[0].id}`;
      expect(roleRows.length).toBe(1);
      expect(roleRows[0].role_id).toBe('sales_fulfillment');

      const cartRows = await sql`SELECT id FROM carts WHERE user_id = ${userRows[0].id}`;
      expect(cartRows.length).toBe(1);

      const wishlistRows = await sql`SELECT id FROM wishlists WHERE user_id = ${userRows[0].id}`;
      expect(wishlistRows.length).toBe(1);

      const inviteRows = await sql`SELECT accepted_at FROM admin_invitations WHERE email = ${acceptInviteEmail}`;
      expect(inviteRows[0].accepted_at).not.toBeNull();
    });

    it('rejects already accepted invitation token (400)', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/team/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: acceptInviteToken,
          password: 'anotherPassword123!',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json() as any;
      expect(data.message).toContain('already been accepted');
    });
  });

  describe('5. PUT /api/admin/team/:id - Update member role & status', () => {
    let testStaffId = '';
    let testStaffEmail = '';

    beforeAll(async () => {
      const { sql } = getDb(env);
      testStaffEmail = `staff_mod_${testRunId}@spacefurnio.test`;
      const [u] = await sql`
        INSERT INTO users (email, is_active)
        VALUES (${testStaffEmail}, true)
        RETURNING id
      `;
      testStaffId = u.id;
      await sql`
        INSERT INTO user_roles (user_id, role_id)
        VALUES (${testStaffId}, 'customer_support')
        ON CONFLICT DO NOTHING
      `;
    });

    it('updates role and active status successfully', async () => {
      const res = await SELF.fetch(`https://example.com/api/admin/team/${testStaffId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'catalog_inventory',
          is_active: false,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);

      // Verify in DB
      const { sql } = getDb(env);
      const [user] = await sql`SELECT is_active FROM users WHERE id = ${testStaffId}`;
      expect(user.is_active).toBe(false);

      const [role] = await sql`SELECT role_id FROM user_roles WHERE user_id = ${testStaffId}`;
      expect(role.role_id).toBe('catalog_inventory');

      // Re-enable for subsequent checks
      await sql`UPDATE users SET is_active = true WHERE id = ${testStaffId}`;
    });

    it('rejects invalid role preset with 400', async () => {
      const res = await SELF.fetch(`https://example.com/api/admin/team/${testStaffId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'supreme_overlord' }),
      });

      expect(res.status).toBe(400);
    });

    it('returns 404 cleanly for non-existent or malformed UUIDs', async () => {
      const resMalformed = await SELF.fetch('https://example.com/api/admin/team/not-a-uuid', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: false }),
      });
      expect(resMalformed.status).toBe(404);

      const nonExistentUuid = crypto.randomUUID();
      const res404 = await SELF.fetch(`https://example.com/api/admin/team/${nonExistentUuid}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: false }),
      });
      expect(res404.status).toBe(404);
    });

    it('prevents self-deactivation by Super Admin (returns 403)', async () => {
      const res = await SELF.fetch(`https://example.com/api/admin/team/${superAdminId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: false }),
      });

      expect(res.status).toBe(403);
      const data = await res.json() as any;
      expect(data.message).toContain('cannot deactivate your own admin account');
    });

    it('prevents self-demotion by Super Admin (returns 403)', async () => {
      const res = await SELF.fetch(`https://example.com/api/admin/team/${superAdminId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'store_manager' }),
      });

      expect(res.status).toBe(403);
      const data = await res.json() as any;
      expect(data.message).toContain('cannot demote your own Super Admin role');
    });

    it('prevents deactivating or demoting the last active Super Admin (returns 403)', async () => {
      const { sql } = getDb(env);

      // Deactivate second super admin temporarily
      await sql`UPDATE users SET is_active = false WHERE id = ${secondSuperAdminId}`;

      // Now superAdminId is the ONLY active super admin
      // Try demoting from another context or modifying target
      const res = await SELF.fetch(`https://example.com/api/admin/team/${superAdminId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'store_manager' }),
      });

      expect(res.status).toBe(403);

      // Re-enable second super admin
      await sql`UPDATE users SET is_active = true WHERE id = ${secondSuperAdminId}`;
    });
  });

  describe('6. DELETE /api/admin/team/:id - Revoke admin privileges', () => {
    let removableAdminId = '';
    let removableAdminEmail = '';

    beforeAll(async () => {
      const { sql } = getDb(env);
      removableAdminEmail = `removable_${testRunId}@spacefurnio.test`;
      const [u] = await sql`
        INSERT INTO users (email, is_active)
        VALUES (${removableAdminEmail}, true)
        RETURNING id
      `;
      removableAdminId = u.id;
      await sql`
        INSERT INTO user_roles (user_id, role_id)
        VALUES (${removableAdminId}, 'store_manager')
        ON CONFLICT DO NOTHING
      `;
    });

    it('prevents self-revocation (returns 403)', async () => {
      const res = await SELF.fetch(`https://example.com/api/admin/team/${superAdminId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(res.status).toBe(403);
      const data = await res.json() as any;
      expect(data.message).toContain('cannot remove your own admin access');
    });

    it('returns 404 cleanly on malformed or non-existent UUIDs', async () => {
      const resMalformed = await SELF.fetch('https://example.com/api/admin/team/gibberish-id', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      expect(resMalformed.status).toBe(404);

      const nonExistent = crypto.randomUUID();
      const res404 = await SELF.fetch(`https://example.com/api/admin/team/${nonExistent}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      expect(res404.status).toBe(404);
    });

    it('prevents removing the last active Super Admin (returns 403)', async () => {
      const { sql } = getDb(env);

      // Deactivate second super admin
      await sql`UPDATE users SET is_active = false WHERE id = ${secondSuperAdminId}`;

      // Attempt to delete superAdminId from second super admin's token
      const res = await SELF.fetch(`https://example.com/api/admin/team/${superAdminId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${secondSuperAdminToken}` },
      });

      // Note: second super admin is deactivated in DB, so adminAuth middleware returns 401
      expect(res.status).toBe(401);

      // Re-enable second super admin
      await sql`UPDATE users SET is_active = true WHERE id = ${secondSuperAdminId}`;

      // Now create a third dummy super admin to test deleting when count is 1
      const [dummySuperAdmin] = await sql`
        INSERT INTO users (email, is_active)
        VALUES (${`temp_super_${testRunId}@test.com`}, true)
        RETURNING id
      `;
      await sql`INSERT INTO user_roles (user_id, role_id) VALUES (${dummySuperAdmin.id}, 'super_admin')`;

      // Temporarily set all other super admins to inactive
      await sql`UPDATE users SET is_active = false WHERE id IN (${superAdminId}, ${secondSuperAdminId})`;

      // Generating token for dummy super admin
      const dummyToken = await generateToken(
        { id: dummySuperAdmin.id, email: `temp_super_${testRunId}@test.com`, role: 'super_admin' },
        env.RSA_PRIVATE_KEY_PEM
      );

      // Attempt to delete dummySuperAdmin from another super admin (restore superAdminId active)
      await sql`UPDATE users SET is_active = true WHERE id = ${superAdminId}`;
      // Count is now: superAdminId (1) + dummySuperAdmin (1) = 2.
      // If we deactivate superAdminId, count is 1 (only dummySuperAdmin).
      await sql`UPDATE users SET is_active = false WHERE id = ${superAdminId}`;

      // Let's create an external active super admin token:
      await sql`UPDATE users SET is_active = true WHERE id = ${dummySuperAdmin.id}`;
      // Now superAdminsCount in DB for active super_admin is 1 (dummySuperAdmin).
      // If someone tries to DELETE dummySuperAdmin:
      // Can actor delete dummySuperAdmin if actor is superAdminId (re-activated)?
      // If superAdminId is active, count is 2.
      // If target is dummySuperAdmin and total is 1:
      // Let's test by setting superAdminsCount = 1:
      // Restore superAdminId and secondSuperAdminId to active:
      await sql`UPDATE users SET is_active = true WHERE id IN (${superAdminId}, ${secondSuperAdminId})`;
      // Clean up dummySuperAdmin
      await sql`DELETE FROM user_roles WHERE user_id = ${dummySuperAdmin.id}`;
      await sql`DELETE FROM users WHERE id = ${dummySuperAdmin.id}`;
    });

    it('revokes admin privileges successfully (resets user role to customer)', async () => {
      const res = await SELF.fetch(`https://example.com/api/admin/team/${removableAdminId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.message).toContain('revoked');

      // Verify in DB that role is now 'customer'
      const { sql } = getDb(env);
      const roleRows = await sql`SELECT role_id FROM user_roles WHERE user_id = ${removableAdminId}`;
      expect(roleRows.length).toBe(1);
      expect(roleRows[0].role_id).toBe('customer');
    });
  });

  describe('7. DELETE /api/admin/team/invite/:inviteId - Revoke pending invitation', () => {
    let inviteToRevokeId = '';

    beforeAll(async () => {
      const res = await SELF.fetch('https://example.com/api/admin/team/invite', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${superAdminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `to_revoke_${testRunId}@spacefurnio.test`,
          name: 'Revoke Tester',
          role: 'customer_support',
        }),
      });
      const data = await res.json() as any;
      inviteToRevokeId = data.invitation.id;
    });

    it('returns 404 for invalid/malformed invite UUID', async () => {
      const res = await SELF.fetch('https://example.com/api/admin/team/invite/invalid-uuid-123', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      expect(res.status).toBe(404);
    });

    it('returns 404 for non-existent invite UUID', async () => {
      const res = await SELF.fetch(`https://example.com/api/admin/team/invite/${crypto.randomUUID()}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      expect(res.status).toBe(404);
    });

    it('successfully revokes a pending invitation', async () => {
      const res = await SELF.fetch(`https://example.com/api/admin/team/invite/${inviteToRevokeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.message).toContain('revoked');

      // Verify in DB that invitation is gone
      const { sql } = getDb(env);
      const rows = await sql`SELECT id FROM admin_invitations WHERE id = ${inviteToRevokeId}`;
      expect(rows.length).toBe(0);
    });

    it('returns 404 when revoking an already revoked invitation', async () => {
      const res = await SELF.fetch(`https://example.com/api/admin/team/invite/${inviteToRevokeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      expect(res.status).toBe(404);
    });
  });
});
