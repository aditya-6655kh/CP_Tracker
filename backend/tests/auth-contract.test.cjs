require('./register-typescript.cjs');
const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = { user: { async findUnique() { return null; }, async create() {} } };
const prismaPath = require.resolve('../src/lib/prisma.ts');
require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: { __esModule: true, default: prisma } };
const { Register, Login } = require('../src/controllers/auth.controller.ts');
const user = { id: 'fixture', email: 'test@example.com', name: 'Test', password: 'hashed', createdAt: new Date(), updatedAt: new Date() };
const previousSecret = process.env.JWT_SECRET;
afterEach(() => { mock.restoreAll(); if (previousSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previousSecret; });
const response = () => ({ statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } });

test('register returns a usable token and safe user, normalizes email and creates profile', async () => {
  process.env.JWT_SECRET = 'test-only-auth-secret';
  mock.method(bcrypt, 'hash', async () => 'hashed');
  const lookup = mock.method(prisma.user, 'findUnique', async () => null);
  const create = mock.method(prisma.user, 'create', async () => user);
  const res = response();
  await Register({ body: { name: 'Test', email: 'Test@Example.com', password: 'password123' } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.equal(jwt.verify(res.body.token, process.env.JWT_SECRET).userId, user.id);
  assert.equal(res.body.user.id, user.id);
  assert.equal('password' in res.body.user, false);
  assert.equal(lookup.mock.calls[0].arguments[0].where.email, 'test@example.com');
  assert.deepEqual(create.mock.calls[0].arguments[0].data.profile, { create: {} });
});
test('login returns the same frontend auth contract', async () => {
  process.env.JWT_SECRET = 'test-only-auth-secret';
  mock.method(prisma.user, 'findUnique', async () => user);
  mock.method(bcrypt, 'compare', async () => true);
  const res = response();
  await Login({ body: { email: user.email, password: 'password123' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.name, 'Test');
  assert.equal(res.body.id, user.id);
  assert.equal('password' in res.body.user, false);
  assert.equal(jwt.verify(res.body.token, process.env.JWT_SECRET).userId, user.id);
});
test('registration does not create an account if signing is unconfigured', async () => {
  delete process.env.JWT_SECRET;
  const create = mock.method(prisma.user, 'create');
  const res = response();
  await Register({ body: { name: 'Test', email: user.email, password: 'password123' } }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(create.mock.callCount(), 0);
});
