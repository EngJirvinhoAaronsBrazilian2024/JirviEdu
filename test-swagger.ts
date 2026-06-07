import fetch from 'node-fetch';
fetch('https://dnvge49s.us-east.insforge.app/rest/v1/students?select=*&limit=1', {headers: {apikey: 'ik_078fa78d509356ffac38213b73827624', Authorization: 'Bearer ik_078fa78d509356ffac38213b73827624'}})
  .then(async r => console.log(r.status, await r.text()))
  .catch(console.log);
