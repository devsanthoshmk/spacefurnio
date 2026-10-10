import { AutoRouter, error } from 'itty-router';
import { requirePermission, AdminAuthRequest } from '../../middleware/adminAuth';
import { getDb } from '../../utils/db';
import { Env } from '../../types';
import {
  ADMIN_ROLE_PRESETS,
  ADMIN_PERMISSIONS,
  resolvePermissions,
  canModifyAdmin,
  isSuperAdminRole,
} from '../../utils/permissions';
import { hashPassword, hashToken } from '../../utils/crypto';
import { Resend } from 'resend';

export const adminTeamRouter = AutoRouter<AdminAuthRequest, [env: Env, ctx: ExecutionContext]>({
  base: '/api/admin/team',
});

const INVITE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id?: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return UUID_REGEX.test(id);
}

// 1. Get Roles & Permissions metadata
adminTeamRouter.get('/roles', requirePermission('admins.manage'), async () => {
  return {
    presets: ADMIN_ROLE_PRESETS,
    permissions: ADMIN_PERMISSIONS,
  };
});

// 2. List Team Members and Pending Invitations
const handleGetTeam = async (request: AdminAuthRequest, env: Env) => {
  try {
    const { sql } = getDb(env);

    // Auto-create admin_invitations table if not yet present
    await sql`
      CREATE TABLE IF NOT EXISTS admin_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'store_manager',
        permissions TEXT[] NOT NULL DEFAULT '{}',
        token_hash TEXT UNIQUE NOT NULL,
        invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
        expires_at TIMESTAMP NOT NULL,
        accepted_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Fetch team members with admin roles and pending invitations
    const [teamRows, inviteRows] = await Promise.all([
      sql`
        SELECT 
          u.id, u.email, u.phone_number, u.is_active, u.created_at, u.updated_at,
          ur.role_id as role
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.role_id IN ('admin', 'super_admin', 'store_manager', 'sales_fulfillment', 'customer_support', 'catalog_inventory', 'custom')
        ORDER BY u.created_at ASC
      `,
      sql`
        SELECT 
          ai.id, ai.email, ai.name, ai.role, ai.permissions, ai.expires_at, ai.accepted_at, ai.created_at,
          u.email as invited_by_email
        FROM admin_invitations ai
        LEFT JOIN users u ON ai.invited_by = u.id
        WHERE ai.accepted_at IS NULL AND ai.expires_at > NOW()
        ORDER BY ai.created_at DESC
      `,
    ]);

    const enrichedTeam = teamRows.map((member: any) => ({
      id: member.id,
      email: member.email,
      name: member.email.split('@')[0],
      phone_number: member.phone_number,
      role: member.role,
      is_active: Boolean(member.is_active),
      resolved_permissions: resolvePermissions(member.role),
      created_at: member.created_at,
      updated_at: member.updated_at,
    }));

    return {
      team: enrichedTeam,
      invitations: inviteRows.map((i: any) => ({
        id: i.id,
        email: i.email,
        name: i.name,
        role: i.role,
        permissions: Array.isArray(i.permissions) ? i.permissions : [],
        invited_by: i.invited_by_email,
        expires_at: i.expires_at,
        created_at: i.created_at,
      })),
      presets: ADMIN_ROLE_PRESETS,
      permissions: ADMIN_PERMISSIONS,
    };
  } catch (e: any) {
    console.error('Failed to get team list:', e);
    return error(500, { message: 'Failed to fetch team members', error: e?.message });
  }
};

adminTeamRouter.get('/', requirePermission('admins.manage'), handleGetTeam);
adminTeamRouter.get('', requirePermission('admins.manage'), handleGetTeam);

// 3. Invite Team Member
adminTeamRouter.post('/invite', requirePermission('admins.manage'), async (request, env) => {
  try {
    const body = (await request.json().catch(() => ({}))) as any;
    const { email, name, role = 'store_manager', permissions = [] } = body || {};

    if (!email || typeof email !== 'string' || !email.includes('@') || !name || typeof name !== 'string' || !name.trim()) {
      return error(400, { message: 'Valid email and name are required' });
    }

    if (role && !ADMIN_ROLE_PRESETS[role]) {
      return error(400, { message: `Invalid role: ${role}. Must be one of: ${Object.keys(ADMIN_ROLE_PRESETS).join(', ')}` });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanName = String(name).trim();
    const actorId = request.user?.id || request.user?.sub;

    const { sql } = getDb(env);

    // Auto-create admin_invitations table if needed
    await sql`
      CREATE TABLE IF NOT EXISTS admin_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'store_manager',
        permissions TEXT[] NOT NULL DEFAULT '{}',
        token_hash TEXT UNIQUE NOT NULL,
        invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
        expires_at TIMESTAMP NOT NULL,
        accepted_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Check if admin user already exists
    const existingUser = await sql`
      SELECT u.id, ur.role_id 
      FROM users u 
      LEFT JOIN user_roles ur ON u.id = ur.user_id 
      WHERE LOWER(u.email) = ${cleanEmail}
      LIMIT 1
    `;

    if (existingUser.length > 0 && existingUser[0].role_id && existingUser[0].role_id !== 'customer') {
      return error(409, { message: 'An admin account with this email already exists' });
    }

    // Check if active pending unexpired invitation already exists
    const pendingInvite = await sql`
      SELECT id FROM admin_invitations
      WHERE LOWER(email) = ${cleanEmail}
        AND accepted_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `;

    if (pendingInvite.length > 0) {
      return error(409, { message: 'An active pending invitation for this email already exists' });
    }

    // Clean up any old expired or accepted invitations for this email
    await sql`DELETE FROM admin_invitations WHERE LOWER(email) = ${cleanEmail}`;

    // Generate secure invitation token
    const rawToken = crypto.randomUUID() + '-' + crypto.randomUUID();
    const tokenDigest = await hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const insertedInvite = await sql`
      INSERT INTO admin_invitations (email, name, role, permissions, token_hash, invited_by, expires_at, created_at)
      VALUES (${cleanEmail}, ${cleanName}, ${role}, ${permissions}, ${tokenDigest}, ${actorId || null}, ${expiresAt}, NOW())
      RETURNING id, email, name, role, expires_at
    `;

    const origin = request.headers.get('origin') || 'http://localhost:5173';
    const setupUrl = `${origin}/admin/setup?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(cleanEmail)}`;

    // Dispatch email if Resend is configured
    if (env.RESEND_API_KEY) {
      try {
        const resend = new Resend(env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'Spacefurnio Team <noreply@spacefurnio.in>',
          to: cleanEmail,
          subject: 'You have been invited to join the Spacefurnio Admin Team',
          html: `
            <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #1e293b; margin-bottom: 8px;">Welcome to Spacefurnio Admin</h2>
              <p style="color: #475569; font-size: 15px;">Hello ${cleanName}, you have been invited to join the Spacefurnio Admin Portal with the role of <strong>${ADMIN_ROLE_PRESETS[role]?.name || role}</strong>.</p>
              <div style="margin: 24px 0; text-align: center;">
                <a href="${setupUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">Set Up Your Account</a>
              </div>
              <p style="color: #94a3b8; font-size: 12px;">This invitation link will expire in 24 hours.</p>
            </div>
          `,
        });
      } catch (err) {
        console.error('Failed to send invite email:', err);
      }
    }

    return {
      success: true,
      message: `Invitation generated for ${cleanEmail}`,
      invitation: insertedInvite[0],
      setup_url: setupUrl,
      raw_token: rawToken,
    };
  } catch (e: any) {
    console.error('Failed to create invitation:', e);
    return error(500, { message: 'Failed to invite team member', error: e?.message });
  }
});

// 4. Accept Invitation (Public or initial setup)
adminTeamRouter.post('/accept-invite', async (request, env) => {
  try {
    const body = (await request.json().catch(() => ({}))) as any;
    const { token, password } = body || {};

    if (!token || !password || typeof password !== 'string' || password.length < 6) {
      return error(400, { message: 'Token and a password of at least 6 characters are required' });
    }

    const tokenDigest = await hashToken(token);
    const { sql } = getDb(env);

    const inviteRows = await sql`
      SELECT id, email, name, role, permissions, expires_at, accepted_at
      FROM admin_invitations
      WHERE token_hash = ${tokenDigest}
      LIMIT 1
    `;

    if (inviteRows.length === 0) {
      return error(400, { message: 'Invalid or expired invitation token' });
    }

    const invite = inviteRows[0];
    if (invite.accepted_at) {
      return error(400, { message: 'This invitation has already been accepted' });
    }

    if (new Date(invite.expires_at) <= new Date()) {
      return error(400, { message: 'This invitation token has expired' });
    }

    const passwordHash = await hashPassword(password);

    // Create or update user in users table
    const existingUser = await sql`SELECT id FROM users WHERE LOWER(email) = ${invite.email.toLowerCase()} LIMIT 1`;
    let userId: string;

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
      await sql`
        UPDATE users 
        SET password_hash = ${passwordHash}, is_active = true, updated_at = NOW() 
        WHERE id = ${userId}
      `;
    } else {
      userId = crypto.randomUUID();
      await sql`
        INSERT INTO users (id, email, password_hash, is_active, created_at, updated_at)
        VALUES (${userId}, ${invite.email.toLowerCase()}, ${passwordHash}, true, NOW(), NOW())
      `;
    }

    // Ensure user has cart and wishlist
    await sql`INSERT INTO carts (user_id) VALUES (${userId}) ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO wishlists (user_id) VALUES (${userId}) ON CONFLICT DO NOTHING`;

    // Ensure role exists in roles table
    await sql`
      INSERT INTO roles (id, description)
      VALUES (${invite.role}, ${ADMIN_ROLE_PRESETS[invite.role]?.description || 'Admin role'})
      ON CONFLICT (id) DO NOTHING
    `;

    // Assign admin role to user (reset any previous roles)
    await sql`DELETE FROM user_roles WHERE user_id = ${userId}`;
    await sql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES (${userId}, ${invite.role})
      ON CONFLICT (user_id, role_id) DO NOTHING
    `;

    // Mark invitation accepted
    await sql`
      UPDATE admin_invitations 
      SET accepted_at = NOW() 
      WHERE id = ${invite.id}
    `;

    return {
      success: true,
      message: 'Account set up successfully! You can now log in.',
      user: {
        id: userId,
        email: invite.email,
        role: invite.role,
      },
    };
  } catch (e: any) {
    console.error('Failed to accept invitation:', e);
    return error(500, { message: 'Failed to accept invitation', error: e?.message });
  }
});

// 5. Update Admin Team Member (Role, Active Status)
adminTeamRouter.put('/:id', requirePermission('admins.manage'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!isValidUUID(id)) {
      return error(404, { message: 'Team member not found' });
    }

    const body = (await request.json().catch(() => ({}))) as any;
    const { role, is_active } = body || {};

    if (role !== undefined && !ADMIN_ROLE_PRESETS[role]) {
      return error(400, { message: `Invalid role: ${role}. Must be one of: ${Object.keys(ADMIN_ROLE_PRESETS).join(', ')}` });
    }

    const actorId = String(request.user?.id || request.user?.sub || '');
    const actorRole = String(request.user?.role || 'admin');

    const { sql } = getDb(env);

    const targetRows = await sql`
      SELECT u.id, u.email, u.is_active, COALESCE(ur.role_id, 'customer') as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = ${id}
      LIMIT 1
    `;

    if (targetRows.length === 0) {
      return error(404, { message: 'Team member not found' });
    }

    const targetUser = targetRows[0];

    // Count active super admins
    const superAdminsCount = await sql`
      SELECT COUNT(*)::int as count 
      FROM users u 
      JOIN user_roles ur ON u.id = ur.user_id 
      WHERE ur.role_id IN ('super_admin', 'admin') AND u.is_active = true
    `;
    const totalActiveSuperAdmins = Number(superAdminsCount[0]?.count || 1);

    const check = canModifyAdmin(
      { id: actorId, email: request.user?.email || '', role: actorRole, isActive: true },
      { id: targetUser.id, email: targetUser.email, role: targetUser.role, isActive: targetUser.is_active },
      role,
      is_active,
      totalActiveSuperAdmins
    );

    if (!check.allowed) {
      return error(403, { message: check.reason || 'Action disallowed by security policies' });
    }

    if (is_active !== undefined) {
      await sql`
        UPDATE users 
        SET is_active = ${Boolean(is_active)}, updated_at = NOW() 
        WHERE id = ${id}
      `;
    }

    if (role) {
      // Ensure role exists in roles table
      await sql`
        INSERT INTO roles (id, description)
        VALUES (${role}, ${ADMIN_ROLE_PRESETS[role]?.description || 'Admin role'})
        ON CONFLICT (id) DO NOTHING
      `;

      // Update role
      await sql`DELETE FROM user_roles WHERE user_id = ${id}`;
      await sql`INSERT INTO user_roles (user_id, role_id) VALUES (${id}, ${role})`;
    }

    return {
      success: true,
      message: 'Team member updated successfully',
    };
  } catch (e: any) {
    console.error('Failed to update team member:', e);
    return error(500, { message: 'Failed to update team member', error: e?.message });
  }
});

// 6. Delete / Revoke Team Member Admin Access
adminTeamRouter.delete('/:id', requirePermission('admins.manage'), async (request, env) => {
  try {
    const { id } = request.params;
    if (!isValidUUID(id)) {
      return error(404, { message: 'Team member not found' });
    }

    const actorId = String(request.user?.id || request.user?.sub || '');
    const actorRole = String(request.user?.role || 'admin');

    if (id === actorId) {
      return error(403, { message: 'You cannot remove your own admin access' });
    }

    const { sql } = getDb(env);

    const targetRows = await sql`
      SELECT u.id, u.email, u.is_active, COALESCE(ur.role_id, 'customer') as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = ${id}
      LIMIT 1
    `;

    if (targetRows.length === 0) {
      return error(404, { message: 'Team member not found' });
    }

    const targetUser = targetRows[0];

    if (isSuperAdminRole(targetUser.role)) {
      if (!isSuperAdminRole(actorRole)) {
        return error(403, { message: 'Only Super Admins can revoke Super Admin accounts' });
      }

      const superAdminsCount = await sql`
        SELECT COUNT(*)::int as count 
        FROM users u 
        JOIN user_roles ur ON u.id = ur.user_id 
        WHERE ur.role_id IN ('super_admin', 'admin') AND u.is_active = true
      `;
      if (Number(superAdminsCount[0]?.count || 1) <= 1) {
        return error(403, { message: 'Cannot remove the last remaining Super Admin' });
      }
    }

    // Revoke admin role by resetting to standard customer
    await sql`DELETE FROM user_roles WHERE user_id = ${id}`;
    await sql`INSERT INTO user_roles (user_id, role_id) VALUES (${id}, 'customer')`;

    return {
      success: true,
      message: `Admin privileges revoked for ${targetUser.email}`,
    };
  } catch (e: any) {
    console.error('Failed to revoke admin member:', e);
    return error(500, { message: 'Failed to revoke admin privileges', error: e?.message });
  }
});

// 7. Revoke Pending Invitation
adminTeamRouter.delete('/invite/:inviteId', requirePermission('admins.manage'), async (request, env) => {
  try {
    const { inviteId } = request.params;
    if (!isValidUUID(inviteId)) {
      return error(404, { message: 'Invitation not found' });
    }

    const { sql } = getDb(env);

    const result = await sql`DELETE FROM admin_invitations WHERE id = ${inviteId} RETURNING id, email`;
    if (result.length === 0) {
      return error(404, { message: 'Invitation not found' });
    }

    return {
      success: true,
      message: `Invitation for ${result[0].email} revoked`,
    };
  } catch (e: any) {
    console.error('Failed to revoke invitation:', e);
    return error(500, { message: 'Failed to revoke invitation', error: e?.message });
  }
});
