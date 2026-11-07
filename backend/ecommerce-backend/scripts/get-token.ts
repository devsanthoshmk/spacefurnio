import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';
import { SignJWT, importPKCS8 } from 'jose';

const devVarsPath = path.resolve(__dirname, '../server-worker/.dev.vars');
const devVarsRaw = fs.readFileSync(devVarsPath, 'utf8');
const devVars: Record<string, string> = {};
for (const line of devVarsRaw.split('\n')) {
  const match = line.match(/^([A-Z0-9_]+)=\"?(.*?)\"?$/);
  if (match) devVars[match[1]] = match[2].replace(/\\n/g, '\n');
}

async function run() {
  const sql = neon(devVars.DATABASE_URL);
  const users = await sql`
    SELECT u.id, u.email, u.is_active, ur.role_id 
    FROM users u 
    JOIN user_roles ur ON u.id = ur.user_id 
    WHERE ur.role_id IN ('super_admin', 'admin') AND u.is_active = true 
    LIMIT 1
  `;
  let user = users[0];
  if (!user) {
    console.log("No super_admin user found, creating one...");
    const [created] = await sql`
      INSERT INTO users (email, is_active, password_hash)
      VALUES ('admin@spacefurnio.com', true, 'test_hash')
      ON CONFLICT (email) DO UPDATE SET is_active = true
      RETURNING id, email
    `;
    await sql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES (${created.id}, 'super_admin')
      ON CONFLICT DO NOTHING
    `;
    user = { id: created.id, email: created.email, role_id: 'super_admin' };
  }

  const pk = await importPKCS8(devVars.RSA_PRIVATE_KEY_PEM, 'RS256');
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role_id || 'super_admin',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(pk);

  console.log('TOKEN:' + token);
}
run().catch(console.error);
