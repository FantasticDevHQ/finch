import { lifecycle } from './lifecycle.mjs';
try { await lifecycle('teardown'); }
catch (error) { console.error(error.message); process.exitCode = 1; }
