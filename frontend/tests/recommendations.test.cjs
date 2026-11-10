const fs = require('node:fs');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
require.extensions['.tsx'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }, fileName: filename,
  });
  module._compile(outputText, filename);
};
const Recommendations = require('../src/components/dashboard/CodeforcesRecommendations.tsx').default;
const base = { status: 'available', mode: 'weak-topics', targetRating: 1400, minRating: 1200, maxRating: 1600, usedDefaultRating: false, weakTags: ['dp'], historyPossiblyTruncated: false, items: [] };
const item = { id: '1:A', contestId: 1, index: 'A', name: 'Example <problem>', rating: 1400, tags: ['dp'], matchedWeakTags: ['dp'], previouslyAttempted: true, url: 'https://codeforces.com/problemset/problem/1/A' };
const render = recommendations => renderToStaticMarkup(React.createElement(Recommendations, { recommendations }));

test('older responses and catalog outages have a local recovery message', () => {
  for (const data of [undefined, { ...base, status: 'unavailable' }]) {
    assert.match(render(data), /temporarily unavailable/);
    assert.match(render(data), /Your stats are still available/);
    assert.doesNotMatch(render(data), /No matching problems/);
  }
});
test('no matches is distinct from a catalog failure', () => {
  const html = render(base);
  assert.match(html, /No matching problems were found/);
  assert.match(html, /weakest topics: dp/);
  assert.doesNotMatch(html, /temporarily unavailable/);
});
test('recommendation cards show reasons, rating, safe external links and escaped titles', () => {
  const html = render({ ...base, items: [item] });
  assert.match(html, /Targets: dp/);
  assert.match(html, /Rating 1400/);
  assert.match(html, /Previously attempted/);
  assert.match(html, /href="https:\/\/codeforces.com\/problemset\/problem\/1\/A"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /Example &lt;problem&gt;/);
});
test('unrated general practice is labelled and does not claim a weak topic', () => {
  const html = render({ ...base, mode: 'general-practice', weakTags: [], usedDefaultRating: true, targetRating: 1000, minRating: 800, maxRating: 1200, items: [{ ...item, matchedWeakTags: [], previouslyAttempted: false }] });
  assert.match(html, /General practice/);
  assert.match(html, /starting target is 1000/);
  assert.match(html, /Not attempted in fetched history/);
  assert.doesNotMatch(html, /Targets:/);
});
test('truncation warning only appears for limited history', () => {
  assert.doesNotMatch(render(base), /may have been solved in older history/);
  assert.match(render({ ...base, historyPossiblyTruncated: true }), /may have been solved in older history/);
});
