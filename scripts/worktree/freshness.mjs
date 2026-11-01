import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { git, layout } from './layout.mjs';
import { locked } from './lock.mjs';
function clean(root) {
  if (git(root, 'status', '--porcelain')) throw new Error(`Dirty checkout ${root}; commit or move changes yourself, then retry. No work was stashed.`);
}
function advance(root, commit) {
  clean(root);
  const head = git(root, 'rev-parse', 'HEAD');
  if (head === commit) return;
  try { git(root, 'merge-base', '--is-ancestor', commit, head); return; } catch {}
  try { git(root, 'merge-base', '--is-ancestor', head, commit); } catch {
    throw new Error(`Checkout ${root} diverges from fetched base. Reconcile commits manually; setup will not merge, reset or rebase.`);
  }
  git(root, 'merge', '--ff-only', commit);
}
export async function setup(cwd, target, branch, baseOverride) {
  const { root, common } = layout(cwd);
  return locked(join(common, 'finch-setup.lock'), async () => {
    clean(root);
    const base = baseOverride || process.env.FINCH_BASE_BRANCH || git(root, 'ls-remote', '--symref', 'origin', 'HEAD').match(/^ref: refs\/heads\/(\S+)\s+HEAD/m)?.[1];
    if (!base) throw new Error('Cannot discover origin default branch; set FINCH_BASE_BRANCH explicitly.');
    git(root, 'check-ref-format', `refs/heads/${base}`);
    try { git(root, 'fetch', '--no-tags', 'origin', `refs/heads/${base}`); } catch {
      throw new Error(`Fetching origin/${base} failed; setup refuses stale base state.`);
    }
    const commit = git(root, 'rev-parse', 'FETCH_HEAD');
    // Advance the selected local base only when it is safely fast-forwardable.
    const entries = git(root, 'worktree', 'list', '--porcelain').split('\n\n');
    const baseEntry = entries.find(entry => entry.includes(`branch refs/heads/${base}\n`) || entry.endsWith(`branch refs/heads/${base}`));
    if (baseEntry) advance(baseEntry.match(/^worktree (.+)/m)[1], commit);
    else {
      let previous;
      try { previous = git(root, 'rev-parse', '--verify', `refs/heads/${base}`); } catch {}
      if (previous) {
        try { git(root, 'merge-base', '--is-ancestor', previous, commit); }
        catch { throw new Error(`Local ${base} is ahead or divergent; reconcile it manually.`); }
        git(root, 'update-ref', `refs/heads/${base}`, commit, previous);
      }
    }
    if (target) {
      const destination = resolve(root, target);
      if (existsSync(destination)) {
        if (layout(destination).root !== destination || layout(destination).common !== common) throw new Error('Target must be a registered sibling worktree.');
        advance(destination, commit);
      } else {
        if (!branch) throw new Error('New worktree requires a branch argument.');
        git(root, 'worktree', 'add', '-b', branch, destination, commit);
      }
      return destination;
    }
    advance(root, commit);
    return root;
  });
}
