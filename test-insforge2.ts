import { createClient } from '@insforge/sdk';
const insforge = createClient({ baseUrl: 'https://dnvge49s.us-east.insforge.app', anonKey: 'ik_078fa78d509356ffac38213b73827624' });
console.log(Object.keys(insforge.realtime));
if (insforge.database.channel) {
  console.log("has database.channel");
}
