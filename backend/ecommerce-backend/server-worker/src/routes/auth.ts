import { AutoRouter, error } from 'itty-router';
import { getJwks, generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwks';
import { getDb } from '../utils/db';
import { Env } from '../types';
import { hashPassword, verifyPassword } from '../utils/crypto';

export const authRouter = AutoRouter<any, [env: Env, ctx: ExecutionContext]>({ base: '/auth' });

import { Resend } from 'resend';

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

authRouter.post('/forgot-password', async (request, env) => {
    try {
        const body = await request.json() as any;
        const { email } = body;

        const { sql } = getDb(env);

        const result = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
        if (result.length === 0) {
            return error(404, { message: 'User with this email not found.' });
        }
        const user = result[0] as any;

        const token = crypto.randomUUID(); // simple unique token
        // Also a 6 digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

        // Store both token and code separated by colon, or store the code and send both
        const combinedToken = `${token}:${code}`;

        await sql`
            CREATE TABLE IF NOT EXISTS password_resets (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
        `;

        await sql`
            INSERT INTO password_resets (user_id, token, expires_at)
            VALUES (${user.id}, ${combinedToken}, ${expiresAt})
        `;

        // Wait for resend to finish or handle quietly
        if (!env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY is missing');
            return error(500, { message: 'Email service is not configured.' });
        }

        const resend = new Resend(env.RESEND_API_KEY);
        // Replace with your actual frontend URL later, or read from request headers
        const origin = request.headers.get('origin') || 'http://localhost:5173';
        const resetLink = `${origin}/?login=true&reset=true&token=${token}&email=${encodeURIComponent(email)}`;

        const { error: sendError } = await resend.emails.send({
            from: 'Spacefurnio <noreply@spacefurnio.in>',
            to: email,
            subject: 'Password Reset Request',
            html: `
                <p>You requested a password reset.</p>
                <p>Click the link below to reset your password:</p>
                <a href="${resetLink}">Reset Password</a>
                <p>Or use this 6-digit code: <strong>${code}</strong> in the app.</p>
            `
        });

        if (sendError) {
            console.error('Email send error:', sendError);
            return error(500, { message: `Email failed to send: ${sendError.message}` });
        }

        return new Response(JSON.stringify({ message: 'Password reset link sent to your email.' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        console.error(e);
        return error(500, { message: 'Failed to process forgot password' });
    }
});

authRouter.post('/reset-password', async (request, env) => {
    try {
        const body = await request.json() as any;
        const { email, tokenOrCode, newPassword } = body;

        if (!email || !tokenOrCode || !newPassword) {
            return error(400, { message: 'Invalid request payload' });
        }

        const { sql } = getDb(env);
        const result = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
        if (result.length === 0) {
            return error(400, { message: 'Invalid request' });
        }
        const user = result[0] as any;

        // Check if token/code exists for this user
        const resetResult = await sql`
            SELECT id, token FROM password_resets 
            WHERE user_id = ${user.id} AND expires_at > NOW()
            ORDER BY created_at DESC
        `;

        if (resetResult.length === 0) {
            return error(400, { message: 'Invalid or expired reset token' });
        }

        let validToken = false;
        let usedResetId = null;

        for (const row of resetResult as any[]) {
            const rowToken = String(row.token);
            const [storedToken, storedCode] = rowToken.split(':');
            if (storedToken === tokenOrCode || storedCode === tokenOrCode) {
                validToken = true;
                usedResetId = row.id;
                break;
            }
        }

        if (!validToken) {
            return error(400, { message: 'Invalid or expired reset token/code' });
        }

        const passwordHash = await hashPassword(newPassword);

        // Update user password
        await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${user.id}`;

        // Delete all reset tokens for this user
        await sql`DELETE FROM password_resets WHERE user_id = ${user.id}`;

        return new Response(JSON.stringify({ message: 'Password reset successfully' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        console.error(e);
        return error(500, { message: 'Failed to reset password' });
    }
});
