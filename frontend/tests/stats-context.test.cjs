const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');

function harness(platform = 'cf') {
  const field = platform === 'cf' ? 'cfHandle' : 'leetcodeHandle';
  let profile = { [field]: 'first' }, cursor = 0;
  const hooks = [], effects = [], requests = [];
  const same = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const react = {
    useState(initial) {
      const i = cursor++;
      hooks[i] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [hooks[i].value, value => { hooks[i].value = typeof value === 'function' ? value(hooks[i].value) : value; }];
    },
    useMemo(factory, deps) {
      const i = cursor++;
      if (!same(hooks[i]?.deps, deps)) hooks[i] = { value: factory(), deps };
      return hooks[i].value;
    },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useEffect(effect, deps) {
      const i = cursor++;
      if (!same(hooks[i]?.deps, deps)) {
        const previous = hooks[i];
        effects.push(() => { previous?.cleanup?.(); hooks[i] = { deps, cleanup: effect() }; });
      }
    },
  };
  const fetch = platform => force => new Promise((resolve, reject) => requests.push({ resolve, reject, force, platform }));
  const api = { getCodeforcesStats: fetch('cf'), getLeetcodeStats: fetch('lc') };
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename);
    const exports = {};
    cache.set(filename, exports);
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    });
    vm.runInNewContext(outputText, { exports, require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }) };
      if (name === '../api/stats.api') return api;
      if (name === './profile-context') return { useProfile: () => ({ profile }) };
      if (name === './stats-context') return { StatsContext: { Provider: 'provider' } };
      if (name === 'axios') return { isAxiosError: error => Boolean(error.isAxiosError) };
      return load(path.resolve(path.dirname(filename), name + '.ts'));
    } }, { filename });
    return exports;
  }
  const provider = load(path.join(__dirname, '../src/context/StatsContext.tsx'));
  return { requests,
    profile(value) { profile = value; },
    handle(value) { profile = { [field]: value }; },
    render() { cursor = 0; const value = provider.StatsProvider({ children: null }).props.value; while (effects.length) effects.shift()(); return value; },
    unmount() { hooks.forEach(hook => hook.cleanup?.()); },
  };
}
const flush = () => new Promise(setImmediate);

for (const platform of ['cf', 'lc']) {
  const stats = `${platform}Stats`, loading = `${platform}Loading`, error = `${platform}Error`;
  const refresh = platform === 'cf' ? 'refreshCf' : 'refreshLc';
  test(`${platform}: handle change ignores old success and failure`, async () => {
    const app = harness(platform); app.render(); app.handle('second');
    assert.equal(app.render()[loading], true);
    app.requests[1].resolve({ handle: 'second' }); await flush();
    app.requests[0].resolve({ handle: 'first' }); await flush();
    assert.equal(app.render()[stats].handle, 'second');
    app.render()[refresh](); app.render(); app.handle('third'); app.render();
    app.requests[2].reject(new Error('old failure')); await flush();
    assert.equal(app.render()[error], ''); assert.equal(app.render()[loading], true);
    assert.equal(app.render()[stats], null);
  });
  test(`${platform}: removal clears state and invalidates pending results`, async () => {
    const app = harness(platform); app.render(); app.handle(null); app.render();
    app.requests[0].reject(new Error('late failure')); await flush();
    const state = app.render();
    assert.equal(state[stats], null); assert.equal(state[loading], false); assert.equal(state[error], '');
  });
  test(`${platform}: navigation reuses data and latest refresh wins`, async () => {
    const app = harness(platform); app.render(); app.requests[0].resolve({ handle: 'first' }); await flush();
    app.render(); app.render(); assert.equal(app.requests.length, 1);
    app.render()[refresh](); app.render(); app.render()[refresh](); app.render();
    assert.equal(app.requests[1].force, true); assert.equal(app.requests[2].force, true);
    app.requests[2].resolve({ handle: 'fresh' }); await flush();
    app.requests[1].reject(new Error('late failure')); await flush();
    assert.equal(app.render()[stats].handle, 'fresh'); assert.equal(app.render()[error], '');
    assert.equal(app.render()[loading], false);
  });
  test(`${platform}: returning to a handle starts a distinct request`, async () => {
    const app = harness(platform); app.render(); app.requests[0].resolve({ handle: 'first' }); await flush();
    app.handle('second'); app.render(); app.handle('first');
    assert.equal(app.render()[loading], true);
    app.requests[2].resolve({ handle: 'first-new' }); await flush();
    app.requests[1].resolve({ handle: 'second' }); await flush();
    assert.equal(app.render()[stats].handle, 'first-new');
  });
  test(`${platform}: unmount prevents late completion`, async () => {
    const app = harness(platform); app.render(); app.unmount();
    app.requests[0].resolve({ handle: 'old' }); await flush();
    assert.equal(app.render()[stats], null);
  });
}
test('platform errors and refreshes are independent', async () => {
  const app = harness(); app.profile({ cfHandle: 'cf', leetcodeHandle: 'lc' }); app.render();
  app.requests[0].reject(new Error('Codeforces down')); app.requests[1].resolve({ handle: 'lc' }); await flush();
  assert.ok(app.render().cfError); assert.equal(app.render().lcStats.handle, 'lc');
  app.render().refreshAll(); app.render();
  assert.equal(app.requests.length, 4); assert.ok(app.requests.slice(2).every(request => request.force));
});
