import { config } from 'dotenv';
config();
import { setDoc, doc, collection, addDoc, getDocs } from './src/lib/db';
import { insforge } from './src/lib/supabase';

async function test() {
  try {
    const modules = await getDocs({ type: 'collection', path: 'modules', conditions: {} });
    console.log("Modules:", modules.docs.length);

    await setDoc({ type: 'doc', path: 'teachers/tea_123' }, {
      fullName: 'Test Teacher',
      email: 'test@example.com',
      assignedModules: ['mod1', 'mod2']
    });
    console.log("Teacher set!");

    const res = await insforge.database.from('teachers').select('*').eq('id', 'tea_123').single();
    console.log("Saved DB:", res.data);
  } catch (e) {
    console.error(e);
  }
}
test();
