const { sql: neonSql } = require('./server/utils/db');
async function test() {
  const result = await neonSql`SELECT 1 as x`;
  console.log(result);
}
test();
