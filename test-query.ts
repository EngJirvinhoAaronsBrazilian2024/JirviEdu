import { config } from 'dotenv';
config();
import { getDocs } from './src/lib/db';
async function run() {
  const data = await getDocs({ type: 'collection', path: 'modules', conditions: {} });
  console.log("Empty:", data.empty);
  console.log("Docs count:", data.docs.length);
  if (data.docs.length > 0) {
    console.log("First doc name:", data.docs[0].data().name);
  }
}
run();
