import { createClient } from '@insforge/sdk';
const insforge = createClient({ baseUrl: 'https://dnvge49s.us-east.insforge.app', anonKey: 'ik_078fa78d509356ffac38213b73827624' });
console.log(insforge.realtime.subscribe.toString());
console.log(insforge.realtime.on.toString());
