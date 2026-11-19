const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');

function client() {
  let rejectResponse, removed = 0;
  const window = { location: { href: '/current' } };
  const axios = { create: () => ({ interceptors: {
    request: { use() {} }, response: { use(resolve, reject) { rejectResponse = reject; } },
  } }) };
  const source = fs.readFileSync(path.join(__dirname, '../src/api/axios.ts'), 'utf8').replace('import.meta.env.VITE_API_URL', 'undefined');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } });
  vm.runInNewContext(outputText, { exports: {}, require: () => axios, window,
    localStorage: { getItem: () => null, removeItem: () => { removed++; } } });
  return { window, removed: () => removed, reject: error => rejectResponse(error) };
}
for (const url of ['auth/login', '/auth/login', 'https://example.test/api/auth/login?retry=1', 'auth/register']) {
  test(`401 from ${url} stays on the form and preserves the original error`, async () => {
    const app = client(); const error = { config: { url }, response: { status: 401, data: { message: 'Invalid credentials' } } };
    await assert.rejects(app.reject(error), actual => actual === error);
    assert.equal(app.window.location.href, '/current'); assert.equal(app.removed(), 0);
  });
}
test('401 from a protected endpoint still clears the expired session', async () => {
  const app = client(); await app.reject({ config: { url: 'goals' }, response: { status: 401 } }).catch(() => {});
  assert.equal(app.window.location.href, '/login'); assert.equal(app.removed(), 1);
});
test('network and server failures do not redirect or log out', async () => {
  const app = client(); await app.reject(new Error('offline')).catch(() => {});
  await app.reject({ config: { url: 'goals' }, response: { status: 500 } }).catch(() => {});
  assert.equal(app.window.location.href, '/current'); assert.equal(app.removed(), 0);
});
