require('./register-typescript.cjs');
const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const catalog = require('../src/services/problem-catalog.service.ts');
const { getCodeforcesSnapshot, getCodeForcesStats } = require('../src/services/codeforces.services.ts');

test('goals and public stats share one in-flight fetch without exposing raw history', async () => {
  mock.method(catalog, 'getProblemCatalog', async () => []);
  const api = mock.method(axios, 'get', async url => ({ data: { status: 'OK', result: url.includes('user.info') ? [{ handle: 'snapshot' }] : [] } }));
  try {
    const [personal, publicStats] = await Promise.all([getCodeforcesSnapshot('snapshot'), getCodeForcesStats('snapshot')]);
    assert.equal(api.mock.callCount(), 3);
    assert.equal(personal.snapshot.stats, publicStats.stats);
    assert.ok(personal.snapshot.fetchedAt instanceof Date);
    assert.equal('submissions' in publicStats.stats, false);
    assert.equal((await getCodeforcesSnapshot('snapshot')).cacheHit, true);
    assert.equal(api.mock.callCount(), 3);
    await getCodeforcesSnapshot('snapshot', true);
    assert.equal(api.mock.callCount(), 6);
  } finally { mock.restoreAll(); }
});

test('ordinary reads join a pending refresh instead of returning the previous cache', async () => {
  mock.method(catalog, 'getProblemCatalog', async () => []);
  let finish, refreshing = false;
  mock.method(axios, 'get', async url => {
    if (refreshing && url.includes('user.status')) return new Promise(resolve => { finish = resolve; });
    return { data: { status: 'OK', result: url.includes('user.info') ? [{ handle: 'refresh-order' }] : [] } };
  });
  try {
    const old = await getCodeforcesSnapshot('refresh-order');
    refreshing = true;
    const forced = getCodeforcesSnapshot('refresh-order', true);
    let ordinaryResolved = false;
    const ordinary = getCodeforcesSnapshot('refresh-order').then(result => { ordinaryResolved = true; return result; });
    await new Promise(setImmediate);
    assert.equal(ordinaryResolved, false);
    finish({ data: { status: 'OK', result: [] } });
    const [newResult, joined] = await Promise.all([forced, ordinary]);
    assert.equal(joined.snapshot, newResult.snapshot);
    assert.notEqual(joined.snapshot, old.snapshot);
    assert.equal(joined.cacheHit, false);
  } finally { mock.restoreAll(); }
});

for (const endpoint of ['user.info', 'user.rating', 'user.status']) {
  test(endpoint + ' is bounded and a timeout releases the shared request for retry', async () => {
    mock.method(catalog, 'getProblemCatalog', async () => []);
    let fail = true;
    const api = mock.method(axios, 'get', async (url, options) => {
      assert.equal(options.timeout, 10000);
      const method = new URL(url).pathname;
      if (fail && method.endsWith('/' + endpoint)) throw Object.assign(new Error('timeout'), { code: 'ECONNABORTED' });
      return { data: { status: 'OK', result: method.endsWith('/user.info') ? [{ handle: 'timeout-fixture' }] : [] } };
    });
    try {
      const handle = 'timeout-' + endpoint;
      await assert.rejects(getCodeforcesSnapshot(handle), /fetch|reach/i);
      fail = false;
      const recovered = await getCodeforcesSnapshot(handle, true);
      assert.equal(recovered.cacheHit, false);
      assert.equal(api.mock.callCount(), 6);
      assert.equal((await getCodeforcesSnapshot(handle)).cacheHit, true);
    } finally { mock.restoreAll(); }
  });
}
