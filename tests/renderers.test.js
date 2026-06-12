const test = require("node:test");
const assert = require("node:assert/strict");
const { renderHtml } = require("../src/renderers");

test("renders a self-contained HTML report", () => {
  const html = renderHtml({
    title: "Demo",
    generatedAt: "2026-06-12T00:00:00.000Z",
    summary: {
      fileCount: 2,
      scannedFiles: 2,
      maxFiles: 500,
      totalLines: 12,
      totalBytes: 120,
      importEdges: 1,
      externalDependencies: 1,
      languages: 1,
      frameworks: 1
    },
    stack: {
      languages: [{ name: "TypeScript", files: 1, lines: 10, bytes: 100, percent: 50 }],
      frameworks: ["React"]
    },
    config: {},
    graph: {
      nodes: [
        { id: "src/app.tsx", path: "src/app.tsx", name: "app.tsx", language: "TypeScript", lines: 10, loc: 10, bytes: 100, imports: ["react"], exports: ["App"], score: 40, external: false }
      ],
      edges: []
    },
    topFiles: [],
    directoryTree: { name: ".", type: "directory", children: [] },
    humanSummary: { size: "120 B", lines: "12", files: "2", edges: "1", dependencies: "1" }
  });

  assert.ok(html.includes("Architecture snapshot"));
  assert.ok(html.includes("Demo"));
  assert.ok(html.includes("<script id=\"report\""));
});
