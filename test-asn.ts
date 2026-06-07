import { createClient } from '@insforge/sdk';
const insforge = createClient({ baseUrl: 'https://dnvge49s.us-east.insforge.app', anonKey: 'ik_078fa78d509356ffac38213b73827624' });

async function run() {
  const { data, error } = await insforge.database.rpc('execute_sql', { sql: 'ALTER TABLE assignments ADD COLUMN IF NOT EXISTS start_time timestamptz;' });
  console.log("Alter Error:", error);
  console.log("Data:", data);
}
run();
