import { createClient } from '@insforge/sdk';
const insforge = createClient({ baseUrl: 'https://dnvge49s.us-east.insforge.app', anonKey: 'ik_078fa78d509356ffac38213b73827624' });

async function t() {
  const { data, error } = await insforge.storage.createBucket('files', { public: true });
  console.log('createBucket', error || data);
}
t();
