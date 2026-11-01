import { lifecycle } from './lifecycle.mjs';
try { await lifecycle('start'); }
catch (error) { console.error(error.message); process.exitCode = 1; }
