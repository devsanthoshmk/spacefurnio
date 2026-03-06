/**
 * Security utilities for password hashing and verification using Web Crypto API.
 * Uses PBKDF2 with SHA-256 for production-grade security.
 */

const ITERATIONS = 100000;
const KEY_LEN = 32; // 256 bits
const SALT_LEN = 16; // 128 bits

/**
 * Hash a password using PBKDF2.
 * Returns a string in the format "salt:hash" (both hex encoded).
 */
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));

    // Import the password as a key
    const baseKey = await crypto.subtle.importKey(
        'raw',
        passwordData,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    // Derive the hash
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: ITERATIONS,
            hash: 'SHA-256'
        },
        baseKey,
        KEY_LEN * 8
    );

    const hash = new Uint8Array(derivedBits);

    // Convert to hex for storage
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    const hashHex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');

    return `${saltHex}:${hashHex}`;
}

/**
 * Verify a password against a stored hash.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [saltHex, originalHashHex] = storedHash.split(':');
    if (!saltHex || !originalHashHex) return false;

    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    const baseKey = await crypto.subtle.importKey(
        'raw',
        passwordData,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: ITERATIONS,
            hash: 'SHA-256'
        },
        baseKey,
        KEY_LEN * 8
    );

    const derivedHash = new Uint8Array(derivedBits);
    const derivedHashHex = Array.from(derivedHash).map(b => b.toString(16).padStart(2, '0')).join('');

    return derivedHashHex === originalHashHex;
}
