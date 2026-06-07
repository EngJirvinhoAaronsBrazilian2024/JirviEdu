import { insforge } from './src/lib/supabase';
import crypto from 'crypto';

async function testInsert() {
  const modId = crypto.randomUUID();
  console.log('Inserting module', modId);
  const { data: d1, error: e1 } = await insforge.database.from('modules').insert({ id: modId, name: 'Test', code: crypto.randomUUID().slice(0, 8) });
  console.log('modules', e1 || d1);

  if (!e1) {
    const matId = crypto.randomUUID();
    console.log('Inserting material', matId);
    const { data: d2, error: e2 } = await insforge.database.from('materials').insert({ id: matId, module_id: crypto.randomUUID(), title: 'Mat 1' });
    console.log('materials error message:', e2?.message);
    console.log('materials data:', d2);
    
    const { data: d3, error: e3 } = await insforge.database.from('assignments').insert({ id: crypto.randomUUID(), module_id: modId, title: 'Asn 1' });
    console.log('assignments', e3 || d3);
    
    const { data: d4, error: e4 } = await insforge.database.from('lectures').insert({ id: crypto.randomUUID(), module_id: modId, title: 'Lec 1' });
    console.log('lectures', e4 || d4);
    
    const { data: d5, error: e5 } = await insforge.database.from('students').insert({ id: crypto.randomUUID(), fullName: 'Student 1' });
    console.log('students', e5 || d5);
  }
}

testInsert();
