import { createClient } from '@insforge/sdk';
const insforge = createClient({ baseUrl: 'https://dnvge49s.us-east.insforge.app', anonKey: 'ik_078fa78d509356ffac38213b73827624' });

async function insert() {
    const { data: d2, error: e2 } = await insforge.database.from('learning_materials').insert({
      id: crypto.randomUUID(),
      title: 'Test Material'
    });
    console.log('error structure:', e2);
}
insert();
