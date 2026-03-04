import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const vars = readFileSync('.dev.vars', 'utf-8');
const lines = vars.split('\n');
const dict = {};
for (const line of lines) {
    if (line.includes('=')) {
        const key = line.split('=')[0];
        const val = line.substring(key.length + 1).replace(/^"/, '').replace(/"$/, '');
        dict[key] = val;
    }
}

for (const key of ['DATABASE_URL', 'RSA_PRIVATE_KEY_PEM', 'RSA_PUBLIC_KEY_PEM', 'JWT_SECRET']) {
    if (dict[key]) {
        console.log(`Setting ${key}...`);
        execSync(`./node_modules/.bin/wrangler secret put ${key}`, { input: dict[key], stdio: ['pipe', 'inherit', 'inherit'] });
    }
}
