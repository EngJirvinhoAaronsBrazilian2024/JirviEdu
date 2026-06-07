import { createClient } from '@insforge/sdk';
const insforge = createClient({ baseUrl: 'https://dnvge49s.us-east.insforge.app', anonKey: 'ik_078fa78d509356ffac38213b73827624' });

insforge.database.from('students').insert({ reg_number: '1', full_name: '2', email: '3', course: '4', status: 'active' }).then(x => console.dir(x, {depth: null}));
