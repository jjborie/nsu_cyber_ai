import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { redact } from '../../scripts/evidence.mjs';

const browserEvents = new WeakMap();

test.beforeEach(async ({ request, page }) => {
  const events = [];
  browserEvents.set(page, events);
  page.on('pageerror', error => events.push({ type: 'pageerror', message: redact(error.message) }));
  page.on('console', message => {
    if (['warning', 'error'].includes(message.type())) events.push({ type: message.type(), message: redact(message.text()) });
  });
  page.on('response', response => {
    if (response.status() >= 400) events.push({ type: 'http-error', status: response.status(), path: new URL(response.url()).pathname });
  });
  const response = await request.get('/api/experiments');
  for (const item of await response.json()) await request.delete(`/api/experiments/${item.id}`);
});

test.afterEach(async ({ page }, testInfo) => {
  await testInfo.attach('browser-events', { body: JSON.stringify(browserEvents.get(page) ?? [], null, 2), contentType: 'application/json' });
  if (!page.isClosed()) await page.screenshot({ path: testInfo.outputPath('final-state.png'), fullPage: true });
});

test('keyboard CRUD agrees with API @e2e', async ({ page, request }) => {
  await page.goto('/');
  await page.getByLabel('What would you like to try?').fill('Keyboard experiment');
  await page.getByLabel('What would you like to try?').press('Tab');
  await page.getByRole('button', { name: 'Add experiment' }).press('Enter');
  await expect(page.getByText('Keyboard experiment', { exact: true })).toBeVisible();
  await expect(page.getByLabel('What would you like to try?')).toBeFocused();
  await page.getByRole('checkbox').check();
  await expect(page.locator('#count')).toHaveText('1 / 1 complete');
  expect((await (await request.get('/api/experiments')).json())[0].isComplete).toBe(true);
  await page.getByRole('button', { name: 'Delete Keyboard experiment' }).click();
  await expect(page.getByText('Your board is empty. Add an experiment above.')).toBeVisible();
  expect(await (await request.get('/api/experiments')).json()).toEqual([]);
});

test('markup stays literal and invalid API input is rejected @security', async ({ page, request }) => {
  const input = '<img src=x onerror=alert(1)>';
  const created = await request.post('/api/experiments', { data: { title: input } });
  expect(created.status()).toBe(201);
  await page.goto('/');
  await expect(page.getByText(input, { exact: true })).toBeVisible();
  await expect(page.locator('#experiments img')).toHaveCount(0);
  expect((await request.post('/api/experiments', { data: { title: ' ' } })).status()).toBe(400);
  expect((await request.put(`/api/experiments/${(await created.json()).id}`, { data: {} })).status()).toBe(400);
  const response = await request.get('/');
  expect(response.headers()['content-security-policy']).toContain("script-src 'self'");
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
});

test('axe checks empty, populated, complete, and request-error states @a11y', async ({ page, request }, testInfo) => {
  const findings = [];
  async function scan(state) {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    findings.push({ state, violations: results.violations, incomplete: results.incomplete });
  }
  try {
    await page.goto('/');
    await expect(page.getByText('Your board is empty. Add an experiment above.')).toBeVisible();
    await scan('empty');
    await request.post('/api/experiments', { data: { title: 'Accessibility experiment' } });
    await page.reload();
    await expect(page.getByRole('checkbox')).toBeVisible();
    await scan('populated');
    await page.getByRole('checkbox').check();
    await expect(page.locator('#count')).toHaveText('1 / 1 complete');
    await scan('complete');
    await page.route('**/api/experiments', route => route.fulfill({ status: 503, body: '{}' }));
    await page.reload();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
    await scan('request-error');
    expect(findings.flatMap(result => result.violations)).toEqual([]);
  } finally {
    await testInfo.attach('axe-states', { body: JSON.stringify(findings, null, 2), contentType: 'application/json' });
    await page.screenshot({ path: testInfo.outputPath('assessed-state.png'), fullPage: true });
  }
});

test('bounded request timing records samples without a performance verdict @performance', async ({ request }, testInfo) => {
  await request.get('/api/experiments'); // Warm-up, excluded from samples.
  const samplesMs = [];
  for (let index = 0; index < 10; index++) {
    const start = performance.now();
    expect((await request.get('/api/experiments')).status()).toBe(200);
    samplesMs.push(performance.now() - start);
  }
  const sorted = [...samplesMs].sort((a, b) => a - b);
  await testInfo.attach('request-timing', {
    body: JSON.stringify({ scope: 'local HTTP diagnostic, empty board', samplesMs, medianMs: (sorted[4] + sorted[5]) / 2, minMs: sorted[0], maxMs: sorted.at(-1), node: process.version }, null, 2),
    contentType: 'application/json',
  });
});
