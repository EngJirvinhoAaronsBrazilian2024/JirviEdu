import { createClient } from '@insforge/sdk';
const insforgeUrl = 'https://dnvge49s.us-east.insforge.app';
const insforgeKey = 'ik_078fa78d509356ffac38213b73827624';
const insforge = createClient({ baseUrl: insforgeUrl, anonKey: insforgeKey });

async function test() {
  const { data, error } = await insforge.database.rpc('get_tables', {}); // if it exists
  console.log('rpc:', error ? error.message : data);
  // or query pg_stat_user_tables or information_schema?
}
test();
