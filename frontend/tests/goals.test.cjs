const fs = require('node:fs');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
for (const extension of ['.tsx', '.ts']) require.extensions[extension] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }, fileName: filename,
  });
  module._compile(outputText, filename);
};
const GoalCard = require('../src/components/dashboard/GoalCard.tsx').default;
const GoalEditor = require('../src/components/dashboard/GoalEditor.tsx').default;
const { toLocalDateTime, goalDeadlineToISO } = require('../src/utilities/goals.ts');
const goal = { id: 'goal', cfHandle: 'original', targetCount: 5, startsAt: '2026-01-01T00:00:00.000Z', deadline: '2099-01-08T00:00:00.000Z', progress: { solvedCount: 2, percent: 40, status: 'active', checkedAt: '2026-01-02T00:00:00.000Z', historyIncomplete: false, message: null } };
const render = (changes = {}) => renderToStaticMarkup(React.createElement(GoalCard, { goal: { ...goal, ...changes }, busy: false, onEdit() {}, onDelete() {} }));

test('goal shows bound handle, target, progress and edit/delete controls', () => {
  const html = render();
  assert.match(html, /@original/); assert.match(html, /2 \/ 5 solved/);
  assert.match(html, /In progress/); assert.match(html, /value="40" max="100"/);
  assert.match(html, /Edit goal/); assert.match(html, /Delete goal/);
});
test('unavailable evidence never displays zero progress or a progress bar', () => {
  const html = render({ progress: { ...goal.progress, solvedCount: null, percent: null, status: 'unknown', message: 'Progress unavailable. Refresh to retry.' } });
  assert.match(html, /Progress unverified/); assert.match(html, /Progress unavailable/);
  assert.doesNotMatch(html, /0 \/ 5/); assert.doesNotMatch(html, /<progress/);
});
test('incomplete history shows a lower bound and completed goals have a distinct label', () => {
  assert.match(render({ progress: { ...goal.progress, historyIncomplete: true } }), /At least 2/);
  assert.match(render({ progress: { ...goal.progress, solvedCount: 5, percent: 100, status: 'completed' } }), /Completed/);
});
test('expired goals cannot be edited', () => {
  const html = render({ deadline: '2020-01-01T00:00:00.000Z', progress: { ...goal.progress, status: 'expired' } });
  assert.match(html, /Deadline passed/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Edit goal/);
});
test('new-goal form describes local deadline, range and start/re-solve semantics', () => {
  const html = renderToStaticMarkup(React.createElement(GoalEditor, { goal: null, handle: 'linked', busy: false, onSave() {}, onCancel() {} }));
  assert.match(html, /@linked/); assert.match(html, /Deadline \(your local time\)/);
  assert.match(html, /min="1" max="1000"/); assert.match(html, /Tracking starts when you save/);
  assert.match(html, /previously solved problems you solve again/);
});
test('editing keeps original handle and deadline regardless of current profile', () => {
  const html = renderToStaticMarkup(React.createElement(GoalEditor, { goal, handle: 'changed', busy: false, onSave() {}, onCancel() {} }));
  assert.match(html, /@original/); assert.doesNotMatch(html, /@changed/);
  assert.match(html, /original start time and handle/);
});
test('local date conversion roundtrips in different timezones', () => {
  const previous = process.env.TZ;
  try {
    for (const zone of ['UTC', 'Asia/Kolkata', 'America/New_York']) {
      process.env.TZ = zone;
      const iso = '2027-02-15T16:45:00.000Z';
      assert.equal(goalDeadlineToISO(toLocalDateTime(iso)), iso);
    }
    assert.equal(goalDeadlineToISO('not-a-date'), null);
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});
