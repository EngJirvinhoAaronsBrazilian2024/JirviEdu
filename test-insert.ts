import { createClient } from '@insforge/sdk';
const insforgeUrl = 'https://dnvge49s.us-east.insforge.app';
const insforgeKey = 'ik_078fa78d509356ffac38213b73827624';
const insforge = createClient({ baseUrl: insforgeUrl, anonKey: insforgeKey });

async function check() {
  const { data, error } = await insforge.database.from('modules').insert({ id: 'test', name: 'Test' });
  console.log('insert module:', error || data);
}

check();
