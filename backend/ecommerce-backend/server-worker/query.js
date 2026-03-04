const { Client } = require('pg');
const client = new Client("postgresql://neondb_owner:npg_Ym5wOHFU9NfB@ep-ancient-frog-aimehta7-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require");
client.connect()
  .then(() => client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public';"))
  .then(res => { console.log(res.rows); return client.end(); })
  .catch(console.error);
