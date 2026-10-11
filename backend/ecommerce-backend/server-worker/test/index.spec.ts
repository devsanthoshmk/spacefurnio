import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

describe('Worker API and Assets', () => {
	it('responds with health check JSON', async () => {
		const response = await SELF.fetch('https://example.com/health');
		expect(response.status).toBe(200);
		const data = await response.json() as { status: string };
		expect(data.status).toBe('ok');
	});

	it('serves static assets on root /', async () => {
		const response = await SELF.fetch('https://example.com/');
		expect(response.status).toBe(200);
		const html = await response.text();
		expect(html).toContain('Spacefurnio');
	});

	it('handles CORS preflight OPTIONS request with matching origin and credentials', async () => {
		const response = await SELF.fetch('https://example.com/auth/login', {
			method: 'OPTIONS',
			headers: {
				'Origin': 'http://localhost:5173',
				'Access-Control-Request-Method': 'POST',
				'Access-Control-Request-Headers': 'Content-Type, Authorization, x-session-id',
			},
		});
		expect(response.status).toBe(204);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
		expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
		expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
	});

	it('returns CORS headers reflecting origin and allow-credentials on POST requests', async () => {
		const response = await SELF.fetch('https://example.com/auth/login', {
			method: 'POST',
			headers: {
				'Origin': 'http://localhost:5173',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ email: 'nonexistent@store.com', password: 'password123' }),
		});
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
		expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
	});
});
