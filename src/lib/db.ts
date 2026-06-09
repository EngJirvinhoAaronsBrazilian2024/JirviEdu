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

// Helper to convert object keys from camelCase to snake_case
function camelToSnake(obj: any): any {
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      let val = obj[key];
      // Convert timestamps to ISO string
      if (typeof val === 'number' && val > 1000000000000 && (key.endsWith('At') || key === 'deadline' || key === 'startTime')) {
        val = new Date(val).toISOString();
      }
      acc[snakeKey] = camelToSnake(val);
      return acc;
    }, {} as any);
  }
  return obj;
}

// Helper to convert object keys from snake_case to camelCase
function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      let val = obj[key];
      // Convert ISO string back to timestamp
      if (typeof val === 'string' && (camelKey.endsWith('At') || camelKey === 'deadline' || camelKey === 'startTime')) {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          val = d.getTime();
        }
      }
      acc[camelKey] = snakeToCamel(val);
      return acc;
    }, {} as any);
  }
  return obj;
}
function parsePath(path: string) {
  const parts = path.split('/').filter(Boolean);
  // Convert table name from camel case to snake case (e.g. learningMaterials -> learning_materials)
  const camelTable = parts[parts.length - 1]; // e.g. "enrollments", "submissions", "students" or "123"
  const table = camelTable.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

  // If length is even, it's a doc reference, if odd it's a collection.
  
  const isDoc = parts.length % 2 === 0;
  const collectionName = isDoc ? parts[parts.length - 2] : parts[parts.length - 1];
  const docId = isDoc ? parts[parts.length - 1] : undefined;
  
  const conditions = {};
  if (parts.length >= 3) {
    // collection/id/collection (e.g. modules/123/enrollments)
    conditions['module_id'] = parts[1];
  }
  if (parts.length >= 5) {
    // modules/123/assignments/456/submissions
    conditions['assignment_id'] = parts[3];
  }

  return { table: collectionName.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`), docId, conditions };
}

export async function getDoc(docRef: any) {
  const { table, docId, conditions } = parsePath(docRef.path);
  
  let idField = 'id';
  if (table === 'enrollments' || table === 'submissions') {
    idField = 'student_id';
  }

  let q: any = insforge.database.from(table).select('*').eq(idField, docId);
  for (const [k, v] of Object.entries(conditions)) {
    q = q.eq(k, v);
  }
  
  const { data, error } = await q.single();
  
  if (error || !data) {
    return { exists: () => false, data: () => null, id: docId };
  }
  
  let resultData = snakeToCamel(data);
  if (table === 'students' && resultData.email && resultData.email.includes('|PASS|')) {
    const parts = resultData.email.split('|PASS|');
    resultData.email = parts[0];
    resultData.password = parts[1];
  }
  
  return { exists: () => true, data: () => resultData, id: docId };
}

export async function getDocs(queryRef: any) {
  const { table, conditions } = parsePath(queryRef.path);
  
  let q: any = insforge.database.from(table).select('*');
  for (const [k, v] of Object.entries(conditions)) {
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
      if (table === 'students' && resultData.email && resultData.email.includes('|PASS|')) {
        const parts = resultData.email.split('|PASS|');
        resultData.email = parts[0];
        resultData.password = parts[1];
      }
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
    if ('password' in d || 'email' in d) {
      let currentEmail = d.email;
      let currentPass = d.password;
      if (typeof currentEmail === 'undefined' || typeof currentPass === 'undefined' || currentPass === '') {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          if (typeof currentEmail === 'undefined') currentEmail = snap.data().email;
          if (typeof currentPass === 'undefined' || currentPass === '') currentPass = snap.data().password || '';
        }
      }
      currentEmail = currentEmail || '';
      currentPass = currentPass || '';
      d.email = currentPass ? `${currentEmail}|PASS|${currentPass}` : currentEmail;
      delete d.password;
    }
  }

  let payload = camelToSnake({ ...d, ...conditions });
  
  if (table === 'enrollments' || table === 'submissions') {
    payload.student_id = docId;
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
    if ('password' in d || 'email' in d) {
      let currentEmail = d.email;
      let currentPass = d.password;
      if (typeof currentEmail === 'undefined' || typeof currentPass === 'undefined' || currentPass === '') {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          if (typeof currentEmail === 'undefined') currentEmail = snap.data().email;
          if (typeof currentPass === 'undefined' || currentPass === '') currentPass = snap.data().password || '';
        }
      }
      currentEmail = currentEmail || '';
      currentPass = currentPass || '';
      d.email = currentPass ? `${currentEmail}|PASS|${currentPass}` : currentEmail;
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
  
  // Realtime wrapper logic:
  // We periodically poll every 3 seconds to catch updates from admins/other users.
  const intervalId = setInterval(fetchData, 3000);
  
  // Also instantly re-fetch upon any local mutation (set/update/delete)
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
  const publicUrl = insforge.storage.from('files').getPublicUrl(storageRef.path);
  return publicUrl;
}
