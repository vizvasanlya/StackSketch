const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

test("rejects invalid max-files values", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-cli-"));
  const result = spawnSync(process.execPath, ["src/cli.js", root, "--max-files", "10abc"], {
    cwd: path.resolve(__dirname, ".."),
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes("Invalid value for --max-files"));
});

test("rejects multiple positional roots", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-cli-"));
  const result = spawnSync(process.execPath, ["src/cli.js", root, "."], {
    cwd: path.resolve(__dirname, ".."),
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes("Multiple project roots"));
});
