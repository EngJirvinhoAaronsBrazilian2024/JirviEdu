import fetch from 'node-fetch';

async function testUrl() {
  try {
    const headers = {
      'apikey': 'ik_078fa78d509356ffac38213b73827624',
      'Authorization': 'Bearer ik_078fa78d509356ffac38213b73827624',
      'Content-Type': 'application/json'
    };
    const res = await fetch('https://dnvge49s.us-east.insforge.app/api/storage/buckets', {
      method: 'POST',
      headers,
      body: JSON.stringify({ bucketName: 'files', isPublic: true })
    });
    console.log(res.status, await res.text().then(t => t.slice(0,500)));
  } catch (e) {
    console.log(e.message);
  }
}

testUrl();
