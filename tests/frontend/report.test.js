import { test, expect } from 'vitest';
import { assessControls } from '../../scripts/report.mjs';

test('framework support requires the named browser scenario, not merely a passing suite', () => {
  const model = { controls: [{ id: 'OUT-01', check: 'browser-security', test: 'literal', claim: 'supported' }] };
  const checks = [{ id: 'browser-security', status: 'pass' }];
  expect(assessControls(model, checks)[0].status).toBe('not-assessed');
  const results = { 'browser-security': { suites: [{ specs: [{ title: 'title stays literal', tests: [{ results: [{ status: 'passed' }] }] }] }] } };
  expect(assessControls(model, checks, results)[0].status).toBe('supported');
  checks[0].status = 'fail';
  expect(assessControls(model, checks, results)[0].status).toBe('failed-check');
});

test('dependency alignment needs both ecosystems to complete', () => {
  const model = { controls: [{ id: 'SCA-01', check: 'npm-audit', claim: 'partial' }] };
  const checks = [{ id: 'npm-audit', status: 'pass' }];
  expect(assessControls(model, checks)[0].status).toBe('not-assessed');
  checks.push({ id: 'nuget-audit', status: 'pass' });
  expect(assessControls(model, checks)[0].status).toBe('partial');
});
