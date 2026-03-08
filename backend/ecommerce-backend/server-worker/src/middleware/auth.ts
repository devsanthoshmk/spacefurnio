import { jwtVerify } from 'jose';
import { loadPublicKey } from '../utils/jwks';
import { error, IRequest } from 'itty-router';
import { Env } from '../types';

export type AuthRequest = IRequest & { user?: any };

export async function getUserFromRequest(request: AuthRequest, env: Env): Promise<{ id: string; email: string; role: string } | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const publicKey = await loadPublicKey(env.RSA_PUBLIC_KEY_PEM);
    const { payload } = await jwtVerify(token, publicKey, { algorithms: ['RS256'] });
    return {
      id: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string
    };
  } catch (e) {
    return null;
  }
}

export const authenticate = async (request: AuthRequest, env: any) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return error(401, 'Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
        const publicKey = await loadPublicKey(env.RSA_PUBLIC_KEY_PEM);
        const { payload } = await jwtVerify(token, publicKey, { algorithms: ['RS256'] });
        request.user = payload;
    } catch (e) {
        return error(401, 'Invalid or expired token');
    }
};

export const requireRole = (role: string) => {
    return (request: AuthRequest) => {
        if (!request.user) {
            return error(401, 'Unauthorized');
        }

        if (request.user.role !== role && request.user.role !== 'admin') {
            return error(403, 'Forbidden: Insufficient privileges');
        }
    };
};
