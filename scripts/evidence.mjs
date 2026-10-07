import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

export const sha256 = value => createHash('sha256').update(value).digest('hex');
export function redact(value) {
  return value
    .replace(/(Bearer\s+)[^\s"']+/gi, '$1[REDACTED]')
    .replace(/((?:password|token|secret|api[_-]?key)\s*[=:]\s*)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/((?:Cookie|Set-Cookie|Authorization):\s*)[^\r\n]+/gi, '$1[REDACTED]');
}
export const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export async function hashes(root, exclude = () => false) {
  const files = {};
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const name = relative(root, path).replaceAll('\\', '/');
      if (exclude(name, entry) || entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) files[name] = sha256(await readFile(path));
    }
  }
  await walk(root);
  return Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)));
}
export const sourceExclude = name => /(^|\/)(node_modules|bin|obj|\.git|\.local|\.sonarqube|wwwroot|coverage|test-results|playwright-report)(\/|$)/.test(name);
