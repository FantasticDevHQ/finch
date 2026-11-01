import { mkdir, rm, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { layout } from './layout.mjs';
export async function lifecycle(command, cwd = process.cwd()) {
  const { root } = layout(cwd);
  const state = join(root, '.finch-worktree');
  try { if ((await lstat(state)).isSymbolicLink()) throw new Error('Refusing symlink worktree state'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (command === 'start') {
    await mkdir(state, { recursive: true });
    console.log('Finch is a foreground CLI: no server, port registry or background process is needed. Use bun src/index.ts --help.');
  } else if (command === 'cleanup') {
    if (!process.argv.includes('--yes')) throw new Error('Explicit cleanup requires --yes; deletes only checkout-local .finch-worktree state.');
    await rm(state, { recursive: true, force: true });
  } else if (!['stop', 'teardown'].includes(command)) throw new Error('Unknown lifecycle command');
  // No services to signal. Stop/teardown preserve data and never remove a checkout.
}
