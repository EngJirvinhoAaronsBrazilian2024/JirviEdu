import { setDoc, doc, db } from './src/lib/db.ts';

const uid = crypto.randomUUID();
setDoc(doc(db, 'students', uid), {
  regNumber: 'REGXYZ',
  fullName: 'John Doe',
  email: 'johndoe@student.jirvi.edu',
  course: 'Computer Science',
  status: 'active',
  createdAt: Date.now()
}).then(() => console.log('success')).catch(console.error);

