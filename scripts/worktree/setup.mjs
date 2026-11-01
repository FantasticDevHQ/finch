import { setup } from './freshness.mjs';
try { console.log(await setup(process.cwd(), process.argv[2], process.argv[3])); }
catch (error) { console.error(error.message); process.exitCode = 1; }
