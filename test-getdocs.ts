import { getDocs, collection, db } from './src/lib/db.ts';

getDocs(collection(db, 'students'))
  .then((d) => console.log(d.docs.map(x => x.data())))
  .catch(console.error);
