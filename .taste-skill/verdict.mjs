// Drives one screening through the running app and photographs the verdict state.
import { Browser, sleep } from "file:///C:/Users/School/.config/opencode/skills/design-taste-frontend/scripts/lib/cdp.mjs";
import { mkdirSync } from "node:fs";

mkdirSync(".taste-skill/verdict", { recursive: true });

const FILL = `(() => {
  const input = document.querySelector('#plot-query');
  if (!input) return 'no input';
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'Kampala');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return 'filled';
})()`;

const TICK = `(() => {
  const boxes = document.querySelectorAll('form input[type="checkbox"]');
  boxes[boxes.length - 1]?.click();
  return 'ticked';
})()`;

const SUBMIT = `(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => /Screen this plot/.test(b.textContent));
  btn?.click();
  return 'submitted';
})()`;

const CHECK = `!!document.body.innerText.includes('Screening verdict')`;

const b = await Browser.launch({ width: 1440, height: 900 });
try {
  const p = await b.newPage({ width: 1440, height: 900 });
  await p.goto("http://localhost:3100", { settleMs: 2500 });

  console.log("fill:", await p.eval(FILL));
  console.log("tick:", await p.eval(TICK));
  console.log("submit:", await p.eval(SUBMIT));

  let verdict = false;
  for (let i = 0; i < 60; i++) {
    await sleep(1000);
    verdict = await p.eval(CHECK);
    if (verdict) break;
  }
  console.log("verdict shown:", verdict);
  await sleep(3000);

  await p.screenshot({ path: ".taste-skill/verdict/desktop-fold.jpg" });
  await p.screenshot({ path: ".taste-skill/verdict/desktop-full.jpg", fullPage: true });

  await p.setViewport({ width: 390, height: 844, mobile: true });
  await sleep(800);
  await p.screenshot({ path: ".taste-skill/verdict/mobile-full.jpg", fullPage: true });
} finally {
  await b.close();
}
