const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');

function harness() {
  let cfStats = null, cursor = 0;
  const hooks = [], effects = [], reads = [], writes = [];
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useState(initial) { const i = cursor++; hooks[i] ??= { value: initial }; return [hooks[i].value, value => { hooks[i].value = typeof value === 'function' ? value(hooks[i].value) : value; }]; },
    useRef(initial) { const i = cursor++; return hooks[i] ??= { current: initial }; },
    useCallback(callback, deps) { const i = cursor++; if (!same(hooks[i]?.deps, deps)) hooks[i] = { value: callback, deps }; return hooks[i].value; },
    useEffect(effect, deps) { const i = cursor++; if (!same(hooks[i]?.deps, deps)) { const previous = hooks[i]; effects.push(() => { previous?.cleanup?.(); hooks[i] = { deps, cleanup: effect() }; }); } },
  };
  const api = {
    getGoals(force) { return new Promise((resolve, reject) => reads.push({ resolve, reject, force })); },
    createGoal(input) { return new Promise((resolve, reject) => writes.push({ resolve, reject, input })); },
    updateGoal(id, input) { return new Promise((resolve, reject) => writes.push({ resolve, reject, id, input })); },
    deleteGoal(id) { return new Promise((resolve, reject) => writes.push({ resolve, reject, id })); },
  };
  const filename = path.join(__dirname, '../src/hooks/useGoals.ts');
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const exports = {};
  vm.runInNewContext(outputText, { exports, require(name) {
    if (name === 'react') return react;
    if (name === 'axios') return { isAxiosError: () => false };
    if (name === '../api/goals.api') return api;
    if (name === '../context/stats-context') return { useStats: () => ({ cfStats }) };
    throw new Error(name);
  } });
  return { reads, writes,
    stats(value) { cfStats = value; },
    render() { cursor = 0; const value = exports.useGoals(); while (effects.length) effects.shift()(); return value; },
    unmount() { hooks.forEach(hook => hook.cleanup?.()); },
  };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
test('refresh ignores old list/error responses and forces only the requested refresh', async () => {
  const app = harness(); app.render();
  app.render().refresh(true); app.render();
  assert.equal(app.reads[1].force, true);
  app.reads[1].resolve([{ id: 'fresh' }]); await flush();
  app.reads[0].reject(new Error('old')); await flush();
  assert.equal(app.render().goals[0].id, 'fresh'); assert.equal(app.render().error, '');
  app.stats({ handle: 'updated' }); app.render();
  assert.equal(app.reads[2].force, false);
});
test('successful mutations reload goals; a prior list cannot overwrite the result', async () => {
  const app = harness(); app.render();
  const save = app.render().save({ targetCount: 2, deadline: 'future' });
  app.reads[0].resolve([{ id: 'stale' }]); await flush();
  assert.equal(app.render().goals.length, 0);
  app.writes[0].resolve(); assert.equal(await save, true);
  app.render(); app.reads[1].resolve([{ id: 'saved' }]); await flush();
  assert.equal(app.render().goals[0].id, 'saved');
  const remove = app.render().remove('saved');
  app.writes[1].resolve(); await remove; app.render();
  app.reads[2].resolve([]); await flush(); assert.equal(app.render().goals.length, 0);
});
test('failed save retains existing goals and returns a retryable error', async () => {
  const app = harness(); app.render(); app.reads[0].resolve([{ id: 'existing' }]); await flush();
  const save = app.render().save({ targetCount: 2, deadline: 'future' }, 'existing');
  app.writes[0].reject(new Error('offline'));
  assert.equal(await save, false);
  assert.equal(app.render().goals[0].id, 'existing'); assert.match(app.render().error, /try again/);
  assert.equal(app.render().busy, false);
});
test('unmount invalidates pending goal reads', async () => {
  const app = harness(); app.render(); app.unmount(); app.reads[0].resolve([{ id: 'old' }]); await flush();
  assert.equal(app.render().goals.length, 0);
});

test('background stats cannot downgrade a pending forced goal refresh', async () => {
  const app = harness(); app.render(); app.reads[0].resolve([{ id: 'goal', solved: 1 }]); await flush();
  app.render().refresh(true); app.render();
  app.stats({ handle: 'late initial stats' }); app.render();
  assert.equal(app.reads[1].force, true);
  assert.equal(app.reads[2].force, true);
  app.reads[2].resolve([{ id: 'goal', solved: 2 }]); await flush();
  app.reads[1].reject(new Error('superseded')); await flush();
  assert.equal(app.render().goals[0].solved, 2);
  assert.equal(app.render().error, ''); assert.equal(app.render().loading, false);
  app.stats({ handle: 'later stats' }); app.render();
  assert.equal(app.reads[3].force, false);
});
test('failed forced goal refresh permits an ordinary subsequent read', async () => {
  const app = harness(); app.render(); app.reads[0].resolve([]); await flush();
  app.render().refresh(true); app.render(); app.reads[1].reject(new Error('outage')); await flush();
  assert.equal(app.render().loading, false); assert.ok(app.render().error);
  app.stats({ handle: 'recovered' }); app.render(); assert.equal(app.reads[2].force, false);
});
