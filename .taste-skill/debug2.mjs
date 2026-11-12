// Try different submit triggers and see which one flips busy state.
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

const BTN_INFO = `(() => {
  const forms = [...document.querySelectorAll('form')];
  return JSON.stringify(forms.map(f => ({
    cls: f.className.slice(0, 40),
    buttons: [...f.querySelectorAll('button')].map(b => ({ text: b.textContent.trim(), type: b.type, disabled: b.disabled, visible: !!b.offsetParent })),
    checkboxes: f.querySelectorAll('input[type=checkbox]').length,
  })));
})()`;

const b = await Browser.launch({ width: 1440, height: 900 });
try {
  const p = await b.newPage({ width: 1440, height: 900 });
  await p.goto("http://localhost:3100", { settleMs: 2500 });
  console.log("forms:", await p.eval(BTN_INFO));
  console.log("fill:", await p.eval(FILL));
  console.log("tick:", await p.eval(TICK));

  // Method A: click the PlotInput submit button explicitly (first form's submit button)
  const clickA = `(() => {
    const btn = document.querySelector('form button[type="submit"]');
    btn.click();
    return 'clicked: ' + btn.textContent.trim();
  })()`;
  console.log("click A:", await p.eval(clickA));
  await sleep(2000);
  console.log("after A, btn:", await p.eval(`document.querySelector('form button[type="submit"]').textContent.trim()`));

  // Method B: requestSubmit
  const clickB = `(() => { document.querySelector('form').requestSubmit(); return 'requestSubmit'; })()`;
  console.log("click B:", await p.eval(clickB));
  for (let i = 0; i < 15; i++) {
    await sleep(1000);
    const t = await p.eval(`document.body.innerText.includes('Screening verdict') || document.body.innerText.includes('verdict')`);
    const busy = await p.eval(`document.querySelector('form button[type="submit"]').textContent.trim()`);
    console.log(i, "busy:", busy, "hasVerdictWord:", t);
    if (t) break;
  }
} finally {
  await b.close();
}
