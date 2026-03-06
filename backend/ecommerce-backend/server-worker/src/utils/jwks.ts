import { importPKCS8, importSPKI, exportJWK, SignJWT, jwtVerify } from 'jose';

// In-memory cache for the isolate lifetime
let cachedPrivateKey: any = null;
let cachedPublicKey: any = null;
let cachedJwk: any = null;

export const loadPrivateKey = async (pem: string) => {
    if (cachedPrivateKey) return cachedPrivateKey;
    const unescapedPem = pem.replace(/\\n/g, '\n');
    cachedPrivateKey = await importPKCS8(unescapedPem, 'RS256');
    return cachedPrivateKey;
};

export const loadPublicKey = async (pem: string) => {
    if (cachedPublicKey) return cachedPublicKey;
    const unescapedPem = pem.replace(/\\n/g, '\n');
    cachedPublicKey = await importSPKI(unescapedPem, 'RS256', { extractable: true });
    return cachedPublicKey;
};

export const getJwks = async (publicKeyPem: string) => {
    if (cachedJwk) {
        return { keys: [cachedJwk] };
    }

    try {
        const pubKey = await loadPublicKey(publicKeyPem);
        const fullJwk = await exportJWK(pubKey);

        cachedJwk = {
            kty: fullJwk.kty,
            n: fullJwk.n,
            e: fullJwk.e,
            kid: 'neon-ecommerce-key-1',
            use: 'sig',
            alg: 'RS256'
        };

        return { keys: [cachedJwk] };
    } catch (e: any) {
        console.error('Failed to load public key', e.message);
        throw new Error('Failed to load public key: ' + e.message);
    }
};

export const generateToken = async (user: any, privateKeyPem: string) => {
    const privateKey = await loadPrivateKey(privateKeyPem);

    const payload = {
        sub: user.id,
        email: user.email,
        role: user.role
    };

    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256', kid: 'neon-ecommerce-key-1' })
        .setExpirationTime('7d')
        .sign(privateKey);

    return token;
};

export const generateRefreshToken = async (userId: string, privateKeyPem: string) => {
    const privateKey = await loadPrivateKey(privateKeyPem);

    const payload = {
        sub: userId,
        type: 'refresh'
    };

    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256', kid: 'neon-ecommerce-key-1' })
        .setExpirationTime('30d')
        .setIssuedAt()
        .setJti(crypto.randomUUID())
        .sign(privateKey);

    return token;
};

export const verifyRefreshToken = async (token: string, publicKeyPem: string) => {
    const publicKey = await loadPublicKey(publicKeyPem);
    
    const { payload } = await jwtVerify(token, publicKey, {
        algorithms: ['RS256'],
    });

    if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
    }

    return payload;
};
