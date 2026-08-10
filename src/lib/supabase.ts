import { createClient } from '@insforge/sdk';

const env = (typeof process !== 'undefined' && process.env) || (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

const envUrl = env.VITE_INSFORGE_URL || 'https://dnvge49s.us-east.insforge.app';
const insforgeUrl = envUrl.replace(/\/$/, '');
const insforgeKey = env.VITE_INSFORGE_ANON_KEY || 'ik_078fa78d509356ffac38213b73827624';

export const insforge = createClient({ baseUrl: insforgeUrl, anonKey: insforgeKey });

