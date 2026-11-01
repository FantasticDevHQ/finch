import { mkdir, rmdir } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
export async function locked(path, operation) {
  for (let attempt = 0; ; attempt++) {
    try { await mkdir(path); break; } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (attempt === 300) throw new Error(`Setup lock busy: ${path}. Check its owner before removing a stale lock.`);
      await setTimeout(100);
    }
  }
  try { return await operation(); } finally { await rmdir(path); }
}
