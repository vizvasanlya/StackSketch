const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { analyzeProject, countLineMetrics, extractImports, extractSymbols, resolveImport } = require("../src/analyzer");

test("extracts JavaScript imports and exports", () => {
  const content = `
    import React from 'react';
    import type { User } from './types';
    import './style.css';
    export const hello = () => 'world';
    export async function load() {}
    class App {}
  `;
  assert.deepEqual(extractImports(content, "JavaScript"), ["react", "./types", "./style.css"]);
  assert.deepEqual(extractSymbols(content, "JavaScript"), ["App", "hello", "load"]);
});

test("counts code, blank, and comment lines without counting final newlines twice", () => {
  const metrics = countLineMetrics("const a = 1;\n// comment\n\nfunction run() {\n}\n", "JavaScript");
  assert.equal(metrics.lines, 5);
  assert.equal(metrics.codeLines, 3);
  assert.equal(metrics.blankLines, 1);
  assert.equal(metrics.commentLines, 1);
});

test("resolves local TypeScript imports to indexed files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-test-"));
  await fs.mkdir(path.join(root, "src", "components", "button"), { recursive: true });
  await fs.writeFile(path.join(root, "src", "components", "button", "index.ts"), "export const Button = () => null;");
  const moduleIndex = new Map([["src/components/button/index.ts", "src/components/button/index.ts"]]);
  assert.equal(
    resolveImport(root, "src/app.tsx", "./components/button", "TypeScript", moduleIndex, ""),
    "src/components/button/index.ts"
  );
});

test("analyzes a small multi-language project", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-project-"));
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, "package.json"), JSON.stringify({ dependencies: { react: "19.0.0", express: "5.0.0" } }));
  await fs.writeFile(path.join(root, "src", "app.tsx"), "import React from 'react';\nimport { helper } from './helper';\nexport const App = () => <helper />;\n");
  await fs.writeFile(path.join(root, "src", "helper.ts"), "export function helper() { return 1; }\n");
  await fs.writeFile(path.join(root, "src", "worker.py"), "from src.helper import helper\n\ndef run():\n    return helper()\n");
  await fs.mkdir(path.join(root, "node_modules"), { recursive: true });
  await fs.writeFile(path.join(root, "node_modules", "skip.js"), "export const skipped = true;\n");

  const report = await analyzeProject(root, { title: "Demo", maxFiles: 20 });

  assert.equal(report.title, "Demo");
  assert.equal(report.summary.totalFiles, 4);
  assert.equal(report.summary.sourceFiles, 4);
  assert.equal(report.summary.scannedFiles, 4);
  assert.equal(report.summary.totalCodeLines, 8);
  assert.ok(report.stack.frameworks.includes("React"));
  assert.ok(report.graph.edges.some((edge) => edge.source === "src/app.tsx" && edge.target === "src/helper.ts"));
  assert.ok(report.graph.edges.some((edge) => edge.source === "src/app.tsx" && edge.target === "react"));
  assert.ok(!report.graph.nodes.some((node) => node.path === "node_modules/skip.js"));
});

test("reports truncation when max files is lower than source files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-maxfiles-"));
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await Promise.all([1, 2, 3].map((index) => fs.writeFile(path.join(root, "src", `file${index}.js`), `export const value${index} = ${index};\n`)));

  const report = await analyzeProject(root, { maxFiles: 2 });

  assert.equal(report.summary.totalFiles, 3);
  assert.equal(report.summary.sourceFiles, 3);
  assert.equal(report.summary.scannedFiles, 2);
  assert.equal(report.summary.maxFilesReached, true);
});
