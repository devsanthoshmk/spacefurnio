const { db } = require('./server/utils/db');
const { sql } = require('drizzle-orm');
async function test() {
  const result = await db.execute(sql`SELECT 1 as x`);
  console.log('Result type:', typeof result);
  console.log('Result keys:', Object.keys(result));
  console.log('Result.rows:', result.rows);
  console.log('Result array?:', Array.isArray(result));
  console.log(result);
}
test();
