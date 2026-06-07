import { createClient } from '@insforge/sdk';
const insforge = createClient({ baseUrl: 'https://dnvge49s.us-east.insforge.app', anonKey: 'ik_078fa78d509356ffac38213b73827624' });
import crypto from 'crypto';

async function check() {
  const { data, error } = await insforge.database.from('modules').insert({ id: crypto.randomUUID(), name: 'Test', code: crypto.randomUUID().slice(0,5), created_at: new Date().toISOString() });
  console.log('insert module:', error || data);
}
check();
