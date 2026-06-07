import { createClient } from '@insforge/sdk';
const insforge = createClient({ baseUrl: 'https://dnvge49s.us-east.insforge.app', anonKey: 'ik_078fa78d509356ffac38213b73827624' });

async function check() {
  const tables = ['students', 'modules', 'materials', 'assignments', 'lectures', 'enrollments', 'submissions'];
  for (const t of tables) {
    const { data, error } = await insforge.database.from(t).select('*').limit(1);
    if (error) {
      console.log(t, 'error', error.message);
    } else {
      console.log(t, Object.keys(data[0] || {}));
    }
  }
}
check();
