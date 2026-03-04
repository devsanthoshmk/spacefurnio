const postgres = require('postgres');
require('dotenv').config({ path: '.env' });
const client = postgres(process.env.DATABASE_URL);
client`NOTIFY pgrst, 'reload schema'`.then(() => { console.log("Reloaded cache"); client.end(); }).catch(console.error);
