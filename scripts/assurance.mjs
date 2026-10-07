import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { assessControls, renderReport } from './report.mjs';
import { hashes, sourceExclude, sha256, redact, escapeHtml } from './evidence.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const evidenceRoot = resolve(root, '.local/assurance');
const inputArgs = process.argv.slice(2);
const [mode = 'run', ...args] = inputArgs[0]?.startsWith('--') ? ['run', ...inputArgs] : inputArgs;
const option = (name, fallback) => args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : fallback;
const source = async () => {
  const files = await hashes(root, sourceExclude);
  return { fingerprint: sha256(JSON.stringify(files)), files };
};
function runPath(id) {
  if (!/^[a-zA-Z0-9-]+$/.test(id ?? '')) throw new Error('Invalid run ID.');
  return join(evidenceRoot, id);
}
const load = async id => JSON.parse(await readFile(join(runPath(id), 'manifest.json'), 'utf8'));
const save = async run => writeFile(join(runPath(run.id), 'manifest.json'), JSON.stringify(run, null, 2));

async function capture(command, argv, directory, env = {}) {
  await mkdir(directory, { recursive: true });
  const started = new Date().toISOString();
  let output = '', stdout = '', stderr = '', truncated = false, timedOut = false, launchError;
  const child = spawn(command, argv, { cwd: root, env: { ...process.env, ...env }, windowsHide: true, shell: false });
  for (const stream of [child.stdout, child.stderr]) {
    stream?.setEncoding('utf8');
    stream?.on('data', chunk => {
      if (output.length + chunk.length <= 2_000_000) { output += chunk; if (stream === child.stdout) stdout += chunk; else stderr += chunk; }
      else truncated = true;
    });
  }
  const timer = setTimeout(() => {
    timedOut = true;
    if (process.platform === 'win32' && child.pid) spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true });
    else child.kill('SIGTERM');
  }, 180_000);
  const code = await new Promise(resolveExit => {
    child.on('error', error => { launchError = error.message; });
    child.on('close', code => resolveExit(code));
  });
  clearTimeout(timer);
  await writeFile(join(directory, 'output.txt'), redact(output + (launchError ? `\n${launchError}` : '')));
  await writeFile(join(directory, 'stdout.txt'), redact(stdout));
  await writeFile(join(directory, 'stderr.txt'), redact(stderr));
  return { command: [command, ...argv], started, finished: new Date().toISOString(), exitCode: code, status: launchError || timedOut || truncated ? 'blocked' : code === 0 ? 'pass' : 'fail', timedOut, truncated };
}
function npmCommand(argv) {
  if (!process.env.npm_execpath) throw new Error('Run via npm run assurance so npm is discoverable.');
  return [process.execPath, [process.env.npm_execpath, ...argv]];
}
async function report(run) {
  const directory = runPath(run.id);
  const actual = await hashes(directory, name => ['manifest.json', 'report.md', 'report.html'].includes(name));
  if (JSON.stringify(actual) !== JSON.stringify(run.artifactHashes)) throw new Error('Evidence integrity mismatch; preserve and investigate the changed artifact.');
  const fresh = (await source()).fingerprint === run.source.fingerprint;
  const rows = run.checks.map(check => `| ${check.id} | ${check.domain} | ${check.status} | ${check.scope} |`);
  const findings = run.findings.map(item => `- ${item.id}: ${item.title} (${item.status}); evidence: ${item.evidence}; ${item.resolution ? `retest: ${item.resolution.run}/${item.resolution.check}` : 'awaiting remediation/retest'}`);
  const text = `# Academic assurance report\n\nRun: ${run.id}\n\nCreated: ${run.created} (UTC)\n\nDomains: ${run.domains.join(', ')}\n\nSource SHA-256: ${run.source.fingerprint}\n\nSource freshness: ${fresh ? 'current' : 'stale; source changed since this run'}\n\nParent baseline: ${run.parent ?? 'none'}\n\n| Check | Area | Result | Scope |\n| --- | --- | --- | --- |\n${rows.join('\n')}\n\n## Findings\n\n${findings.join('\n') || 'No findings recorded. This is not evidence that manual review completed.'}\n\n## Coverage limits\n\n${run.gaps.map(gap => `- ${gap}`).join('\n')}\n\nEvidence files and SHA-256 values are recorded in manifest.json. Original runs are retained; retests create new run folders. Local results do not establish production readiness, security certification, WCAG conformance, or performance equivalence.\n`;
  await writeFile(join(directory, 'report.md'), text);
  const json = async path => { try { return JSON.parse(await readFile(join(directory, path), 'utf8')); } catch { return undefined; } };
  const model = await json('framework-map.json') ?? JSON.parse(await readFile(join(root, 'security/framework-map.json'), 'utf8'));
  const browserResults = {};
  for (const check of run.checks) browserResults[check.id] = await json(`${check.id}/results.json`);
  const controls = assessControls(model, run.checks, browserResults);
  const inventory = await json('dependencies/dependencies.json');
  const npm = await json('npm-audit/stdout.txt');
  const nuget = await json('nuget-audit/stdout.txt');
  const advisories = npm?.metadata?.vulnerabilities && nuget ? npm.metadata.vulnerabilities.total + (nuget.projects ?? []).flatMap(p => p.frameworks ?? []).flatMap(f => [...(f.topLevelPackages ?? []), ...(f.transitivePackages ?? [])]).filter(p => p.vulnerabilities?.length).length : undefined;
  let verificationLog = ''; try { verificationLog = await readFile(join(directory, 'verification/output.txt'), 'utf8'); } catch {}
  await writeFile(join(directory, 'report.html'), renderReport({ run, model, fresh, controls, dependencies: inventory?.packages, advisories, sast: await json('semgrep/stdout.txt'), verificationLog, artifacts: Object.keys(run.artifactHashes) }));
  console.log(`Report: ${join(directory, 'report.html')}`);
}

if (mode === 'run') {
  const domains = option('domains', 'security,accessibility').split(',');
  if (!domains.length || domains.some(domain => !['security', 'accessibility', 'performance', 'e2e'].includes(domain))) throw new Error('Domains: security,accessibility,performance,e2e');
  const parent = option('parent');
  if (parent) await load(parent);
  const id = `${new Date().toISOString().replace(/[^0-9]/g, '')}-${randomUUID().slice(0, 8)}`;
  const directory = runPath(id);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'framework-map.json'), await readFile(join(root, 'security/framework-map.json')));
  const run = { id, created: new Date().toISOString(), domains, parent, source: await source(), checks: [], findings: [], gaps: [] };
  const check = async (id, domain, scope, command, argv, env = {}) => {
    console.log(`Running ${id}…`);
    const artifacts = join(directory, id);
    const result = await capture(command, argv, artifacts, { ...env, ASSURANCE_ARTIFACTS: artifacts });
    run.checks.push({ id, domain, scope, ...result });
    console.log(`${id}: ${result.status}`);
    await save(run);
    return result;
  };
  const tools = await check('tools', 'shared', 'tool/version inventory', process.execPath, ['scripts/tools.mjs', 'list', 'assurance-cycle']);
  if ((await readFile(join(directory, 'tools/output.txt'), 'utf8')).includes('MISSING ')) {
    run.checks.find(item => item.id === 'tools').status = 'blocked';
    run.gaps.push('Tool inventory contains missing/incompatible tools; install and reprobe before claiming complete coverage.');
  }
  const verification = await check('verification', 'shared', 'Vite, Vitest, .NET build/xUnit, and HTTP checks', 'pwsh', ['-NoProfile', '-File', 'scripts/verify.ps1']);
  await check('dependencies', 'shared', 'resolved npm and NuGet package inventory', process.execPath, ['scripts/dependencies.mjs']);
  if (domains.includes('security')) {
    await check('semgrep-fixtures', 'security', 'positive and negative rule fixtures', process.execPath, ['scripts/semgrep.mjs', 'test']);
    await check('semgrep', 'security', 'three local source rules; application files only', process.execPath, ['scripts/semgrep.mjs', 'scan']);
    if (args.includes('--sonar')) await check('sonar', 'security', 'SonarQube Community Build quality gate and server evidence', 'pwsh', ['-NoProfile', '-File', 'scripts/sonar.ps1', '-Mode', 'Scan']);
    else run.checks.push({ id: 'sonar', domain: 'security', scope: 'Optional local SonarQube Community Build; see docs/SONAR.md', status: 'not-run' });
    run.checks.push({ id: 'kali-pentestgpt', domain: 'security', scope: 'Optional supervised Kali lab; see docs/KALI-LAB.md', status: 'not-run' });
    await check('npm-audit', 'security', 'npm dependency advisory database', ...npmCommand(['audit', '--json']));
    await check('nuget-audit', 'security', 'direct/transitive NuGet advisories', 'dotnet', ['list', 'StudentLab.slnx', 'package', '--vulnerable', '--include-transitive', '--format', 'json']);
    for (const id of ['npm-audit', 'nuget-audit']) {
      const entry = run.checks.find(item => item.id === id);
      try {
        const text = await readFile(join(directory, id, 'output.txt'), 'utf8');
        const data = JSON.parse(text.slice(text.indexOf('{')));
        if (data.error || data.errors?.length || /NU1900|unable to load|failed to fetch/i.test(text)) {
          entry.status = 'blocked';
        } else if (id === 'nuget-audit') {
          entry.status = data.projects?.some(project => project.frameworks?.some(framework => [...(framework.topLevelPackages ?? []), ...(framework.transitivePackages ?? [])].some(pkg => pkg.vulnerabilities?.length))) ? 'fail' : entry.status;
        }
      } catch { entry.status = 'blocked'; }
    }
    run.gaps.push('Security source review and threat-model reasoning are agent tasks; record findings and reviewed scope separately. No secret scanner, exploitation, or production checks are implied.');
  }
  for (const domain of domains) {
    const tags = { security: '@security', accessibility: '@a11y', performance: '@performance', e2e: '@e2e' };
    if (verification.status !== 'pass') {
      run.checks.push({ id: `browser-${domain}`, domain, scope: tags[domain], status: 'blocked', reason: 'Shared verification failed; no browser test ran.' });
      continue;
    }
    await check(`browser-${domain}`, domain, domain === 'performance' ? 'diagnostic timing collection; no regression verdict' : `browser checks tagged ${tags[domain]}`, process.execPath, [require.resolve('@playwright/test/cli'), 'test', '--grep', tags[domain]]);
  }
  if (domains.includes('accessibility')) run.gaps.push('Axe covers empty, populated, complete, and request-error states. Loading, validation, keyboard focus, contrast review, screen-reader use, and zoom require additional/manual evidence. Axe incomplete results need review.');
  if (domains.includes('performance')) run.gaps.push('Timing is a ten-sample localhost diagnostic of an empty board, not a baseline comparison, capacity result, or regression decision.');
  if ((await source()).fingerprint !== run.source.fingerprint) run.gaps.push('Source changed during execution; run must be repeated before making current-source claims.');
  run.artifactHashes = await hashes(directory, name => name === 'manifest.json');
  await save(run);
  await report(run);
  console.log(`RUN_ID=${run.id}`);
  if (run.checks.some(check => ['fail', 'blocked'].includes(check.status))) process.exitCode = 1;
} else if (mode === 'report') {
  await report(await load(option('run')));
} else if (mode === 'finding') {
  const run = await load(option('run'));
  const input = JSON.parse(await readFile(resolve(option('file')), 'utf8'));
  if (!input.title || !input.check || !input.evidence || !input.reproduction || !input.expected || !input.actual) throw new Error('Finding requires title, check (original check ID), evidence (run-relative file), reproduction, expected, actual.');
  if (!run.checks.some(check => check.id === input.check)) throw new Error('Finding check must exist in the baseline run.');
  const evidence = resolve(runPath(run.id), input.evidence);
  if (!evidence.startsWith(runPath(run.id) + '/') && !evidence.startsWith(runPath(run.id) + '\\')) throw new Error('Evidence must be inside its run.');
  await access(evidence);
  const id = `finding-${randomUUID().slice(0, 8)}`;
  run.findings.push({ ...JSON.parse(redact(JSON.stringify(input))), id, status: 'open' });
  await save(run); await report(run); console.log(id);
} else if (mode === 'resolve') {
  const baseline = await load(option('run'));
  const retest = await load(option('retest'));
  await report(retest); // Validate its evidence integrity before closure.
  const finding = baseline.findings.find(item => item.id === option('finding'));
  const check = retest.checks.find(item => item.id === option('check'));
  const sharedPassed = ['tools', 'verification'].every(id => retest.checks.find(item => item.id === id)?.status === 'pass');
  if (!finding || finding.status !== 'open' || check?.id !== finding.check || retest.parent !== baseline.id || check?.status !== 'pass' || !sharedPassed || (await source()).fingerprint !== retest.source.fingerprint) throw new Error('Closure requires an open finding, successful shared verification, and a linked, passing, current-source retest of the original check.');
  const fix = option('fix');
  if (!fix) throw new Error('Provide --fix with the changed files and explanation.');
  finding.status = 'remediated';
  finding.resolution = { run: retest.id, check: check.id, fix, date: new Date().toISOString(), review: 'agent self-review; independent review not recorded' };
  await save(baseline); await report(baseline);
} else if (mode === 'record') {
  const run = await load(option('run'));
  await report(run);
  const note = JSON.parse(await readFile(resolve(option('file')), 'utf8'));
  if (!note.scope || !note.author || !note.method || !note.observations || !note.gaps) throw new Error('Record requires scope, author, method, observations, gaps.');
  const id = `review-${randomUUID().slice(0, 8)}`;
  await writeFile(join(runPath(run.id), `${id}.json`), redact(JSON.stringify({ ...note, source: await source(), recorded: new Date().toISOString() }, null, 2)));
  run.checks.push({ id, domain: note.domain ?? 'shared', status: 'recorded', scope: `${note.scope} (${note.method}; ${note.author})` });
  run.gaps.push(...note.gaps);
  run.artifactHashes = await hashes(runPath(run.id), name => ['manifest.json', 'report.md', 'report.html'].includes(name));
  await save(run); await report(run);
} else throw new Error('Modes: run, report, record, finding, resolve. See docs/ASSURANCE.md.');
