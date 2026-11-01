import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { git } from './layout.mjs';
import { setup } from './freshness.mjs';
import { lifecycle } from './lifecycle.mjs';
test('freshness, local commits, dirty files, fetch failure, concurrent setup and sibling cleanup', async () => {
 const temp=mkdtempSync(join(tmpdir(),'finch-test-')); const remote=join(temp,'remote.git'), source=join(temp,'source'), caller=join(temp,'caller'), a=join(temp,'a'), b=join(temp,'b');
 try {
  git(temp,'init','--bare','--initial-branch=main',remote); git(temp,'clone',remote,source);
  git(source,'config','user.email','test@example.invalid'); git(source,'config','user.name','Test');
  writeFileSync(join(source,'file'),'one'); git(source,'add','.'); git(source,'commit','-m','one'); git(source,'push','origin','main'); git(temp,'clone',remote,caller); git(caller,'switch','-c','topic');
  await setup(caller,a,'a');
  writeFileSync(join(source,'file'),'two'); git(source,'commit','-am','two'); git(source,'push','origin','main'); const current=git(source,'rev-parse','HEAD');
  await Promise.all([setup(caller,a),setup(caller,b,'b')]);
  for(const dir of [a,b]) assert.equal(git(dir,'rev-parse','HEAD'),current);
  assert.equal(git(caller,'rev-parse','main'),current); assert.equal(git(caller,'branch','--show-current'),'topic');
  await setup(a); await setup(a);
  git(a,'config','user.email','test@example.invalid'); git(a,'config','user.name','Test'); writeFileSync(join(a,'local'),'keep'); git(a,'add','.'); git(a,'commit','-m','local'); const local=git(a,'rev-parse','HEAD'); await setup(a); assert.equal(git(a,'rev-parse','HEAD'),local);
  writeFileSync(join(source,'other'),'remote'); git(source,'add','.'); git(source,'commit','-m','remote'); git(source,'push','origin','main'); await assert.rejects(setup(a),/diverges/); assert.equal(git(a,'rev-parse','HEAD'),local);
  writeFileSync(join(b,'file'),'dirty'); await assert.rejects(setup(b),/Dirty/); assert.match(git(b,'diff'),/dirty/);
  git(caller,'remote','set-url','origin',join(temp,'missing')); await assert.rejects(setup(a,undefined,undefined,'main'),/Fetching.*failed/);
  await lifecycle('start',a); await lifecycle('start',b); await lifecycle('stop',a); await lifecycle('teardown',a); assert.ok(existsSync(join(a,'.finch-worktree')));
  process.argv.push('--yes'); try { await lifecycle('cleanup',a); await lifecycle('cleanup',a); } finally { process.argv.pop(); }
  assert.ok(existsSync(join(b,'.finch-worktree'))); assert.ok(existsSync(join(a,'local')));
 } finally { rmSync(temp,{recursive:true,force:true}); }
});
