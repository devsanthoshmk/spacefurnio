import { AutoRouter, error } from 'itty-router';
import { getDb } from '../utils/db';
import { Env } from '../types';

export const engagementRouter = AutoRouter<any, [env: Env, ctx: ExecutionContext]>({ base: '/api' });

// Subscribe to newsletter
engagementRouter.post('/newsletter/subscribe', async (request, env) => {
    try {
        const body = await request.json() as any;
        const { email } = body;

        if (!email || !email.includes('@')) {
            return error(400, { message: 'Valid email address is required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const { sql } = getDb(env);

        await sql`
            INSERT INTO newsletter_subscribers (email, is_active)
            VALUES (${normalizedEmail}, true)
            ON CONFLICT (email) DO UPDATE SET is_active = true
        `;

        return { success: true, message: 'Successfully subscribed to newsletter' };
    } catch (e: any) {
        console.error('Failed to subscribe newsletter:', e);
        return error(500, { message: 'Failed to subscribe to newsletter' });
    }
});

// Contact message submission
engagementRouter.post('/contact', async (request, env) => {
    try {
        const body = await request.json() as any;
        const { name, email, subject, message } = body;

        if (!name || !email || !message) {
            return error(400, { message: 'Name, email, and message are required' });
        }

        const { sql } = getDb(env);

        await sql`
            INSERT INTO contact_messages (name, email, subject, message)
            VALUES (${name.trim()}, ${email.trim().toLowerCase()}, ${subject ? subject.trim() : null}, ${message.trim()})
        `;

        return { success: true, message: 'Your message has been received. We will get back to you shortly.' };
    } catch (e: any) {
        console.error('Failed to submit contact message:', e);
        return error(500, { message: 'Failed to submit contact message' });
    }
});
