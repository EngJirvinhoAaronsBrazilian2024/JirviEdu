const { createClient } = require('@insforge/sdk');
const insforge = createClient({ baseUrl: 'https://dnvge49s.us-east.insforge.app', anonKey: 'ik_078fa78d509356ffac38213b73827624' });
async function test() {
  const { data, error } = await insforge.database.from('students').select('*').limit(5);
  console.log("Students:", data, error);
}
test();
