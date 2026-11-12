import { Browser } from "file:///C:/Users/School/.config/opencode/skills/design-taste-frontend/scripts/lib/cdp.mjs";

const b = await Browser.launch({ width: 1440, height: 900 });
try {
  const p = await b.newPage({ width: 1440, height: 900 });
  console.log("eval 1+1:", await p.eval("1+1"));
  await p.goto("http://localhost:3100", { settleMs: 2500 });
  console.log("loaded, title:", await p.eval("document.title"));
  console.log("has input:", await p.eval("!!document.querySelector('#plot-query')"));
} finally {
  await b.close();
}
