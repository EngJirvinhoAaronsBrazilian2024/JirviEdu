import { db, doc, setDoc } from './src/lib/db.ts';

async function test() {
  const id = 'd4c3b2a1-df3d-464a-8def-9a55b1e568b9'; 
  
  const newStudent = { regNumber: 'STU1', fullName: 'Test Student', email: 'test@student.jirvi.edu', course: 'CS', status: 'active', createdAt: Date.now() };
  
  console.log("Saving student...");
  try {
    await setDoc(doc(db, 'students', id), newStudent, { merge: true });
    console.log('Result: Success');
  } catch (e) {
    console.error('Error:', e);
  }
}
test().catch(console.error);
