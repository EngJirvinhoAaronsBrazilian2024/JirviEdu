const envUrl = '/';
const insforgeUrl = envUrl === '/' ? 'https://dnvge49s.us-east.insforge.app' : envUrl.replace(/\/$/, '');
console.log(insforgeUrl);
