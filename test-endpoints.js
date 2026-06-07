import fetch from 'node-fetch';

async function testUrl(url) {
  try {
    const res = await fetch(url + '?select=*', {
      headers: {
        'apikey': 'ik_078fa78d509356ffac38213b73827624',
        'Authorization': 'Bearer ik_078fa78d509356ffac38213b73827624'
      }
    });
    console.log(url, res.status, await res.text().then(t => t.slice(0,100)));
  } catch (e) {
    console.log(url, e.message);
  }
}

async function main() {
  const base = 'https://dnvge49s.us-east.insforge.app';
  await testUrl(base + '/rest/v1/students');
  await testUrl(base + '/api/rest/v1/students');
  await testUrl(base + '/api/pg/students');
  await testUrl(base + '/api/v1/students');
  await testUrl(base + '/pg/students');
  await testUrl(base + '/db/v1/students');
  await testUrl(base + '/database/v1/students');
}

main();
