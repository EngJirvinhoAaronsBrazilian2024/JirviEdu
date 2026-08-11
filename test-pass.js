import { createClient } from '@insforge/sdk';
const insforge = createClient({ baseUrl: 'https://dnvge49s.us-east.insforge.app', anonKey: 'ik_078fa78d509356ffac38213b73827624' });
async function test() {
  const { data, error } = await insforge.database.from('student_passwords').select('*');
  console.log("Passwords:", data, error);
}
test();
