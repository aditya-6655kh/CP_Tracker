require('./register-typescript.cjs');
const { test, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const catalogService = require('../src/services/problem-catalog.service.ts');
beforeEach(() => mock.method(catalogService, 'getProblemCatalog', async () => []));
// Isolate persistence before importing the controller: no Prisma engine or DB.
const prisma = { profile: { async findUnique() { return null; } } };
const prismaPath = require.resolve('../src/lib/prisma.ts');
require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: { __esModule: true, default: prisma } };
const { fetchCodeForcesStats } = require('../src/controllers/codeforces.controller.ts');
afterEach(() => mock.restoreAll());

function response() {
  return {
    statusCode: 200, headers: {}, body: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; },
    json(body) { this.body = body; return this; },
  };
}
test('unauthenticated and unlinked requests never call Codeforces', async () => {
  const api = mock.method(axios, 'get', () => { throw new Error('Unexpected external request'); });
  const unauthorized = response();
  await fetchCodeForcesStats({ query: {} }, unauthorized);
  assert.equal(unauthorized.statusCode, 401);
  mock.method(prisma.profile, 'findUnique', async () => ({ cfHandle: null }));
  const unlinked = response();
  await fetchCodeForcesStats({ userId: 'fixture', query: {} }, unlinked);
  assert.equal(unlinked.statusCode, 400);
  assert.equal(api.mock.callCount(), 0);
});
test('existing envelope, cache headers and exact refresh flag are preserved', async () => {
  mock.method(prisma.profile, 'findUnique', async () => ({ cfHandle: 'controller-fixture' }));
  const api = mock.method(axios, 'get', async url => ({ data: {
    status: 'OK', result: url.includes('/user.info') ? [{ handle: 'controller-fixture' }] : [],
  } }));
  for (const [query, expectedCache, expectedCalls] of [[{}, 'MISS', 3], [{}, 'HIT', 3], [{ refresh: 'false' }, 'HIT', 3], [{ refresh: 'true' }, 'MISS', 6]]) {
    const res = response();
    await fetchCodeForcesStats({ userId: 'fixture', query }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.deepEqual(res.body.data.topicAnalytics.topics, []);
    assert.equal(res.headers['Cache-Control'], 'no-store');
    assert.equal(res.headers['X-Cache'], expectedCache);
    assert.equal(api.mock.callCount(), expectedCalls);
  }
});
test('typed upstream errors retain their HTTP status', async () => {
  mock.method(prisma.profile, 'findUnique', async () => ({ cfHandle: 'missing-controller-fixture' }));
  mock.method(axios, 'get', async () => ({ data: { status: 'FAILED', result: [], comment: 'Handle not found' } }));
  const res = response();
  await fetchCodeForcesStats({ userId: 'fixture', query: {} }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.success, false);
});
