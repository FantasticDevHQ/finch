import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
export function git(cwd, ...args) {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', timeout: 30000 }).trim();
}
export function layout(cwd = process.cwd()) {
  const root = realpathSync(git(cwd, 'rev-parse', '--show-toplevel'));
  const common = resolve(root, git(root, 'rev-parse', '--git-common-dir'));
  return { root, common };
}
