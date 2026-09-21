const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { spawn } = require("node:child_process");
const path = require("node:path");

test("server starts and serves health and report endpoints", async () => {
  const port = 3055;
  const child = spawn(process.execPath, ["server.js"], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"]
  });

  try {
    // Wait for server to start
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Server start timeout")), 5000);
      child.stdout.on("data", (data) => {
        if (data.toString().includes("StackSketch server running")) {
          clearTimeout(timer);
          resolve();
        }
      });
      child.stderr.on("data", (err) => {
        console.error("Server stderr:", err.toString());
      });
    });

    // Test /api/health
    const healthRes = await fetch(`http://localhost:${port}/api/health`);
    assert.equal(healthRes.status, 200);
    const healthJson = await healthRes.json();
    assert.equal(healthJson.status, "ok");

    // Test /
    const rootRes = await fetch(`http://localhost:${port}/`);
    assert.equal(rootRes.status, 200);
    const html = await rootRes.text();
    assert.ok(html.includes("<!doctype html>"));
    assert.ok(html.includes("StackSketch"));

    // Test /api/report
    const reportRes = await fetch(`http://localhost:${port}/api/report`);
    assert.equal(reportRes.status, 200);
    const reportJson = await reportRes.json();
    assert.ok(reportJson.summary);
    assert.ok(reportJson.graph);

    // Test /api/markdown
    const mdRes = await fetch(`http://localhost:${port}/api/markdown`);
    assert.equal(mdRes.status, 200);
    const mdText = await mdRes.text();
    assert.ok(mdText.includes("# "));

    // Test /api/samples
    const samplesRes = await fetch(`http://localhost:${port}/api/samples`);
    assert.equal(samplesRes.status, 200);
    const samplesJson = await samplesRes.json();
    assert.ok(Array.isArray(samplesJson));
    assert.ok(samplesJson.length >= 2);

    // Test /api/sample/:id
    const sampleDetailRes = await fetch(`http://localhost:${port}/api/sample/nextjs-fullstack`);
    assert.equal(sampleDetailRes.status, 200);
    const sampleDetailJson = await sampleDetailRes.json();
    assert.equal(sampleDetailJson.summary.languages, 4);
  } finally {
    child.kill("SIGTERM");
  }
});
