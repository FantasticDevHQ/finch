import { lifecycle } from './lifecycle.mjs';
try { await lifecycle('cleanup'); }
catch (error) { console.error(error.message); process.exitCode = 1; }
