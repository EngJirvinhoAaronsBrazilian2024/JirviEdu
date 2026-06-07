import { createClient } from '@insforge/sdk';
const insforge = createClient({ baseUrl: 'https://dnvge49s.us-east.insforge.app', anonKey: 'ik_078fa78d509356ffac38213b73827624' });

async function check() {
  const { data, error } = await insforge.database.from('learning_materials').select('*').limit(1);
  if (error) console.log(error);
  else console.log('learning_materials columns:', Object.keys(data[0] || {}));
}
check();
