import { createClient } from '@insforge/sdk';
const insforge = createClient({ baseUrl: 'https://dnvge49s.us-east.insforge.app', anonKey: 'ik_078fa78d509356ffac38213b73827624' });
async function test() {
  const { data, error } = await insforge.database.from('student_passwords').upsert({ id: '2214cd81-9ecc-48f5-906f-1d6a12531241', password_hash: 'test' });
  console.log("Upsert result:", data, error);
}
test();
