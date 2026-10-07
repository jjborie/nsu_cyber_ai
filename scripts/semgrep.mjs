import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { readdirSync } from 'node:fs';

const executable = resolve('.local/tools/semgrep', process.platform === 'win32' ? 'Scripts/semgrep.exe' : 'bin/semgrep');
const mode = process.argv[2] ?? 'scan';
function sources(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (['bin', 'obj', 'wwwroot'].includes(entry.name) || entry.isSymbolicLink()) return [];
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? sources(path) : /\.(js|cs)$/.test(entry.name) ? [path] : [];
  });
}
const targets = mode === 'test' ? sources('security/fixtures') : [...sources('src/ClientApp'), ...sources('src/StudentLab')];
const args = ['scan', '--config', 'security/semgrep.yml', '--json', '--strict', '--metrics', 'off', '--disable-version-check', '--no-git-ignore', ...(mode === 'test' ? [] : ['--error']), ...targets];
const localBin = resolve('.local/tools/semgrep', process.platform === 'win32' ? 'Scripts' : 'bin');
const result = spawnSync(executable, args, { encoding: 'utf8', timeout: 120_000, windowsHide: true, env: { ...process.env, PYTHONUTF8: '1', PATH: `${localBin}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH}` } });
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) console.error(`Semgrep unavailable: ${result.error.message}. Run npm run tools -- install code-quality.`);
process.exitCode = result.error ? 2 : result.status ?? 2;
if (mode === 'test' && !result.error && result.status === 0) {
  try {
    const data = JSON.parse(result.stdout);
    const expected = ['academic-js-unsafe-html', 'academic-js-dynamic-code', 'academic-csharp-process-execution'];
    const detected = data.results.map(item => item.check_id);
    if (data.errors.length || expected.some(id => !detected.some(item => item.endsWith(id))) || data.results.some(item => item.path.replaceAll('\\', '/').endsWith('/safe.js')) || data.results.length !== 3) throw new Error('Positive/negative fixture coverage failed.');
    console.log('PASS: three positive detections and safe-rendering negative fixture.');
  } catch (error) { console.error(error.message); process.exitCode = 2; }
}
