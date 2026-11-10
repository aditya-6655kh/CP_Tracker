require('./register-typescript.cjs');
const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const { getCodeForcesStats } = require('../src/services/codeforces.services.ts');

test('real catalog and per-handle stats caches cooperate across navigation, refresh and handles', async () => {
  const problem = { contestId: 1, index: 'A', name: 'Example', type: 'PROGRAMMING', rating: 1400, tags: ['dp'] };
  let solved = false;
  const api = mock.method(axios, 'get', async url => {
    if (url.includes('problemset.problems')) return { data: { status: 'OK', result: { problems: [problem] } } };
    const parsed = new URL(url);
    if (url.includes('user.info')) return { data: { status: 'OK', result: [{ handle: parsed.searchParams.get('handles'), rating: 1400 }] } };
    return { data: { status: 'OK', result: url.includes('user.status') && (solved || parsed.searchParams.get('handle') === 'second')
      ? [{ problem, contestId: 1, verdict: 'OK', creationTimeSeconds: 1577836800 }] : [] } };
  });
  try {
    const first = await getCodeForcesStats('first');
    assert.equal(first.stats.recommendations.items.length, 1);
    assert.equal(api.mock.callCount(), 4);
    assert.equal((await getCodeForcesStats('first')).cacheHit, true);
    assert.equal(api.mock.callCount(), 4);
    assert.equal((await getCodeForcesStats('second')).stats.recommendations.items.length, 0);
    assert.equal(api.mock.callCount(), 7);
    solved = true;
    assert.equal((await getCodeForcesStats('first', true)).stats.recommendations.items.length, 0);
    assert.equal(api.mock.callCount(), 10);
    assert.equal(api.mock.calls.filter(call => call.arguments[0].includes('problemset.problems')).length, 1);
  } finally { mock.restoreAll(); }
});
