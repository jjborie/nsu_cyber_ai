import { test, expect } from 'vitest';
import { redact, escapeHtml, sha256 } from '../../scripts/evidence.mjs';

test('removes credentials from captured textual logs', () => {
  const output = redact('Authorization: Bearer example-token\npassword=example-password\nCookie: session=example-cookie');
  expect(output).not.toContain('example-token');
  expect(output).not.toContain('example-password');
  expect(output).not.toContain('example-cookie');
  expect(output).toContain('[REDACTED]');
});
test('reports treat finding text as text instead of executable HTML', () => {
  expect(escapeHtml('<script>alert("x")</script>')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
});
test('evidence digest detects changed content', () => {
  expect(sha256('original')).toBe(sha256('original'));
  expect(sha256('altered')).not.toBe(sha256('original'));
});
