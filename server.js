const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { analyzeProject, formatMarkdown } = require("./src/analyzer");
const { renderHtml } = require("./src/renderers");
const { SAMPLE_PROJECTS } = require("./src/samples");

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = "0.0.0.0";

let cachedReport = null;
let lastScanTime = 0;
const CACHE_TTL_MS = 3000;

async function getReport(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedReport && (now - lastScanTime) < CACHE_TTL_MS) {
    return cachedReport;
  }
  try {
    const report = await analyzeProject(".", {
      title: "StackSketch Architecture"
    });
    cachedReport = report;
    lastScanTime = now;
    return report;
  } catch (error) {
    if (cachedReport) {
      return cachedReport;
    }
    throw error;
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  // CORS headers for API access
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === "/api/health" || pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
    return;
  }

  if (pathname === "/api/samples") {
    const samples = [
      { id: "local", title: "StackSketch (Live Codebase)" },
      ...Object.entries(SAMPLE_PROJECTS).map(([id, p]) => ({ id, title: p.title }))
    ];
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(samples, null, 2));
    return;
  }

  if (pathname.startsWith("/api/sample/")) {
    const sampleId = pathname.replace("/api/sample/", "");
    const sample = SAMPLE_PROJECTS[sampleId];
    if (sample) {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(sample, null, 2));
    } else {
      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: `Sample '${sampleId}' not found` }));
    }
    return;
  }

  if (pathname === "/api/report") {
    try {
      const sampleParam = url.searchParams.get("sample");
      if (sampleParam && SAMPLE_PROJECTS[sampleParam]) {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(SAMPLE_PROJECTS[sampleParam], null, 2));
        return;
      }

      const force = url.searchParams.has("refresh");
      const report = await getReport(force);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(report, null, 2));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (pathname === "/api/markdown") {
    try {
      const sampleParam = url.searchParams.get("sample");
      let report;
      if (sampleParam && SAMPLE_PROJECTS[sampleParam]) {
        report = SAMPLE_PROJECTS[sampleParam];
      } else {
        const force = url.searchParams.has("refresh");
        report = await getReport(force);
      }
      const markdown = formatMarkdown(report);
      res.writeHead(200, { "Content-Type": "text/markdown; charset=utf-8" });
      res.end(markdown);
    } catch (error) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`Error: ${error.message}`);
    }
    return;
  }

  if (pathname === "/" || pathname === "/index.html") {
    try {
      const sampleParam = url.searchParams.get("sample");
      let report;
      if (sampleParam && SAMPLE_PROJECTS[sampleParam]) {
        report = SAMPLE_PROJECTS[sampleParam];
      } else {
        const force = url.searchParams.has("refresh");
        report = await getReport(force);
      }
      const html = renderHtml(report);
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Length": Buffer.byteLength(html, "utf8")
      });
      res.end(html);
      return;
    } catch (error) {
      // Fallback to pre-rendered file if available
      try {
        const fallbackPath = path.resolve(__dirname, "dist", "index.html");
        const content = await fs.readFile(fallbackPath, "utf8");
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Length": Buffer.byteLength(content, "utf8")
        });
        res.end(content);
        return;
      } catch {
        res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<h1>Error generating architecture map</h1><pre>${error.message}</pre>`);
        return;
      }
    }
  }

  // 404 for unknown routes
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found");
});

server.listen(PORT, HOST, () => {
  console.log(`StackSketch server running on http://${HOST}:${PORT}`);
});
