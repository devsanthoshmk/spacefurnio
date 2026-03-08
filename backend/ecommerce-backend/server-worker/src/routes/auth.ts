import { AutoRouter, error } from 'itty-router';
import { getJwks, generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwks';
import { getDb } from '../utils/db';
import { Env } from '../types';
import { hashPassword, verifyPassword } from '../utils/crypto';

export const authRouter = AutoRouter<any, [env: Env, ctx: ExecutionContext]>({ base: '/auth' });

authRouter.get('/.well-known/jwks.json', async (request, env) => {
    const jwks = await getJwks(env.RSA_PUBLIC_KEY_PEM);
    return jwks; // itty-router v5 auto-jsonifies
});

authRouter.post('/login', async (request, env) => {
    try {
        const body = await request.json() as any;
        const { email, password } = body;

        const { sql } = getDb(env);

        const result = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;

        if (result.length === 0) {
            // const temp = await sql`SELECT * FROM users`;
            // console.log("Invalid credentials", temp, { email, password, result })
            return error(401, { message: 'Invalid credentials' });
        }

        const user = result[0] as any;

        // Verify password hash
        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
            return error(401, { message: 'Invalid credentials' });
        }

        const rolesResult = await sql`SELECT * FROM user_roles WHERE user_id = ${user.id} LIMIT 1`;
        user.role = rolesResult.length > 0 ? (rolesResult[0] as any).role_id : 'authenticated';

        // Generate access token (7 days)
        const accessToken = await generateToken(user, env.RSA_PRIVATE_KEY_PEM);

        // Generate refresh token (30 days)
        const refreshToken = await generateRefreshToken(user.id, env.RSA_PRIVATE_KEY_PEM);

        // Store refresh token in user_sessions table
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await sql`
            INSERT INTO user_sessions (user_id, refresh_token, expires_at)
            VALUES (${user.id}, ${refreshToken}, ${expiresAt})
        `;

        // Return access token in body, set refresh token as httpOnly cookie
        return new Response(JSON.stringify({
            access_token: accessToken,
            user: { id: user.id, email: user.email, role: user.role }
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 60 * 60}`
            }
        });
    } catch (e) {
        console.error(e);
        return error(500, { message: 'Login failed' });
    }
});

authRouter.post('/register', async (request, env) => {
    try {
        const body = await request.json() as any;
        const { email, password, firstName, lastName } = body;

        const { sql } = getDb(env);

        // Check if user already exists
        const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
        if (existing.length > 0) {
            return error(409, { message: 'User already exists' });
        }

        // Hash the password
        const passwordHash = await hashPassword(password);

        // Insert new user
        const result = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${passwordHash})
      RETURNING id, email
    `;

        const user = result[0] as any;
        user.role = 'authenticated';

        // Create cart and wishlist for the new user
        await sql`INSERT INTO carts (user_id) VALUES (${user.id})`;
        await sql`INSERT INTO wishlists (user_id) VALUES (${user.id})`;

        // Generate access token (7 days)
        const accessToken = await generateToken(user, env.RSA_PRIVATE_KEY_PEM);

        // Generate refresh token (30 days)
        const refreshToken = await generateRefreshToken(user.id, env.RSA_PRIVATE_KEY_PEM);

        // Store refresh token in user_sessions table
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await sql`
            INSERT INTO user_sessions (user_id, refresh_token, expires_at)
            VALUES (${user.id}, ${refreshToken}, ${expiresAt})
        `;

        // Return access token in body, set refresh token as httpOnly cookie
        return new Response(JSON.stringify({
            message: 'Registration successful',
            access_token: accessToken,
            user
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 60 * 60}`
            }
        });
    } catch (e) {
        console.error(e);
        return error(500, { message: 'Registration failed' });
    }
});

authRouter.post('/refresh', async (request, env) => {
    try {
        // Read refresh token from cookie
        const cookieHeader = request.headers.get('Cookie') || request.headers.get('cookie');
        let refreshToken = null;

        if (cookieHeader) {
            const cookies = cookieHeader.split(';').map((c: string) => c.trim());
            for (const cookie of cookies) {
                if (cookie.startsWith('refresh_token=')) {
                    refreshToken = cookie.substring('refresh_token='.length);
                    break;
                }
            }
        }

        // Also accept in body for programmatic refresh
        if (!refreshToken) {
            const body = await request.json() as any;
            refreshToken = body.refresh_token;
        }

        if (!refreshToken) {
            return error(400, { message: 'Refresh token required' });
        }

        // Verify the refresh token
        let payload;
        try {
            payload = await verifyRefreshToken(refreshToken, env.RSA_PUBLIC_KEY_PEM);
        } catch (e) {
            return error(401, { message: 'Invalid or expired refresh token' });
        }

        const { sql } = getDb(env);

        // Check if refresh token exists in database and is not expired
        const sessionResult = await sql`
            SELECT us.*, u.email, ur.role_id as role
            FROM user_sessions us
            JOIN users u ON us.user_id = u.id
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            WHERE us.refresh_token = ${refreshToken}
            AND us.expires_at > NOW()
            LIMIT 1
        `;

        if (sessionResult.length === 0) {
            return error(401, { message: 'Invalid or expired refresh token' });
        }

        const session = sessionResult[0] as any;
        const user = {
            id: session.user_id,
            email: session.email,
            role: session.role || 'authenticated'
        };

        // Generate new access token
        const accessToken = await generateToken(user, env.RSA_PRIVATE_KEY_PEM);

        // Return new access token with refreshed cookie
        return new Response(JSON.stringify({ access_token: accessToken }), {
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 60 * 60}`
            }
        });
    } catch (e) {
        console.error(e);
        return error(500, { message: 'Token refresh failed' });
    }
});

authRouter.post('/logout', async (request, env) => {
    try {
        // Read refresh token from cookie
        const cookieHeader = request.headers.get('Cookie') || request.headers.get('cookie');
        let refreshToken = null;

        if (cookieHeader) {
            const cookies = cookieHeader.split(';').map((c: string) => c.trim());
            for (const cookie of cookies) {
                if (cookie.startsWith('refresh_token=')) {
                    refreshToken = cookie.substring('refresh_token='.length);
                    break;
                }
            }
        }

        const { sql } = getDb(env);

        if (refreshToken) {
            // Revoke refresh token
            await sql`DELETE FROM user_sessions WHERE refresh_token = ${refreshToken}`;
        }

        // Return with cookie deletion
        return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': 'refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
            }
        });
    } catch (e) {
        console.error(e);
        return error(500, { message: 'Logout failed' });
    }
});
