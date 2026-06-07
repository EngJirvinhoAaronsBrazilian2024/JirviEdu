import { createClient } from '@insforge/sdk';
const insforge = createClient({ baseUrl: 'https://dnvge49s.us-east.insforge.app', anonKey: 'ik_078fa78d509356ffac38213b73827624' });

async function insert() {
  const { data: d1, error: e1 } = await insforge.database.from('modules').select('id').limit(1);
  if (d1 && d1.length > 0) {
    const moduleId = d1[0].id;
    const { data: d2, error: e2 } = await insforge.database.from('learning_materials').insert({
      id: crypto.randomUUID(),
      module_id: moduleId,
      title: 'Test Material'
    });
    console.log('learning_materials error:', e2);
  }
}
insert();
