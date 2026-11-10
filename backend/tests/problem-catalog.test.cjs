require('./register-typescript.cjs');
const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const { getProblemCatalog, ProblemCatalogError } = require('../src/services/problem-catalog.service.ts');

test('catalog validates responses, deduplicates concurrent fetches, caches for 24h and recovers after failure', async () => {
  let now = 0, resolve;
  const good = { contestId: 1, index: 'A', name: 'Example', rating: 1000, type: 'PROGRAMMING', tags: ['dp'] };
  mock.method(Date, 'now', () => now);
  const api = mock.method(axios, 'get', async (url, options) => {
    assert.equal(url, 'https://codeforces.com/api/problemset.problems');
    assert.equal(options.timeout, 10000);
    return new Promise(done => { resolve = done; });
  });
  try {
    const first = getProblemCatalog(), second = getProblemCatalog();
    assert.equal(api.mock.callCount(), 1);
    resolve({ data: { status: 'OK', result: { problems: [good, null, { ...good, contestId: undefined }, { ...good, index: '../bad' }, { ...good, rating: undefined }, { ...good, tags: [1] }, { ...good, name: '' }] } } });
    const [a, b] = await Promise.all([first, second]);
    assert.deepEqual(a, [good]); assert.equal(a, b);
    now = 86400000 - 1;
    assert.equal(await getProblemCatalog(), a);
    assert.equal(api.mock.callCount(), 1);
    now++;
    api.mock.mockImplementation(async () => ({ data: { status: 'FAILED', result: { problems: [] } } }));
    await assert.rejects(getProblemCatalog(), ProblemCatalogError);
    api.mock.mockImplementation(async () => ({ data: { status: 'OK', result: {} } }));
    await assert.rejects(getProblemCatalog(), ProblemCatalogError);
    api.mock.mockImplementation(async () => { throw new Error('timeout'); });
    await assert.rejects(Promise.all([getProblemCatalog(), getProblemCatalog()]), ProblemCatalogError);
    api.mock.mockImplementation(async () => ({ data: { status: 'OK', result: { problems: [] } } }));
    assert.deepEqual(await getProblemCatalog(), []);
    assert.equal(api.mock.callCount(), 5);
    assert.deepEqual(await getProblemCatalog(), []);
    assert.equal(api.mock.callCount(), 5);
  } finally { mock.restoreAll(); }
});
