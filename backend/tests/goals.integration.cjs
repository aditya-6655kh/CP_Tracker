// Opt-in: uses the local PostgreSQL database, real HTTP routes and JWT auth.
// All Codeforces calls are fixtures. Only uniquely named test users are removed.
const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

test('goal HTTP lifecycle, persistence and owner isolation', { skip: process.env.RUN_DB_TESTS !== '1' }, async () => {
  require('dotenv').config({ quiet: true });
  const database = new URL(process.env.DATABASE_URL);
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(database.hostname), 'Integration tests require a local database');
  require('./register-typescript.cjs');
  const prisma = require('../src/lib/prisma.ts').default;
  const axios = require('axios');
  const app = require('../src/app.ts').default;
  const emails = [0, 1].map(i => `phase43-${randomUUID()}-${i}@example.invalid`);
  const password = randomUUID();
  let submissions = [];
  let unavailable = false;
  mock.method(axios, 'get', async url => {
    if (unavailable) throw new Error('Fixture upstream outage');
    const result = url.includes('user.info') ? [{ handle: 'goal_fixture', rating: 1200 }]
      : url.includes('user.status') ? submissions
      : url.includes('problemset.problems') ? { problems: [], problemStatistics: [] } : [];
    return { data: { status: 'OK', result } };
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function request(method, path, token, body, status = 200) {
    const response = await fetch(base + path, { method, headers: {
      'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = response.status === 204 ? null : await response.json();
    assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(data)}`);
    if (path.startsWith('/goals') && token) assert.equal(response.headers.get('cache-control'), 'no-store');
    return data;
  }
  try {
    const users = [];
    for (const email of emails) {
      const response = await request('POST', '/auth/register', null, { name: 'Phase 4.3 fixture', email, password }, 201);
      assert.equal(response.success, true);
      assert.ok(response.token && response.user.id);
      assert.equal('password' in response.user, false);
      users.push(response);
    }
    const [owner, other] = users;
    const login = await request('POST', '/auth/login', null, { email: emails[0], password });
    assert.equal(login.user.id, owner.user.id);
    assert.equal(login.success, true);
    await request('GET', '/goals', null, undefined, 401);
    const input = { targetCount: 2, deadline: new Date(Date.now() + 86400000).toISOString() };
    await request('POST', '/goals', owner.token, input, 400);
    await request('PATCH', '/profile', owner.token, { cfHandle: 'goal_fixture' });
    await request('POST', '/goals', owner.token, { ...input, userId: other.user.id }, 400);
    await request('POST', '/goals', owner.token, { ...input, deadline: new Date(0).toISOString() }, 400);
    const beforeCreate = Date.now();
    const created = (await request('POST', '/goals', owner.token, input, 201)).data;
    assert.equal(created.cfHandle, 'goal_fixture');
    assert.ok(new Date(created.startsAt).getTime() >= beforeCreate);
    assert.equal((await request('GET', '/goals', other.token)).data.length, 0);
    await request('PATCH', `/goals/${created.id}`, other.token, { targetCount: 1 }, 404);
    await request('DELETE', `/goals/${created.id}`, other.token, undefined, 404);

    // Shift only this fixture's start to avoid timing-dependent sleeps.
    await prisma.goal.update({ where: { id: created.id }, data: { startsAt: new Date(Date.now() - 60000) } });
    const accepted = { verdict: 'OK', contestId: 1, creationTimeSeconds: Math.floor(Date.now() / 1000) - 10,
      problem: { contestId: 1, index: 'A', name: 'Fixture', tags: ['math'] } };
    submissions = [accepted, { ...accepted, id: 2 }];
    let goal = (await request('GET', '/goals?refresh=true', owner.token)).data[0];
    assert.equal(goal.progress.solvedCount, 1);
    assert.equal(goal.progress.status, 'active');
    assert.equal(goal.progress.percent, 50);
    assert.equal('userId' in goal, false);
    const stats = (await request('GET', '/stats/codeforces', owner.token)).data;
    assert.equal('submissions' in stats, false);
    assert.ok(stats.topicAnalytics && stats.recommendations);
    await request('PATCH', `/goals/${created.id}`, owner.token, { targetCount: 1 });
    await request('PATCH', '/profile', owner.token, { cfHandle: 'changed_fixture' });
    goal = (await request('GET', '/goals', owner.token)).data[0];
    assert.equal(goal.cfHandle, 'goal_fixture');
    assert.equal(goal.progress.status, 'completed');
    await request('PATCH', '/profile', owner.token, { cfHandle: '' });
    assert.equal((await request('GET', '/goals', owner.token)).data[0].cfHandle, 'goal_fixture');
    unavailable = true;
    goal = (await request('GET', '/goals?refresh=true', owner.token)).data[0];
    assert.equal(goal.progress.solvedCount, null);
    assert.equal(goal.progress.status, 'unknown');
    unavailable = false;
    assert.equal((await request('GET', '/goals?refresh=true', owner.token)).data[0].progress.status, 'completed');
    await prisma.goal.update({ where: { id: created.id }, data: { deadline: new Date(Date.now() - 1000) } });
    await request('PATCH', `/goals/${created.id}`, owner.token, { targetCount: 3 }, 409);
    await request('DELETE', `/goals/${created.id}`, owner.token, undefined, 204);
    assert.deepEqual((await request('GET', '/goals', owner.token)).data, []);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    mock.restoreAll();
    try {
      // Exact random fixture emails; profile has no cascade, goals do.
      await prisma.$transaction([
        prisma.profile.deleteMany({ where: { user: { email: { in: emails } } } }),
        prisma.user.deleteMany({ where: { email: { in: emails } } }),
      ]);
    } finally { await prisma.$disconnect(); }
  }
});
