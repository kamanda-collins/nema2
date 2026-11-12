// Debug: submit and dump page state + console/network errors.
import { Browser, sleep } from "file:///C:/Users/School/.config/opencode/skills/design-taste-frontend/scripts/lib/cdp.mjs";

const FILL = `(() => {
  const input = document.querySelector('#plot-query');
  if (!input) return 'no input';
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'Kampala');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return 'filled';
})()`;

const STATE = `(() => {
  const boxes = [...document.querySelectorAll('form input[type="checkbox"]')];
  const btn = [...document.querySelectorAll('button')].find((b) => /Screen this plot/.test(b.textContent));
  const input = document.querySelector('#plot-query');
  return JSON.stringify({
    inputVal: input ? input.value : null,
    boxes: boxes.map((b) => ({ checked: b.checked, aria: b.getAttribute('aria-label') })),
    btnDisabled: btn ? btn.disabled : null,
    btnText: btn ? btn.textContent.trim() : null,
  });
})()`;

const BODY = `document.body.innerText.slice(0, 3000)`;

const ERRS = `JSON.stringify(window.__errs || [])`;

const b = await Browser.launch({ width: 1440, height: 900 });
try {
  const p = await b.newPage({ width: 1440, height: 900 });
  await p.eval(`window.__errs = []; ['error','unhandledrejection'].forEach(t => window.addEventListener(t, e => { window.__errs.push(String(e.reason || e.message || e)); }));`);
  await p.goto("http://localhost:3100", { settleMs: 2500 });

  console.log("fill:", await p.eval(FILL));
  console.log("state after fill:", await p.eval(STATE));

  const TICK = `(() => {
    const boxes = document.querySelectorAll('form input[type="checkbox"]');
    boxes[boxes.length - 1]?.click();
    return 'ticked ' + boxes.length;
  })()`;
  console.log("tick:", await p.eval(TICK));
  console.log("state after tick:", await p.eval(STATE));

  const SUBMIT = `(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /Screen this plot/.test(b.textContent));
    btn?.click();
    return 'submitted';
  })()`;
  console.log("submit:", await p.eval(SUBMIT));

  for (let i = 0; i < 20; i++) {
    await sleep(1000);
    const state = await p.eval(STATE);
    console.log(i, state);
    const j = JSON.parse(state);
    if (i === 19) {
      console.log("BODY:", await p.eval(BODY));
      console.log("ERRS:", await p.eval(ERRS));
    }
    if (j.btnDisabled === false && i > 3) {
      // button enabled again = done
      break;
    }
  }
} finally {
  await b.close();
}
