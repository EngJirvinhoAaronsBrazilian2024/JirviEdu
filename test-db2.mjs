import { createClient } from '@insforge/sdk';
const insforge = createClient({ baseUrl: 'https://dnvge49s.us-east.insforge.app', anonKey: 'ik_078fa78d509356ffac38213b73827624' });

async function run() {
  console.log("Fetching with two values...");
  try {
    const res = await insforge.database.from('notifications').select('*').in('user_id', ['user_123', 'all']);
    console.log("Res:", res);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
