import fetch from 'node-fetch';

async function checkSchema() {
  const headers = {
    'apikey': 'ik_078fa78d509356ffac38213b73827624',
    'Authorization': 'Bearer ik_078fa78d509356ffac38213b73827624'
  };

  const res = await fetch('https://dnvge49s.us-east.insforge.app/rest/v1/', { headers });
  console.log(res.status); // 404 from earlier?

  // But we found that insforge.database... uses baseUrl straight.
  // meaning: http://localhost:7130 or something?
  // earlier we saw:
  // baseUrl is http://localhost:7130 when not configured properly?
  // wait! we set baseUrl to 'https://dnvge49s.us-east.insforge.app'
  // inside the client, postgrest is initialized.
}
checkSchema();
