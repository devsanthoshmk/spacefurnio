import { AutoRouter, error } from 'itty-router';
import { getJwks, generateToken } from '../utils/jwks';
import { getDb } from '../utils/db';
import { Env } from '../types';

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
            return error(401, { message: 'Invalid credentials' });
        }

        const user = result[0] as any;

        // (Password verification would go here!)

        const rolesResult = await sql`SELECT * FROM user_roles WHERE user_id = ${user.id} LIMIT 1`;
        user.role = rolesResult.length > 0 ? (rolesResult[0] as any).role_id : 'customer';

        const token = await generateToken(user, env.RSA_PRIVATE_KEY_PEM);

        return { token, user: { id: user.id, email: user.email, role: user.role } };
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

        // Insert new user
        // (Password hashing would go here!)
        const result = await sql`
            INSERT INTO users (email, password_hash)
            VALUES (${email}, ${password})
            RETURNING id, email
        `;

        const user = result[0] as any;
        user.role = 'customer';

        const token = await generateToken(user, env.RSA_PRIVATE_KEY_PEM);

        return { message: 'Registration successful', token, user };
    } catch (e) {
        console.error(e);
        return error(500, { message: 'Registration failed' });
    }
});
