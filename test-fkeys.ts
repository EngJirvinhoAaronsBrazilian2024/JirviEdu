import { createClient } from '@insforge/sdk';
const insforge = createClient({ baseUrl: 'https://dnvge49s.us-east.insforge.app', anonKey: 'ik_078fa78d509356ffac38213b73827624' });

async function query() {
  const { data, error } = await insforge.database.rpc('get_tables', {});
  console.log(error, data);
}
query();
