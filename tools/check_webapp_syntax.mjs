/**
 * tools/check_webapp_syntax.mjs
 *
 * Syntax-checks every .ts/.tsx file in webapp/ using the TypeScript compiler
 * API. Needed because `npm install` cannot run in this environment (disk
 * limits), so we reuse the TypeScript copy already present in
 * frontend/node_modules to validate the Next.js sources.
 *
 * Usage:  node tools/check_webapp_syntax.mjs
 */

import { createRequire } from "node:module";
import { readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const webappDir = join(repoRoot, "webapp");

const CANDIDATES = [
  join(repoRoot, "webapp", "node_modules", "typescript", "lib", "typescript.js"),
  join(repoRoot, "frontend", "node_modules", "typescript", "lib", "typescript.js"),
  // Globally installed CLIs that bundle a working TypeScript copy.
  join(process.env.APPDATA ?? "", "npm", "node_modules", "n8n", "node_modules", "typescript", "lib", "typescript.js"),
  join(process.env.APPDATA ?? "", "npm", "node_modules", "vercel", "node_modules", "typescript", "lib", "typescript.js"),
  "typescript",
];

const requireFromHere = createRequire(import.meta.url);
let ts = null;
let tsSource = "";
for (const candidate of CANDIDATES) {
  try {
    ts = requireFromHere(candidate);
    tsSource = candidate;
    break;
  } catch {
    /* try the next location */
  }
}

if (!ts) {
  console.error("TypeScript is not available in frontend/node_modules or webapp/node_modules.");
  process.exit(2);
}

console.log(`TypeScript ${ts.version} loaded from ${tsSource}\n`);

const EXTENSIONS = new Set([".ts", ".tsx"]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (EXTENSIONS.has(full.slice(full.lastIndexOf(".")))) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(webappDir).sort();
let failures = 0;
let nonAscii = 0;

for (const file of files) {
  const rel = relative(repoRoot, file).replace(/\\/g, "/");
  const text = ts.sys.readFile(file) ?? "";
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);

  const diagnostics = source.parseDiagnostics ?? [];
  if (diagnostics.length > 0) {
    failures += 1;
    console.log(`FAIL ${rel}`);
    for (const d of diagnostics.slice(0, 5)) {
      const { line, character } = source.getLineAndCharacterOfPosition(d.start ?? 0);
      console.log(`       ${line + 1}:${character + 1} ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`);
    }
  } else {
    console.log(`ok   ${rel}`);
  }

  // Guard against console-mangling of non-ASCII characters in source literals.
  for (const char of text) {
    if (char.codePointAt(0) > 0x2000 && char.codePointAt(0) !== 0x2026) {
      nonAscii += 1;
      console.log(`     note ${rel}: non-ASCII U+${char.codePointAt(0).toString(16)}`);
    }
  }
}

console.log(`\n${files.length} files checked, ${failures} syntax failure(s).`);
process.exit(failures > 0 ? 1 : 0);
