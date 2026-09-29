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
});
