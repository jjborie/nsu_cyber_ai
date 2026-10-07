import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sha256 } from './evidence.mjs';

const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
const packages = Object.entries(lock.packages).filter(([path]) => path).map(([path, item]) => ({
  ecosystem: 'npm', name: path.split('node_modules/').at(-1), version: item.version,
  kind: item.dev ? 'development' : 'runtime', integrity: item.integrity, license: item.license,
}));
for (const project of ['src/StudentLab', 'tests/StudentLab.Tests']) {
  const assets = JSON.parse(await readFile(`${project}/obj/project.assets.json`, 'utf8'));
  for (const [key, item] of Object.entries(assets.libraries)) {
    if (item.type !== 'package') continue;
    const [name, version] = key.split('/');
    packages.push({ ecosystem: 'NuGet', name, version, kind: project.startsWith('tests') ? 'test' : 'runtime', project, integrity: item.sha512 });
  }
}
const output = { format: 'academic dependency inventory v1 (not a certified SBOM)', created: new Date().toISOString(), lockSha256: sha256(await readFile('package-lock.json')), packages };
const target = process.env.ASSURANCE_ARTIFACTS ? resolve(process.env.ASSURANCE_ARTIFACTS, 'dependencies.json') : null;
if (target) await writeFile(target, JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
