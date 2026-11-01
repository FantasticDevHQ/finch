import { lifecycle } from './lifecycle.mjs';
try { await lifecycle('stop'); }
catch (error) { console.error(error.message); process.exitCode = 1; }
