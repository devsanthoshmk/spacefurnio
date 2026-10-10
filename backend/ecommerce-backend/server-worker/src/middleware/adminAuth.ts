import { jwtVerify } from 'jose';
import { loadPublicKey } from '../utils/jwks';
import { error, IRequest } from 'itty-router';
import { Env } from '../types';
import { getDb } from '../utils/db';
import { resolvePermissions, hasPermission, AdminPermission, isSuperAdminRole } from '../utils/permissions';

export type AdminAuthRequest = IRequest & {
  user?: {
    id: string;
    sub: string;
    email: string;
    role: string;
    permissions?: string[];
    [key: string]: any;
  };
  adminPermissions?: string[];
};

export async function authenticateAdmin(request: AdminAuthRequest, env: Env) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(401, { message: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const publicKey = await loadPublicKey(env.RSA_PUBLIC_KEY_PEM);
    const { payload } = await jwtVerify(token, publicKey, { algorithms: ['RS256'] });
    
    const userId = payload.sub as string;
    const tokenRole = (payload.role as string) || 'customer';

    // Verify user role & active status from database
    const { sql } = getDb(env);
    const userRows = await sql`
      SELECT u.id, u.email, u.is_active, COALESCE(ur.role_id, ${tokenRole}) as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = ${userId}
      LIMIT 1
    `;

    if (userRows.length === 0 || !userRows[0].is_active) {
      return error(401, { message: 'Account is deactivated or does not exist' });
    }

    const dbUser = userRows[0];
    const role = dbUser.role || tokenRole;

    const allowedAdminRoles = ['admin', 'super_admin', 'store_manager', 'sales_fulfillment', 'customer_support', 'catalog_inventory', 'custom'];
    if (!allowedAdminRoles.includes(role.toLowerCase())) {
      return error(403, { message: 'Forbidden: Admin access required' });
    }

    const resolved = resolvePermissions(role);

    request.user = {
      ...payload,
      id: dbUser.id,
      sub: dbUser.id,
      email: dbUser.email,
      role: role,
    };
    request.adminPermissions = resolved;
  } catch (e: any) {
    return error(401, { message: 'Invalid or expired token' });
  }
}

export const requireAdmin = async (request: AdminAuthRequest, env: Env) => {
  const authResult = await authenticateAdmin(request, env);
  if (authResult) return authResult;
};

export const requirePermission = (...requiredPermissions: AdminPermission[]) => {
  return async (request: AdminAuthRequest, env: Env) => {
    const authResult = await authenticateAdmin(request, env);
    if (authResult) return authResult;

    if (!request.user || !request.adminPermissions) {
      return error(401, { message: 'Unauthorized' });
    }

    if (isSuperAdminRole(request.user.role)) {
      return; // Full access
    }

    const permitted = hasPermission(request.adminPermissions, ...requiredPermissions);
    if (!permitted) {
      return error(403, {
        message: 'Forbidden: Insufficient permissions',
        required: requiredPermissions,
      });
    }
  };
};
