// Tests the REAL toast module + useBusy guard.
const path = require('path');
const Module = require('module');
const ROOT = path.join(__dirname, '..');
const TMP = path.join(ROOT, '.tmp-check');
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'react-native') {
    return {
      StyleSheet: { create: (s) => s },
      Platform: { OS: 'node' },
      Pressable: () => null,
      Text: (p) => (p && p.children) || null,
      View: (p) => (p && p.children) || null,
    };
  }
  if (request === '@/constants/theme') return { COLORS: { ink: '#1A1A2E' } };
  if (request.startsWith('@/')) return origLoad.call(this, path.join(TMP, request.slice(2)), parent, isMain);
  return origLoad.call(this, request, parent, isMain);
};

const React = require('react');
const TestRenderer = require('react-test-renderer');
const { act } = TestRenderer;

let pass = 0;
let fail = 0;
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`PASS ${name}`); }
  else { fail++; console.log(`FAIL ${name} ${extra}`); }
}

(async () => {
  // toast: single lightweight system — mount real ToastHost, fire, auto-dismiss
  const { toast, ToastHost } = require(path.join(TMP, 'components', 'Toast.js'));
  let host;
  act(() => {
    host = TestRenderer.create(React.createElement(ToastHost));
  });
  const textOf = () => JSON.stringify(host.toJSON());
  check('toast hidden initially', !textOf().includes('Added'));
  act(() => { toast('Added JBL to cart'); });
  check('toast appears immediately on action', textOf().includes('Added JBL to cart'));
  await act(async () => { await new Promise((r) => setTimeout(r, 2100)); });
  check('toast auto-dismisses', !textOf().includes('Added JBL to cart'));

  // useBusy: prevents double execution
  const { useBusy } = require(path.join(TMP, 'hooks', 'useBusy.js'));
  let api = null;
  function Probe() {
    api = useBusy();
    return null;
  }
  act(() => { TestRenderer.create(React.createElement(Probe)); });
  check('starts idle', api.busy === false);

  let calls = 0;
  let p1;
  let p2;
  act(() => {
    p1 = api.run(async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 30));
    });
    p2 = api.run(async () => { calls++; });
  });
  check('busy while running', api.busy === true);
  const [r1, r2] = await Promise.all([p1, p2]);
  // flush state updates after async completion
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  check('first run executed', r1 === true && calls === 1, `calls=${calls}`);
  check('second rapid run rejected', r2 === false);
  check('idle again after finish', api.busy === false);
  let r3;
  await act(async () => { r3 = await api.run(async () => { calls++; }); });
  check('runs again after release', r3 === true && calls === 2, `calls=${calls}`);

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('TEST CRASH', e); process.exit(1); });
