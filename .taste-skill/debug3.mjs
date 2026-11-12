// Submit, then dump body text + errors after the request settles.
import { Browser, sleep } from "file:///C:/Users/School/.config/opencode/skills/design-taste-frontend/scripts/lib/cdp.mjs";

const FILL = `(() => {
  const input = document.querySelector('#plot-query');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'Kampala');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return 'filled';
})()`;

const TICK = `(() => {
  const boxes = [...document.querySelectorAll('form input[type="checkbox"]')];
  boxes.forEach(b => { if (!b.checked) b.click(); });
  return 'all ticked';
})()`;

const SUBMIT = `(() => { document.querySelector('form').requestSubmit(); return 'submitted'; })()`;

const b = await Browser.launch({ width: 1440, height: 900 });
try {
  const p = await b.newPage({ width: 1440, height: 900 });
  await p.goto("http://localhost:3100", { settleMs: 2500 });
  await p.eval(FILL);
  await p.eval(TICK);
  await p.eval(SUBMIT);
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const busy = await p.eval(`document.querySelector('form button[type="submit"]').textContent.trim()`);
    if (busy === "Screen this plot" && i > 1) break;
    console.log(i, busy);
  }
  const body = await p.eval(`document.body.innerText`);
  console.log("BODY:\n" + body.slice(0, 4000));
} finally {
  await b.close();
}
