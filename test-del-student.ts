import { createClient } from '@insforge/sdk';
const insforge = createClient({ baseUrl: 'https://dnvge49s.us-east.insforge.app', anonKey: 'ik_078fa78d509356ffac38213b73827624' });

async function run() {
  const { data: students } = await insforge.database.from('students').select('*').limit(1);
  if (!students || students.length === 0) return console.log('no students');
  const id = students[0].id;
  const { error } = await insforge.database.from('students').delete().eq('id', id);
  console.log("Error:", error);
}
run();
