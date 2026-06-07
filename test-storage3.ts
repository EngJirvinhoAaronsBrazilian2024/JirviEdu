import { createClient } from '@insforge/sdk';
const insforge = createClient({ baseUrl: 'https://dnvge49s.us-east.insforge.app', anonKey: 'ik_078fa78d509356ffac38213b73827624' });

async function t() {
  const fileContent = 'hello world';
  const file = new Blob([fileContent], { type: 'text/plain' });
  const { data, error } = await insforge.storage.from('files').upload('test.txt', file as any, { upsert: true });
  console.log('upload', error || data);
}
t();
