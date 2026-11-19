require('./register-typescript.cjs');
const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const prisma = { profile: { async findUnique() { return null; } }, goal: {
  async create() {}, async findFirst() {}, async findMany() { return []; },
  async updateMany() { return { count: 0 }; }, async deleteMany() { return { count: 0 }; },
} };
const prismaPath = require.resolve('../src/lib/prisma.ts');
require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: { __esModule: true, default: prisma } };
const service = require('../src/services/goals.service.ts');
const snapshots = require('../src/services/codeforces.services.ts');
const controller = require('../src/controllers/goals.controller.ts');
const { computeGoalProgress } = require('../src/services/goal-progress.ts');
afterEach(() => mock.restoreAll());

const start = new Date('2026-11-10T00:00:00.000Z');
const deadline = new Date('2026-11-12T00:00:00.000Z');
const goal = { id: 'g1', userId: 'owner', cfHandle: 'original', targetCount: 2, startsAt: start, deadline, createdAt: start };
const accepted = (contestId, time = start.getTime(), index = 'A') => ({
  verdict: 'OK', contestId, creationTimeSeconds: time / 1000,
  problem: { contestId, index, name: 'Same name', tags: [] },
});
const later = new Date(deadline.getTime() + 1000);
const futureInput = () => ({ targetCount: 10, deadline: new Date(Date.now() + 7 * 86400000).toISOString() });

test('goal counts distinct identities within [start, deadline), including re-solves', () => {
  const input = [accepted(1, start.getTime() - 1000), accepted(1), accepted(1), accepted(2, start.getTime() + 1000), accepted(3, deadline.getTime()), { ...accepted(4), verdict: 'WRONG_ANSWER' }, { ...accepted(5), verdict: undefined }];
  const before = structuredClone(input);
  const result = computeGoalProgress(goal, input, later, later);
  assert.equal(result.solvedCount, 2);
  assert.equal(result.status, 'completed');
  assert.equal(result.percent, 100);
  assert.deepEqual(computeGoalProgress(goal, [...input].reverse(), later, later), result);
  assert.deepEqual(input, before);
});
test('expired and active are distinguished from stale or unavailable evidence', () => {
  assert.equal(computeGoalProgress(goal, [], later, later).status, 'expired');
  const stale = computeGoalProgress(goal, [], start, later);
  assert.equal(stale.status, 'unknown'); assert.match(stale.message, /Refresh/);
  assert.equal(computeGoalProgress(goal, [], start, new Date(start.getTime() + 1000)).status, 'active');
});
test('history cap only makes coverage incomplete when it can cut into the goal window', () => {
  const input = Array.from({ length: 10000 }, () => accepted(1, start.getTime() + 1000));
  const incomplete = computeGoalProgress(goal, input, later, later);
  assert.equal(incomplete.historyIncomplete, true);
  assert.equal(incomplete.status, 'unknown');
  input.push(accepted(2, start.getTime() - 1000));
  assert.equal(computeGoalProgress(goal, input, later, later).historyIncomplete, false);
  input[10000] = accepted(2, start.getTime());
  assert.equal(computeGoalProgress(goal, input, later, later).historyIncomplete, true);
});
test('missing identity or timestamp is disclosed and submission contest ID is a fallback', () => {
  const fallback = accepted(1); delete fallback.problem.contestId;
  const missing = accepted(2); delete missing.problem.contestId; delete missing.contestId;
  const result = computeGoalProgress(goal, [fallback, missing, accepted(3, NaN)], later, later);
  assert.equal(result.solvedCount, 1);
  assert.equal(result.historyIncomplete, true);
  assert.equal(result.status, 'unknown');
});
test('observed target completion remains provable even with incomplete history', () => {
  const result = computeGoalProgress({ ...goal, targetCount: 1 }, [accepted(1), accepted(2, NaN)], later, later);
  assert.equal(result.status, 'completed'); assert.equal(result.percent, 100);
});
test('input rejects invalid counts, dates, unknown keys and client-supplied identity/start', () => {
  const valid = { targetCount: 5, deadline: deadline.toISOString() };
  for (const body of [null, [], {}, { ...valid, targetCount: '5' }, { ...valid, targetCount: 0 }, { ...valid, targetCount: 1.5 }, { ...valid, targetCount: 1001 }, { ...valid, deadline: start.toISOString() }, { ...valid, deadline: '2026-02-30T00:00:00.000Z' }, { ...valid, deadline: '2030-01-01T00:00:00.000Z' }, { ...valid, userId: 'other' }, { ...valid, cfHandle: 'other' }, { ...valid, startsAt: start.toISOString() }]) {
    assert.throws(() => service.validateGoalInput(body, false, start), service.GoalError);
  }
  assert.deepEqual(service.validateGoalInput({ targetCount: 1 }, true, start), { targetCount: 1 });
  assert.throws(() => service.validateGoalInput({}, true, start), service.GoalError);
});
test('creation uses authenticated owner, linked handle and server start time', async () => {
  const profile = mock.method(prisma.profile, 'findUnique', async () => ({ cfHandle: 'linked' }));
  const create = mock.method(prisma.goal, 'create', async ({ data }) => ({ id: 'created', ...data }));
  const before = Date.now();
  const result = await service.createGoal('owner', futureInput());
  assert.equal(result.userId, 'owner'); assert.equal(result.cfHandle, 'linked');
  assert.ok(result.startsAt.getTime() >= before);
  assert.deepEqual(profile.mock.calls[0].arguments[0].where, { userId: 'owner' });
  assert.equal(create.mock.callCount(), 1);
});
test('creation requires a linked handle and does not insert on invalid input', async () => {
  const create = mock.method(prisma.goal, 'create');
  await assert.rejects(service.createGoal('owner', futureInput()), { statusCode: 400 });
  assert.equal(create.mock.callCount(), 0);
});
test('update and delete are owner-scoped and hide other users goals', async () => {
  const lookup = mock.method(prisma.goal, 'findFirst', async () => null);
  const update = mock.method(prisma.goal, 'updateMany');
  const remove = mock.method(prisma.goal, 'deleteMany', async () => ({ count: 0 }));
  await assert.rejects(service.updateGoal('intruder', 'g1', { targetCount: 4 }), { statusCode: 404 });
  await assert.rejects(service.deleteGoal('intruder', 'g1'), { statusCode: 404 });
  assert.deepEqual(lookup.mock.calls[0].arguments[0].where, { id: 'g1', userId: 'intruder' });
  assert.deepEqual(remove.mock.calls[0].arguments[0].where, { id: 'g1', userId: 'intruder' });
  assert.equal(update.mock.callCount(), 0);
});
test('editing preserves start/handle, supports partial input and refuses ended goals', async () => {
  const current = { ...goal, deadline: new Date(Date.now() + 86400000) };
  const find = mock.method(prisma.goal, 'findFirst', async () => current);
  const update = mock.method(prisma.goal, 'updateMany', async () => ({ count: 1 }));
  await service.updateGoal('owner', 'g1', { targetCount: 3 });
  assert.deepEqual(update.mock.calls[0].arguments[0].data, { targetCount: 3 });
  assert.equal(update.mock.calls[0].arguments[0].where.userId, 'owner');
  find.mock.mockImplementation(async () => ({ ...goal, deadline: new Date(0) }));
  await assert.rejects(service.updateGoal('owner', 'g1', { targetCount: 4 }), { statusCode: 409 });
});
test('goal list groups requests by saved handle and never falls back to another handle', async () => {
  const list = mock.method(prisma.goal, 'findMany', async () => [goal, { ...goal, id: 'g2' }, { ...goal, id: 'g3', cfHandle: 'offline' }]);
  const fetch = mock.method(snapshots, 'getCodeforcesSnapshot', async handle => {
    if (handle === 'offline') throw new Error('unreachable');
    return { snapshot: { submissions: [accepted(1)], fetchedAt: later } };
  });
  const result = await service.listGoals('owner', true);
  assert.deepEqual(list.mock.calls[0].arguments[0].where, { userId: 'owner' });
  assert.equal(fetch.mock.callCount(), 2);
  assert.ok(fetch.mock.calls.every(call => call.arguments[1] === true));
  assert.equal(result[0].cfHandle, 'original');
  assert.equal(result[0].progress.solvedCount, 1);
  assert.equal(result[2].progress.solvedCount, null);
  assert.equal(result[2].progress.status, 'unknown');
  assert.ok(result.every(item => !('submissions' in item) && !('userId' in item)));
});
test('empty goals do not fetch Codeforces', async () => {
  const fetch = mock.method(snapshots, 'getCodeforcesSnapshot');
  assert.deepEqual(await service.listGoals('owner'), []);
  assert.equal(fetch.mock.callCount(), 0);
});
test('controller requires authentication and prevents browser caching of private goals', async () => {
  const response = () => ({ statusCode: 200, headers: {}, status(n) { this.statusCode = n; return this; }, setHeader(k, v) { this.headers[k] = v; }, json(value) { this.body = value; } });
  const a = response(); await controller.fetchGoals({ query: {} }, a);
  assert.equal(a.statusCode, 401);
  const b = response(); await controller.fetchGoals({ userId: 'owner', query: {} }, b);
  assert.equal(b.headers['Cache-Control'], 'no-store');
  assert.deepEqual(b.body, { success: true, data: [] });
});
