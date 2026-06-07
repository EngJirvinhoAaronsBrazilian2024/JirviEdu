import fetch from 'node-fetch';
async function test() {
  const res = await fetch('https://dnvge49s.us-east.insforge.app/');
  console.log(await res.text());
}
test();
