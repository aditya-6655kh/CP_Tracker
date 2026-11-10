require('./register-typescript.cjs');
const { test, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const catalogService = require('../src/services/problem-catalog.service.ts');
beforeEach(() => mock.method(catalogService, 'getProblemCatalog', async () => []));
const { computeTopicAnalytics, getCodeForcesStats, CodeforcesApiError } = require('../src/services/codeforces.services.ts');

function submission(index, verdict = 'WRONG_ANSWER', tags = ['dp'], contestId = 1) {
  return {
    id: Number(index) || 1, contestId, creationTimeSeconds: 1577836800,
    problem: { contestId, index: String(index), name: `Problem ${index}`, type: 'PROGRAMMING', tags },
    verdict, programmingLanguage: 'C++', passedTestCount: 0,
    timeConsumedMillis: 0, memoryConsumedBytes: 0,
  };
}
const problems = (count, solved = 0, tag = 'dp') => Array.from({ length: count }, (_, i) => submission(i, i < solved ? 'OK' : 'WRONG_ANSWER', [tag]));
afterEach(() => mock.restoreAll());

test('empty history has no topics and complete zero coverage', () => {
  assert.deepEqual(computeTopicAnalytics([]), {
    topics: [], submissionsFetched: 0, excludedSubmissions: 0, possiblyTruncated: false,
    minimumAttemptedProblems: 5, weakSolveRateThreshold: 0.5,
  });
});

test('retries count once and acceptance survives subsequent failures and reordered input', () => {
  const input = [submission('A'), submission('A', 'OK'), submission('A', 'OK'), submission('A')];
  const before = structuredClone(input);
  const result = computeTopicAnalytics(input);
  assert.deepEqual(result.topics, [{ tag: 'dp', attemptedProblems: 1, solvedProblems: 1, solveRate: 1, status: 'insufficient-data' }]);
  assert.deepEqual(computeTopicAnalytics([...input].reverse()), result);
  assert.deepEqual(input, before);
});

test('multi-tag problems count once per normalized tag and missing rating is supported', () => {
  const result = computeTopicAnalytics([submission('A', 'OK', [' dp ', 'dp', '', ' ', 'graphs'])]);
  assert.deepEqual(result.topics.map(t => [t.tag, t.attemptedProblems, t.solvedProblems]), [['dp', 1, 1], ['graphs', 1, 1]]);
});

test('problem identity uses problem contest ID, falls back to submission contest ID, and never names', () => {
  const fallback = submission('B');
  delete fallback.problem.contestId;
  const noId = submission('C');
  delete noId.contestId;
  delete noId.problem.contestId;
  const invalid = submission(' ');
  const preferred = submission('A');
  preferred.contestId = 99;
  const result = computeTopicAnalytics([submission('A'), submission('A', 'OK', ['dp'], 2), fallback, noId, invalid, preferred]);
  assert.equal(result.topics[0].attemptedProblems, 3);
  assert.equal(result.topics[0].solvedProblems, 1);
  assert.equal(result.excludedSubmissions, 2);
});

test('pending, missing, unknown, system and skipped verdicts are excluded', () => {
  const input = ['TESTING', 'UNKNOWN', 'FAILED', 'SKIPPED', 'REJECTED'].map((v, i) => submission(i, v));
  const missing = submission('missing');
  delete missing.verdict;
  const result = computeTopicAnalytics([...input, missing]);
  assert.equal(result.excludedSubmissions, 6);
  assert.deepEqual(result.topics, []);
});

test('supported judged outcomes count as attempts', () => {
  const verdicts = ['OK', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'COMPILATION_ERROR', 'PRESENTATION_ERROR', 'IDLENESS_LIMIT_EXCEEDED', 'CRASHED', 'CHALLENGED'];
  const result = computeTopicAnalytics(verdicts.map((v, i) => submission(i, v)));
  assert.equal(result.topics[0].attemptedProblems, 10);
  assert.equal(result.topics[0].solvedProblems, 1);
  assert.equal(result.excludedSubmissions, 0);
});

test('untagged acceptance resolves a tagged retry; wholly untagged problems are excluded', () => {
  const input = [submission('A'), submission('A', 'OK', []), submission('B', 'OK', [])];
  const result = computeTopicAnalytics(input);
  assert.equal(result.topics[0].solveRate, 1);
  assert.equal(result.excludedSubmissions, 1);
  assert.deepEqual(computeTopicAnalytics(input.reverse()), result);
});

for (const [attempted, solved, expected] of [[4, 0, 'insufficient-data'], [5, 0, 'weak'], [5, 2, 'weak'], [6, 3, 'not-flagged'], [5, 5, 'not-flagged'], [2001, 1000, 'weak']]) {
  test(`classification: ${solved}/${attempted} is ${expected} without rounding`, () => {
    assert.equal(computeTopicAnalytics(problems(attempted, solved)).topics[0].status, expected);
  });
}

test('weak topics sort first, with rate, sample size and tag tie breakers', () => {
  const input = [problems(5, 1, 'z'), problems(5, 1, 'a'), problems(10, 2, 'b'), problems(5, 0, 'c'), problems(5, 5, 'solved'), problems(1, 0, 'sparse')]
    .flatMap((group, i) => group.map(sub => ({ ...sub, contestId: i + 1, problem: { ...sub.problem, contestId: i + 1 } })));
  assert.deepEqual(computeTopicAnalytics(input).topics.map(t => t.tag), ['c', 'b', 'a', 'z', 'solved', 'sparse']);
});

test('coverage warns at the fetch cap without asserting proven truncation', () => {
  assert.equal(computeTopicAnalytics(problems(9999)).possiblyTruncated, false);
  assert.equal(computeTopicAnalytics(problems(10000)).possiblyTruncated, true);
});

function upstream(input, failure = false) {
  return mock.method(axios, 'get', async (url) => {
    if (failure) throw new Error('upstream unavailable');
    if (url.includes('/user.info')) return { data: { status: 'OK', result: [{ handle: new URL(url).searchParams.get('handles'), rating: 1400, maxRating: 1500, rank: 'specialist', maxRank: 'specialist' }] } };
    if (url.includes('/user.rating')) return { data: { status: 'OK', result: [] } };
    assert.match(url, /\/user.status\?.*&from=1&count=10000$/);
    return { data: { status: 'OK', result: input } };
  });
}

test('stats cache reuses analytics, refresh/expiry recompute, and handles are isolated', async () => {
  const input = problems(5, 1);
  const api = upstream(input);
  let now = 1000;
  mock.method(Date, 'now', () => now);
  const first = await getCodeForcesStats('cache-fixture');
  assert.equal(first.cacheHit, false);
  assert.equal(api.mock.callCount(), 3);
  assert.equal(first.stats.topicAnalytics.topics[0].solveRate, 0.2);
  assert.equal((await getCodeForcesStats('cache-fixture')).cacheHit, true);
  assert.equal(api.mock.callCount(), 3);
  input[1].verdict = 'OK';
  const refreshed = await getCodeForcesStats('cache-fixture', true);
  assert.equal(refreshed.cacheHit, false);
  assert.equal(refreshed.stats.topicAnalytics.topics[0].solveRate, 0.4);
  assert.equal(api.mock.callCount(), 6);
  await getCodeForcesStats('other-fixture');
  assert.equal(api.mock.callCount(), 9);
  now += 300000;
  assert.equal((await getCodeForcesStats('cache-fixture')).cacheHit, false);
  assert.equal(api.mock.callCount(), 12);
});

test('existing stats calculations remain unchanged', async () => {
  upstream([submission('A', 'OK'), submission('A', 'OK'), submission('B')]);
  const { stats } = await getCodeForcesStats('regression-fixture');
  const { topicAnalytics, recommendations, ...existing } = stats;
  assert.equal(recommendations.status, 'available');
  assert.deepEqual(existing, {
    userInfo: { handle: 'regression-fixture', rating: 1400, maxRating: 1500, rank: 'specialist', maxRank: 'specialist' },
    solvedCount: 1, ratingHistory: [],
    submissionStats: { totalSubmissions: 3, accepted: 2, wrongAnswer: 1, timeLimitExceeded: 0, memoryLimitExceeded: 0, runtimeError: 0, compilationError: 0, other: 0 },
    codeforcesActivity: [{ date: '2020-01-01', count: 3 }], streak: { current: 0, max: 1 },
  });
  assert.equal(topicAnalytics.topics[0].solveRate, 0.5);
});

test('upstream failures retain typed errors and never cache an incomplete response', async () => {
  const failing = upstream([], true);
  await assert.rejects(getCodeForcesStats('failure-fixture'), CodeforcesApiError);
  failing.mock.restore();
  const api = upstream([]);
  const result = await getCodeForcesStats('failure-fixture');
  assert.equal(result.cacheHit, false);
  assert.equal(api.mock.callCount(), 3);
});
