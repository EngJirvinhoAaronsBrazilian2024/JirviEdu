const fs = require('fs');

let code = fs.readFileSync('src/lib/db.ts', 'utf8');

// Fix getDocs 'in' operator
code = code.replace(/if \(c\.op === '=='\) \{\s*q = q\.eq\(field, c\.val\);\s*\}/, 
`if (c.op === '==') {
          q = q.eq(field, c.val);
        } else if (c.op === 'in') {
          q = q.in(field, c.val);
        }`);

// Fix onSnapshot overlapping and interval
code = code.replace(/export function onSnapshot\(ref: any, callback: Function, errorCb\?: Function\) \{[\s\S]*?return \(\) => \{[\s\S]*?clearInterval\(intervalId\);[\s\S]*?unsubMutation\(\);[\s\S]*?\};\s*\}/,
`export function onSnapshot(ref: any, callback: Function, errorCb?: Function) {
  let isMounted = true;
  let lastData = '';
  let isFetching = false;
  let timeoutId: any;

  const fetchData = async () => {
    if (isFetching || !isMounted) return;
    isFetching = true;
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
    } finally {
      isFetching = false;
      if (isMounted) {
        timeoutId = setTimeout(fetchData, 7500); // Wait 7.5s before polling again to reduce load
      }
    }
  };

  fetchData();
  const unsubMutation = mutationEmitter.subscribe(() => {
    if (!isFetching) {
      clearTimeout(timeoutId);
      fetchData();
    }
  });

  return () => {
    isMounted = false;
    clearTimeout(timeoutId);
    unsubMutation();
  };
}`);

fs.writeFileSync('src/lib/db.ts', code);
