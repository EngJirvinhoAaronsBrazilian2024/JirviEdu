import fetch from 'node-fetch';

async function testUrl() {
  try {
    const res = await fetch('https://dnvge49s.us-east.insforge.app/database/v1/', {
      headers: {
        'apikey': 'ik_078fa78d509356ffac38213b73827624',
        'Authorization': 'Bearer ik_078fa78d509356ffac38213b73827624'
      }
    });
    console.log(res.status, await res.text().then(t => t.slice(0,500)));
  } catch (e) {
    console.log(e.message);
  }
}

testUrl();
