import { test, expect } from 'vitest';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { hashes, sourceExclude, sha256 } from '../../scripts/evidence.mjs';

test('report generation refuses changed evidence instead of asserting a clean result', async () => {
  const id = `integrity-test-${randomUUID()}`;
  const directory = resolve('.local/assurance', id);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'output.txt'), 'original');
  const files = await hashes(resolve('.'), sourceExclude);
  const run = {
    id, created: new Date().toISOString(), domains: ['security'],
    source: { fingerprint: sha256(JSON.stringify(files)), files },
    checks: [], findings: [], gaps: [], artifactHashes: { 'output.txt': sha256('original') },
  };
  await writeFile(join(directory, 'manifest.json'), JSON.stringify(run));
  const invoke = () => spawnSync(process.execPath, ['scripts/assurance.mjs', 'report', '--run', id], { encoding: 'utf8' });
  expect(invoke().status).toBe(0);
  expect(await readFile(join(directory, 'report.html'), 'utf8')).toContain('Cybersecurity assurance report');
  await writeFile(join(directory, 'output.txt'), 'altered');
  const result = invoke();
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('Evidence integrity mismatch');
});

test('finding closure rejects an unrelated passing check', async () => {
  const id = `closure-test-${randomUUID()}`;
  const retestId = `retest-${randomUUID()}`;
  const files = await hashes(resolve('.'), sourceExclude);
  const source = { fingerprint: sha256(JSON.stringify(files)), files };
  for (const [runId, run] of [
    [id, { checks: [{ id: 'browser-security', status: 'fail' }], findings: [{ id: 'original-defect', check: 'browser-security', status: 'open' }] }],
    [retestId, { parent: id, checks: [{ id: 'verification', status: 'pass' }], findings: [] }],
  ]) {
    const directory = resolve('.local/assurance', runId);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'manifest.json'), JSON.stringify({ id: runId, created: new Date().toISOString(), domains: ['security'], source, gaps: [], artifactHashes: {}, ...run }));
  }
  const result = spawnSync(process.execPath, ['scripts/assurance.mjs', 'resolve', '--run', id, '--finding', 'original-defect', '--retest', retestId, '--check', 'verification', '--fix', 'Unrelated change'], { encoding: 'utf8' });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('original check');
  expect(JSON.parse(await readFile(resolve('.local/assurance', id, 'manifest.json'), 'utf8')).findings[0].status).toBe('open');
  const retestPath = resolve('.local/assurance', retestId, 'manifest.json');
  const retest = JSON.parse(await readFile(retestPath, 'utf8'));
  retest.checks.push({ id: 'browser-security', domain: 'security', scope: 'original reproduction', status: 'pass' });
  retest.checks.push({ id: 'tools', domain: 'shared', scope: 'readiness', status: 'pass' });
  await writeFile(retestPath, JSON.stringify(retest));
  const accepted = spawnSync(process.execPath, ['scripts/assurance.mjs', 'resolve', '--run', id, '--finding', 'original-defect', '--retest', retestId, '--check', 'browser-security', '--fix', 'Matching reproduction checked'], { encoding: 'utf8' });
  expect(accepted.stderr).toBe('');
  expect(accepted.status).toBe(0);
  const closed = JSON.parse(await readFile(resolve('.local/assurance', id, 'manifest.json'), 'utf8')).findings[0];
  expect(closed.status).toBe('remediated');
  expect(closed.resolution.review).toContain('independent review not recorded');
});
