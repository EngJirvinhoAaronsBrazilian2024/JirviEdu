import { firestore } from './firebase';
import { doc as fbDoc, setDoc as fbSetDoc, getDoc as fbGetDoc } from 'firebase/firestore';
import { insforge } from './supabase'; // we'll rename insforge.ts to supabase.ts for standard naming
// MOCK FIREBASE API over InsForge
export const db = {};
export const storage = {};
export function collection(dbInstance: any, path: string) {
  return { type: 'collection', path };
}
export function doc(dbInstance: any, path: string, id?: string) {
  return { type: 'doc', path: id ? `${path}/${id}` : path };
}
export function query(collectionRef: any, ...constraints: any[]) {
  return { ...collectionRef, constraints };
}
export function where(field: string, op: string, val: any) {
  return { type: 'where', field, op, val };
}
function camelToSnake(obj: any) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  const newObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    if (typeof value === 'number' && (key.endsWith('At') || key === 'deadline')) {
      newObj[snakeKey] = new Date(value).toISOString();
    } else {
      newObj[snakeKey] = camelToSnake(value);
    }
  }
  return newObj;
}
function snakeToCamel(obj: any) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  const newObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/) && (camelKey.endsWith('At') || camelKey === 'deadline')) {
      newObj[camelKey] = new Date(value).getTime();
    } else {
      newObj[camelKey] = snakeToCamel(value);
    }
  }
  return newObj;
}
function parsePath(path: string) {
  const parts = path.split('/');
  const conditions: any = {};
  
  if (parts.length >= 5 && parts[4] === 'submissions') {
    conditions['module_id'] = parts[1];
    conditions['assignment_id'] = parts[3];
    return { table: 'submissions', docId: parts[5], conditions };
  }
  
  if (parts.length >= 3) {
    if (parts[2] === 'enrollments' || parts[2] === 'lectures' || parts[2] === 'assignments' || parts[2] === 'materials' || parts[2] === 'learningMaterials') {
      conditions['module_id'] = parts[1];
      const tableRaw = parts[2].replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      return { table: tableRaw, docId: parts[3], conditions };
    }
  }
  
  return { table: parts[0].replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`), docId: parts[1], conditions };
}
export async function getDoc(docRef: any) {
  const { table, docId, conditions } = parsePath(docRef.path);
  let idField = 'id';
  if (table === 'enrollments' || table === 'submissions') {
    idField = 'student_id';
  }
  let q: any = insforge.database.from(table).select('*').eq(idField, docId);
  for (const [k, v] of Object.entries(conditions)) {
    if (table === 'submissions' && k === 'module_id') continue;
    q = q.eq(k, v);
  }
  const { data, error } = await q.single();
  if (error || !data) {
    return { exists: () => false, data: () => null, id: docId };
  }
  let resultData = snakeToCamel(data);
  return { exists: () => true, data: () => resultData, id: docId };
}
export async function getDocs(queryRef: any) {
  const { table, conditions } = parsePath(queryRef.path);
  if (table === 'activity_logs') {
    let data = JSON.parse(localStorage.getItem('activity_logs') || '[]');
    if (data.length === 0) {
      data = [
        { id: '1', action: 'System Init', details: 'Activity logging subsystem initialized.', userId: 'system', userType: 'system', createdAt: Date.now() - 3600000 },
        { id: '2', action: 'Admin Action', details: 'System checks completed.', userId: 'admin', userType: 'admin', createdAt: Date.now() - 1800000 }
      ];
      localStorage.setItem('activity_logs', JSON.stringify(data));
    }
    return {
      empty: data.length === 0,
      docs: data.map((d: any) => ({
        id: d.id,
        data: () => d
      }))
    };
  }
  let q: any = insforge.database.from(table).select('*');
  for (const [k, v] of Object.entries(conditions)) {
    if (table === 'submissions' && k === 'module_id') continue;
    q = q.eq(k, v);
  }
  if (queryRef.constraints) {
    for (const c of queryRef.constraints) {
      if (c.type === 'where') {
        const field = c.field.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`);
        if (c.op === '==') {
          q = q.eq(field, c.val);
        }
      }
    }
  }
  const { data, error } = await q;
  if (error) throw error;
  return {
    empty: data.length === 0,
    docs: data.map((d: any) => {
      let resultData = snakeToCamel(d);
      return {
        id: d.id || d.student_id, // fallback for enrollments/submissions
        data: () => resultData
      };
    })
  };
}
class LocalEmitter {
  listeners: Set<Function> = new Set();
  emit() {
    this.listeners.forEach(fn => fn());
  }
  subscribe(fn: Function) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}
export const mutationEmitter = new LocalEmitter();
export async function setDoc(docRef: any, data: any, options: { merge?: boolean } = {}) {
  const { table, docId, conditions } = parsePath(docRef.path);
  let d = { ...data };
  if (table === 'students') {
    if ('password' in d) {
      if (d.password) {
        try { await fbSetDoc(fbDoc(firestore, 'student_passwords', docId), { passwordHash: d.password }); } catch (e) { console.warn('fb offline', e); }
      }
      delete d.password;
    }
  }
  let payload = camelToSnake({ ...d, ...conditions });
  if (table === 'submissions') delete payload.module_id;
  if (table === 'enrollments' || table === 'submissions') {
    payload.student_id = docId;
    let queryObj: any = insforge.database.from(table).select('id').eq('student_id', docId);
    for (const [k, v] of Object.entries(conditions)) {
      queryObj = queryObj.eq(k, v);
    }
    const { data: existingData } = await queryObj.single();
    if (existingData && existingData.id) {
       payload.id = existingData.id;
    }
  } else {
    payload.id = docId;
  }
  if (options.merge) {
    const { error } = await insforge.database.from(table).upsert(payload);
    if (error) throw error;
  } else {
    const { error } = await insforge.database.from(table).upsert(payload);
    if (error) throw error;
  }
  mutationEmitter.emit();
}
export async function updateDoc(docRef: any, data: any) {
  const { table, docId, conditions } = parsePath(docRef.path);
  let d = { ...data };
  if (table === 'students') {
    if ('password' in d) {
      if (d.password) {
        try { await fbSetDoc(fbDoc(firestore, 'student_passwords', docId), { passwordHash: d.password }); } catch (e) { console.warn('fb offline', e); }
      }
      delete d.password;
    }
  }
  let q: any = insforge.database.from(table).update(camelToSnake(d));
  if (table === 'enrollments' || table === 'submissions') {
    q = q.eq('student_id', docId);
  } else {
    q = q.eq('id', docId);
  }
  for (const [k, v] of Object.entries(conditions)) {
    if (table === 'submissions' && k === 'module_id') continue;
    q = q.eq(k, v);
  }
  const { error } = await q;
  if (error) throw error;
  mutationEmitter.emit();
}
export async function deleteDoc(docRef: any) {
  const { table, docId, conditions } = parsePath(docRef.path);
  let q: any = insforge.database.from(table).delete();
  if (table === 'enrollments' || table === 'submissions') {
    q = q.eq('student_id', docId);
  } else {
    q = q.eq('id', docId);
  }
  for (const [k, v] of Object.entries(conditions)) {
    if (table === 'submissions' && k === 'module_id') continue;
    q = q.eq(k, v);
  }
  const { error } = await q;
  if (error) throw error;
  mutationEmitter.emit();
}
export async function addDoc(collectionRef: any, data: any) {
  const { table } = parsePath(collectionRef.path);
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  const payload = camelToSnake({ id, ...data });
  if (table === 'activity_logs') {
    const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
    logs.push(data); // store raw object in localstorage
    data.id = id;
    localStorage.setItem('activity_logs', JSON.stringify(logs));
    mutationEmitter.emit();
    return { id };
  }
  const { error } = await insforge.database.from(table).insert([payload]);
  if (error) throw error;
  mutationEmitter.emit();
  return { id };
}
export function onSnapshot(ref: any, callback: Function, errorCb?: Function) {
  let isMounted = true;
  let lastData = '';
  const fetchData = async () => {
    try {
      let snap;
      if (ref.type === 'doc') {
        snap = await getDoc(ref);
      } else {
        snap = await getDocs(ref);
      }
      if (!isMounted) return;
      const extractedData = ref.type === 'doc' ? snap.data() : snap.docs.map((d: any) => d.data());
      const newData = JSON.stringify(extractedData);
      if (newData !== lastData) {
        lastData = newData;
        callback(snap);
      }
    } catch (err) {
      if (isMounted && errorCb) errorCb(err);
    }
  };
  fetchData();
  const intervalId = setInterval(fetchData, 3000);
  const unsubMutation = mutationEmitter.subscribe(fetchData);
  return () => {
    isMounted = false;
    clearInterval(intervalId);
    unsubMutation();
  };
}
// Storage Mocks
export function ref(storageInstance: any, path: string) {
  return { path };
}
export async function uploadBytes(storageRef: any, file: File) {
  const { data, error } = await insforge.storage.from('files').upload(storageRef.path, file);
  if (error) throw error;
  return { ref: storageRef };
}
export async function getDownloadURL(storageRef: any) {
  const { data } = insforge.storage.from('files').getPublicUrl(storageRef.path);
  return data.publicUrl;
}
import { hash, compare } from 'bcrypt-ts';
export async function authenticateStudent(regNumber: string, passwordStr: string) {
  let q: any = insforge.database.from('students').select('*').eq('reg_number', regNumber);
  const { data } = await q.single();
  if (!data) return null;
  let resultData = snakeToCamel(data);
  try {
    const snap = await fbGetDoc(fbDoc(firestore, 'student_passwords', data.id));
    if (!snap.exists()) return null;
    const hashStr = snap.data()?.passwordHash;
    if (!hashStr) return null;
    let isValid = false;
    if (hashStr.startsWith('$2')) {
      isValid = await compare(passwordStr, hashStr);
    } else {
      isValid = hashStr === passwordStr;
    }
    if (!isValid) return null;
    return { id: data.id, data: () => resultData };
  } catch (error) {
    console.warn("Firebase offline auth failed:", error);
    return null;
  }
}
