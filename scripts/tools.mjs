import { readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const catalog = JSON.parse(await readFile(new URL('./tool-catalog.json', import.meta.url)));
const [mode = 'list', skill = 'assurance-cycle', ...flags] = process.argv.slice(2);
if (!['list', 'install'].includes(mode) || !catalog.skills[skill]) {
  throw new Error(`Usage: npm run tools -- list|install SKILL [--system]. Skills: ${Object.keys(catalog.skills).join(', ')}`);
}
const browserEnv = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: resolve(root, '.local/browsers') };

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { cwd: root, env, encoding: 'utf8', timeout: 300_000, windowsHide: true });
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error?.message ?? result.stderr ?? result.stdout}`);
  if (result.stdout) console.log(result.stdout.trim());
}
function npm(args) {
  if (!process.env.npm_execpath) throw new Error('Run installation through npm run tools so the npm executable is known.');
  run(process.execPath, [process.env.npm_execpath, ...args]);
}
async function probe(name) {
  const tool = catalog.tools[name];
  try {
    if (tool.scanner) {
      const executable = resolve(root, '.local/tools/sonar', process.platform === 'win32' ? 'dotnet-sonarscanner.exe' : 'dotnet-sonarscanner');
      await access(executable);
      const result = spawnSync('dotnet', ['tool', 'list', '--tool-path', resolve(root, '.local/tools/sonar')], { encoding: 'utf8', windowsHide: true });
      return { name, ready: result.status === 0 && result.stdout.includes('11.3.0'), version: result.stdout.trim() };
    }
    if (tool.localCommand) {
      const executable = resolve(root, '.local/tools/semgrep', process.platform === 'win32' ? 'Scripts/semgrep.exe' : 'bin/semgrep');
      const result = spawnSync(executable, ['--version'], { encoding: 'utf8', timeout: 30_000, windowsHide: true, env: { ...process.env, PYTHONUTF8: '1', PATH: dirname(executable) + (process.platform === 'win32' ? ';' : ':') + process.env.PATH } });
      return { name, ready: !result.error && result.status === 0, version: result.stdout?.trim() ?? 'not found' };
    }
    if (tool.package) {
      let directory = dirname(require.resolve(tool.package));
      let pkg;
      while (directory !== dirname(directory)) {
        try {
          const candidate = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
          if (candidate.name === tool.package) { pkg = candidate; break; }
        } catch { /* Continue to the package root when exports hide package.json. */ }
        directory = dirname(directory);
      }
      if (!pkg) throw new Error('Package manifest unavailable');
      return { name, ready: true, version: pkg.version };
    }
    if (tool.browser) {
      process.env.PLAYWRIGHT_BROWSERS_PATH = browserEnv.PLAYWRIGHT_BROWSERS_PATH;
      const { chromium } = await import('@playwright/test');
      await access(chromium.executablePath());
      return { name, ready: true, version: 'installed; runtime checks verify launch' };
    }
    if (tool.restore) {
      const assets = JSON.parse(await readFile(resolve(root, 'tests/StudentLab.Tests/obj/project.assets.json'), 'utf8'));
      const xunit = Object.keys(assets.libraries).find(key => key.startsWith('xunit/'));
      if (!xunit) throw new Error('Restore missing');
      return { name, ready: true, version: xunit.split('/')[1] };
    }
    const result = spawnSync(name === 'node' ? process.execPath : tool.command, tool.args, { encoding: 'utf8', timeout: 15_000, windowsHide: true });
    const output = result.stdout?.trim() ?? '';
    const versions = [...output.matchAll(/(?:^|\s|v)(\d+)\.\d+/g)].map(match => Number(match[1]));
    const parts = output.replace(/^v/, '').split('.').map(Number);
    const minimum = tool.minimumVersion?.split('.').map(Number);
    const nodeVersionReady = !minimum || parts[0] > minimum[0] || (parts[0] === minimum[0] && (parts[1] > minimum[1] || (parts[1] === minimum[1] && parts[2] >= minimum[2])));
    return { name, ready: !result.error && result.status === 0 && nodeVersionReady && (!tool.minimumMajor || versions.includes(tool.minimumMajor) || (name !== 'dotnet' && versions.some(major => major >= tool.minimumMajor))), version: output };
  } catch { return { name, ready: false, version: 'not found' }; }
}

let states = await Promise.all(catalog.skills[skill].map(probe));
if (mode === 'install') {
  const missingSystem = states.filter(state => !state.ready && catalog.tools[state.name].command);
  for (const state of missingSystem) {
    const tool = catalog.tools[state.name];
    if (!flags.includes('--system')) {
      console.log(`Missing ${state.name}. Install: ${tool.source}; on Windows use --system to run winget.`);
      continue;
    }
    if (process.platform !== 'win32') throw new Error(`Install ${state.name} using ${tool.source}; automatic system installation supports Windows only.`);
    run('winget', ['install', '--id', tool.installId, '--exact', '--source', 'winget', '--silent', '--accept-package-agreements', '--accept-source-agreements']);
  }
  if (states.some(state => !state.ready && catalog.tools[state.name].package)) npm(['ci']);
  if (states.some(state => !state.ready && catalog.tools[state.name].localCommand)) {
    run('python', ['-m', 'venv', '.local/tools/semgrep']);
    const python = resolve(root, '.local/tools/semgrep', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
    run(python, ['-m', 'pip', 'install', '-r', 'security/requirements.txt']);
  }
  if (states.some(state => !state.ready && catalog.tools[state.name].scanner)) run('pwsh', ['-NoProfile', '-File', 'scripts/sonar.ps1', '-Mode', 'Install']);
  if (states.some(state => !state.ready && catalog.tools[state.name].restore)) run('dotnet', ['restore', 'StudentLab.slnx']);
  if (states.some(state => !state.ready && catalog.tools[state.name].browser)) {
    run(process.execPath, [require.resolve('@playwright/test/cli'), 'install', 'chromium'], browserEnv);
  }
  states = await Promise.all(catalog.skills[skill].map(probe));
}
for (const state of states) console.log(`${state.ready ? 'READY' : 'MISSING'} ${state.name}: ${state.version.replaceAll('\n', '; ')}${state.ready ? '' : ` — ${catalog.tools[state.name].install ?? catalog.tools[state.name].source}`}`);
if (mode === 'install' && states.some(state => !state.ready)) process.exitCode = 1;
