require('./register-typescript.cjs');
const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const { computeRecommendations } = require('../src/services/codeforces-recommendations.service.ts');
const { getCodeForcesStats } = require('../src/services/codeforces.services.ts');
const catalogService = require('../src/services/problem-catalog.service.ts');
afterEach(() => mock.restoreAll());

const problem = (contestId, rating = 1400, tags = ['dp']) => ({ contestId, index: 'A', name: `Problem ${contestId}`, type: 'PROGRAMMING', rating, tags });
const analytics = (tags = ['dp']) => ({ topics: tags.map((tag, i) => ({ tag, attemptedProblems: 5, solvedProblems: i, solveRate: i / 5, status: 'weak' })), possiblyTruncated: false });
const sub = (problem, verdict) => ({ problem, verdict, contestId: problem.contestId, creationTimeSeconds: 1577836800 });

test('accepted problems stay excluded after failures; unsolved attempts remain eligible', () => {
  const catalog = [problem(1), problem(2), problem(3)];
  const input = [sub(catalog[0], 'OK'), sub(catalog[0], 'WRONG_ANSWER'), sub(catalog[1], 'WRONG_ANSWER')];
  const before = structuredClone({ catalog, input });
  const result = computeRecommendations(catalog, input, 1400, analytics());
  assert.deepEqual(result.items.map(p => p.id), ['2:A', '3:A']);
  assert.equal(result.items[0].previouslyAttempted, true);
  assert.equal(result.items[1].previouslyAttempted, false);
  assert.equal(result.items[0].url, 'https://codeforces.com/problemset/problem/2/A');
  assert.deepEqual({ catalog, input }, before);
});
test('identity prefers problem contest ID and falls back to submission contest ID', () => {
  const fallback = sub(problem(1), 'OK'); delete fallback.problem.contestId;
  const preferred = sub(problem(2), 'OK'); preferred.contestId = 99;
  const missing = sub(problem(3), 'OK'); delete missing.problem.contestId; delete missing.contestId;
  assert.deepEqual(computeRecommendations([problem(1), problem(2), problem(3)], [fallback, preferred, missing], 1400, analytics()).items.map(p => p.id), ['3:A']);
});
test('rating band is inclusive, unrated/special/non-programming problems are excluded', () => {
  const input = [problem(1, 1200), problem(2, 1600), problem(3, 1199), problem(4, 1601), { ...problem(5), rating: undefined }, problem(6, 1400, ['dp', '*special']), { ...problem(7), type: 'QUESTION' }];
  const result = computeRecommendations(input, [], 1400, analytics());
  assert.deepEqual(result.items.map(p => p.id), ['1:A', '2:A']);
});
test('unrated users receive labelled general practice around 1000 with an 800 floor', () => {
  const result = computeRecommendations([problem(1, 800), problem(2, 1000), problem(3, 1200), problem(4, 1300)], [], null, analytics([]));
  assert.equal(result.mode, 'general-practice');
  assert.equal(result.usedDefaultRating, true);
  assert.equal(result.minRating, 800);
  assert.equal(result.maxRating, 1200);
  assert.deepEqual(result.items.map(p => p.id), ['2:A', '1:A', '3:A']);
  assert.equal(computeRecommendations([], [], 300, analytics([])).targetRating, 800);
  assert.equal(computeRecommendations([], [], 1449, analytics([])).targetRating, 1400);
});
test('only the three weakest eligible topics are used, with six unique and diverse results', () => {
  const input = [...Array.from({ length: 9 }, (_, i) => problem(i + 1)), problem(20, 1400, ['graphs']), problem(30, 1400, ['math']), problem(40, 1400, ['strings'])];
  const result = computeRecommendations(input, [], 1400, analytics(['dp', 'graphs', 'math', 'strings']));
  assert.deepEqual(result.weakTags, ['dp', 'graphs', 'math']);
  assert.equal(result.items.length, 6);
  assert.deepEqual(result.items.slice(0, 3).map(p => p.id), ['1:A', '20:A', '30:A']);
  assert.equal(new Set(result.items.map(p => p.id)).size, 6);
  assert.deepEqual(computeRecommendations([...input].reverse(), [], 1400, analytics(['dp', 'graphs', 'math', 'strings'])), result);
});
test('multi-tag and duplicate catalog problems appear only once', () => {
  const p = problem(1, 1400, [' dp ', 'dp', 'graphs']);
  const result = computeRecommendations([p, p, problem(2, 1400, ['graphs'])], [], 1400, analytics(['dp', 'graphs']));
  assert.equal(result.items.length, 2);
  assert.deepEqual(result.items[0].matchedWeakTags, ['dp', 'graphs']);
  assert.deepEqual(result.items[0].tags, ['dp', 'graphs']);
});
test('no weak-topic matches stays empty instead of silently broadening difficulty or topics', () => {
  const result = computeRecommendations([problem(1, 1400, ['graphs']), problem(2, 2000)], [], 1400, analytics());
  assert.equal(result.status, 'available');
  assert.equal(result.mode, 'weak-topics');
  assert.deepEqual(result.items, []);
});
test('empty/sparse/unflagged analytics use general practice and carry coverage', () => {
  const data = analytics(); data.topics[0].status = 'insufficient-data'; data.possiblyTruncated = true;
  const result = computeRecommendations([problem(1, 1400, ['graphs'])], [], 1400, data);
  assert.equal(result.mode, 'general-practice');
  assert.equal(result.items.length, 1);
  assert.equal(result.historyPossiblyTruncated, true);
});
test('catalog outage preserves stats and forced refresh retries recommendations', async () => {
  const catalog = mock.method(catalogService, 'getProblemCatalog', async () => { throw new Error('fixture outage'); });
  mock.method(console, 'warn', () => {});
  mock.method(axios, 'get', async url => ({ data: { status: 'OK', result: url.includes('user.info') ? [{ handle: 'outage', rating: 1400 }] : [] } }));
  const first = await getCodeForcesStats('outage');
  assert.equal(first.stats.recommendations.status, 'unavailable');
  assert.equal(first.stats.solvedCount, 0);
  assert.equal((await getCodeForcesStats('outage')).cacheHit, true);
  assert.equal(catalog.mock.callCount(), 1);
  catalog.mock.mockImplementation(async () => [problem(1)]);
  const next = await getCodeForcesStats('outage', true);
  assert.equal(next.stats.recommendations.status, 'available');
  assert.equal(next.stats.recommendations.items.length, 1);
});
test('refresh removes newly solved suggestions using the shared catalog', async () => {
  const catalog = mock.method(catalogService, 'getProblemCatalog', async () => [problem(1), problem(2)]);
  const submissions = [];
  mock.method(axios, 'get', async url => ({ data: { status: 'OK', result: url.includes('user.info') ? [{ handle: 'refresh', rating: 1400 }] : url.includes('user.status') ? submissions : [] } }));
  const first = await getCodeForcesStats('refresh');
  assert.equal(first.stats.recommendations.items.length, 2);
  submissions.push(sub(problem(1), 'OK'));
  const next = await getCodeForcesStats('refresh', true);
  assert.deepEqual(next.stats.recommendations.items.map(p => p.id), ['2:A']);
  assert.equal(catalog.mock.callCount(), 2);
});
