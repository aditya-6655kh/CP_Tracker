// A deterministic hook harness tests request ordering without a DOM dependency.
// It explicitly runs effect cleanup on dependency changes and unmount.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');

function harness() {
  let profile = { cfHandle: 'first' };
  let cursor = 0;
  const hooks = [], effects = [], requests = [];
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    createContext: () => ({ Provider: 'provider' }),
    useState(initial) {
      const i = cursor++;
      hooks[i] ??= { value: initial };
      return [hooks[i].value, value => { hooks[i].value = value; }];
    },
    useRef(initial) { const i = cursor++; return hooks[i] ??= { current: initial }; },
    useCallback(callback, deps) {
      const i = cursor++;
      if (!same(hooks[i]?.deps, deps)) hooks[i] = { value: callback, deps };
      return hooks[i].value;
    },
    useEffect(effect, deps) {
      const i = cursor++;
      if (!same(hooks[i]?.deps, deps)) {
        const previous = hooks[i];
        effects.push(() => { previous?.cleanup?.(); hooks[i] = { deps, cleanup: effect() }; });
      }
    },
  };
  const api = {
    getCodeforcesStats(force) {
      return new Promise((resolve, reject) => requests.push({ resolve, reject, force }));
    },
    getLeetcodeStats() { throw new Error('Unlinked LeetCode should not fetch'); },
  };
  const filename = path.join(__dirname, '../src/context/StatsContext.tsx');
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }) };
      if (name === '../api/stats.api') return api;
      if (name === './ProfileContext') return { useProfile: () => ({ profile }) };
      throw new Error(`Unexpected import ${name}`);
    },
  }, { filename });
  return {
    requests,
    profile(value) { profile = value; },
    render() {
      cursor = 0;
      const value = exports.StatsProvider({ children: null }).props.value;
      while (effects.length) effects.shift()();
      return value;
    },
    unmount() { hooks.forEach(hook => hook.cleanup?.()); },
  };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('handle change ignores an old success and preserves current loading', async () => {
  const app = harness();
  app.render();
  app.profile({ cfHandle: 'second' });
  app.render();
  app.requests[0].resolve({ handle: 'first' });
  await flush();
  assert.equal(app.render().cfStats, null);
  assert.equal(app.render().cfLoading, true);
  const second = { handle: 'second' };
  app.requests[1].resolve(second);
  await flush();
  assert.equal(app.render().cfStats, second);
  assert.equal(app.render().cfLoading, false);
});
test('handle removal invalidates a pending request and clears errors/loading', async () => {
  const app = harness();
  app.render();
  app.profile({ cfHandle: null });
  app.render();
  app.requests[0].reject(new Error('old failure'));
  await flush();
  const state = app.render();
  assert.equal(state.cfStats, null);
  assert.equal(state.cfLoading, false);
  assert.equal(state.cfError, '');
});
test('navigation reuses cached state, refresh forces fetch, and latest refresh wins', async () => {
  const app = harness();
  app.render();
  const original = { handle: 'first' };
  app.requests[0].resolve(original);
  await flush();
  app.render(); app.render();
  assert.equal(app.requests.length, 1);
  app.render().refreshCf();
  app.render().refreshCf();
  assert.equal(app.requests[1].force, true);
  app.requests[2].resolve({ handle: 'fresh' });
  await flush();
  app.requests[1].reject(new Error('older failure'));
  await flush();
  assert.equal(app.render().cfStats.handle, 'fresh');
  assert.equal(app.render().cfError, '');
});
test('unmount cleanup prevents a pending completion from updating the cache', async () => {
  const app = harness();
  app.render();
  app.unmount();
  app.requests[0].resolve({ handle: 'old' });
  await flush();
  assert.equal(app.render().cfStats, null);
});
