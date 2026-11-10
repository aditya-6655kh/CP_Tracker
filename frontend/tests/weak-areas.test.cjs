const fs = require('node:fs');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

require.extensions['.tsx'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
const WeakAreas = require('../src/components/dashboard/CodeforcesWeakAreas.tsx').default;
const base = { topics: [], submissionsFetched: 0, excludedSubmissions: 0, possiblyTruncated: false, minimumAttemptedProblems: 5, weakSolveRateThreshold: 0.5 };
const render = analytics => renderToStaticMarkup(React.createElement(WeakAreas, { analytics }));
const topic = (status, attemptedProblems = 5, solvedProblems = 1) => ({ tag: 'dp', status, attemptedProblems, solvedProblems, solveRate: solvedProblems / attemptedProblems });

test('empty history explains how to get insights', () => {
  assert.match(render(base), /No eligible tagged problems yet/);
  assert.doesNotMatch(render(base), /<table/);
});
test('older response leaves existing stats usable', () => {
  assert.match(render(undefined), /Topic analytics are unavailable/);
});
test('sparse history is insufficient rather than a weak area', () => {
  const html = render({ ...base, topics: [topic('insufficient-data', 4, 0)] });
  assert.match(html, /Not enough data yet/);
  assert.match(html, /Insufficient data/);
  assert.doesNotMatch(html, /Needs practice/);
});
test('eligible topics show their measured counts, rates and practice signal', () => {
  const html = render({ ...base, topics: [topic('weak')], submissionsFetched: 7, excludedSubmissions: 2 });
  assert.match(html, /1 topic needs practice/);
  assert.match(html, /20.0%/);
  assert.match(html, /Needs practice/);
  assert.match(html, /7 fetched submissions; 2 excluded/);
  assert.match(html, /scope="row"/);
});
test('no weak topics does not claim mastery', () => {
  const html = render({ ...base, topics: [topic('not-flagged', 6, 3)] });
  assert.match(html, /No topics are flagged/);
  assert.match(html, /Not flagged/);
});
test('coverage warning is conditional and explains missing acceptances', () => {
  assert.doesNotMatch(render(base), /limit was reached/);
  assert.match(render({ ...base, possiblyTruncated: true }), /Older attempts or accepted solutions may be missing/);
});
