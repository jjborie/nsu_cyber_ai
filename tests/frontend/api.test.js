import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createApi, completionSummary, titleSchema } from '../../src/ClientApp/api.js';

test('returns JSON and forwards the mutation body and content type', async () => {
  const payload = { id: 'demo', title: 'Experiment', isComplete: false };
  const request = createApi(async (path, options) => {
    assert.equal(path, '/api/experiments');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { title: 'Experiment' });
    assert.equal(options.headers['Content-Type'], 'application/json');
    return new Response(JSON.stringify(payload), { status: 201 });
  });
  assert.deepEqual(await request('/api/experiments', {
    method: 'POST', body: JSON.stringify({ title: 'Experiment' }),
  }), payload);
});

test('handles successful deletion without trying to parse empty JSON', async () => {
  const request = createApi(async () => new Response(null, { status: 204 }));
  assert.equal(await request('/api/experiments/demo', { method: 'DELETE' }), null);
});

test('surfaces server validation messages from all invalid fields', async () => {
  const request = createApi(async () => new Response(JSON.stringify({
    errors: { title: ['Title required.'], isComplete: ['Provide true or false.'] },
  }), { status: 400 }));
  await assert.rejects(request('/api/experiments'), {
    message: 'Title required. Provide true or false.',
  });
});

test('provides a useful fallback when an error response is not JSON', async () => {
  const request = createApi(async () => new Response('Server unavailable', { status: 503 }));
  await assert.rejects(request('/api/experiments'), {
    message: 'Request failed (503). Check that the server is running.',
  });
});

test('handles a JSON error without field validation details', async () => {
  const request = createApi(async () => new Response('{}', { status: 404 }));
  await assert.rejects(request('/api/experiments/missing'), /Request failed \(404\)/);
});

test('propagates transport failure so the UI can report it', async () => {
  const request = createApi(async () => { throw new TypeError('Network unavailable'); });
  await assert.rejects(request('/api/experiments'), /Network unavailable/);
});

test('reports completion for empty, mixed, and fully completed boards', () => {
  assert.equal(completionSummary([]), '0 / 0 complete');
  const items = [{ isComplete: false }, { isComplete: true }];
  assert.equal(completionSummary(items), '1 / 2 complete');
  assert.deepEqual(items, [{ isComplete: false }, { isComplete: true }]);
  assert.equal(completionSummary([{ isComplete: true }]), '1 / 1 complete');
});

test('Zod trims valid titles and rejects blank or oversized input', () => {
  assert.equal(titleSchema.parse('  experiment  '), 'experiment');
  assert.equal(titleSchema.safeParse('   ').success, false);
  assert.equal(titleSchema.safeParse('x'.repeat(100)).success, true);
  assert.equal(titleSchema.safeParse('x'.repeat(101)).success, false);
});
