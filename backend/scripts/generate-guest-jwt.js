/**
 * ===========================================
 * Guest JWT Generator (RS256)
 * ===========================================
 * Generates a guest JWT signed with RS256 using the RSA private key.
 * The token has NO expiration (unlimited).
 *
 * Prerequisites:
 *   - JWT_PRIVATE_JWK must be set in .env (RSA private key in JWK format)
 *   - The public key (n, e) must match the key in public/backend/.well-known/jwks.json
 *
 * Usage:
 *   node scripts/generate-guest-jwt.js
 */

import * as jose from 'jose';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

/**
 * Load environment variables from .env file.
 * Handles both quoted and single-quoted values, including multi-line JSON.
 */
function loadEnv() {
    const envPath = join(ROOT, '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const vars = {};
    for (const line of envContent.split('\n')) {
        // Match KEY=VALUE with optional single or double quotes
        const match = line.match(/^(\w+)=(?:'([^']*)'|"([^"]*)"|(.+))$/);
        if (match) {
            vars[match[1]] = match[2] ?? match[3] ?? match[4];
        }
    }
    return vars;
}

async function generateGuestJWT() {
    const env = loadEnv();
    const privateJwkStr = env.JWT_PRIVATE_JWK;

    if (!privateJwkStr) {
        console.error('❌ JWT_PRIVATE_JWK not found in .env');
        console.error('   Add your RSA private JWK to .env as JWT_PRIVATE_JWK');
        process.exit(1);
    }

    // Parse the private JWK and import as CryptoKey
    const privateJwk = JSON.parse(privateJwkStr);
    const privateKey = await jose.importJWK(privateJwk, 'RS256');

    // Generate a random guest sub
    const guestId = `guest_${randomUUID().replace(/-/g, '').slice(0, 8)}`;

    const payload = {
        sub: guestId,
        role: 'anonymous',
    };

    // Build JWT with NO expiration, signed with RS256
    const token = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256', kid: privateJwk.kid })
        .setIssuedAt()
        .setIssuer('spacefurnio-api')
        .setAudience('spacefurnio-users')
        // No .setExpirationTime() → unlimited expiry
        .sign(privateKey);

    console.log('=== Guest JWT (RS256 · Unlimited Expiry) ===\n');
    console.log('Payload:');
    console.log(JSON.stringify(payload, null, 2));
    console.log(`\nIssuer   : spacefurnio-api`);
    console.log(`Audience : spacefurnio-users`);
    console.log(`Algorithm: RS256 (RSA SHA-256)`);
    console.log(`Expiry   : NONE (unlimited)\n`);
    console.log('─'.repeat(60));
    console.log('JWT Token:');
    console.log('─'.repeat(60));
    console.log(token);
    console.log('─'.repeat(60));
}

generateGuestJWT().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
