import { createClient } from '@insforge/sdk';
const insforge = createClient({ baseUrl: 'https://dnvge49s.us-east.insforge.app', anonKey: 'ik_078fa78d509356ffac38213b73827624' });

async function run() {
  const { data } = await insforge.database.from('lectures').select('*').limit(1);
  if (data && data[0]) console.log("Keys in lectures:", Object.keys(data[0]));
}
run();
