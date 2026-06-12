#!/usr/bin/env node
const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { analyzeProject } = require("./analyzer");
const { renderHtml } = require("./renderers");
const { formatMarkdown } = require("./analyzer");
const { parseInteger } = require("./utils");

const VERSION = "0.1.0";

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log(`stacksketch ${VERSION}`);
    return;
  }

  const parsed = parseArgs(args);
  if (parsed.error) {
    console.error(parsed.error);
    printHelp();
    process.exitCode = 1;
    return;
  }

  const options = parsed.options;
  const report = await analyzeProject(options.root, {
    title: options.title,
    maxFiles: options.maxFiles,
    ignore: options.ignore,
    include: options.include
  });

  const format = options.format || inferFormat(options.output);
  if (format === "json") {
    const output = options.output || "stacksketch.json";
    await writeOutput(output, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`Wrote ${output}`);
    return;
  }

  if (format === "md" || format === "markdown") {
    const output = options.output || "stacksketch.md";
    await writeOutput(output, formatMarkdown(report));
    console.log(`Wrote ${output}`);
    return;
  }

  const output = options.output || "stacksketch.html";
  await writeOutput(output, renderHtml(report));
  console.log(`Wrote ${output}`);

  if (options.open) {
    openFile(path.resolve(output));
  }

  console.log(`Mapped ${report.summary.fileCount.toLocaleString()} files, ${report.summary.importEdges.toLocaleString()} local edges, and ${report.summary.externalDependencies.toLocaleString()} external dependencies.`);
}

function parseArgs(args) {
  const options = {
    root: ".",
    output: null,
    format: null,
    title: null,
    maxFiles: 500,
    ignore: [],
    include: [],
    open: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--open") {
      options.open = true;
      continue;
    }
    if (arg === "--json") {
      options.format = "json";
      continue;
    }
    if (arg === "--markdown" || arg === "--md") {
      options.format = "md";
      continue;
    }
    if (arg === "--html") {
      options.format = "html";
      continue;
    }
    if (arg === "-o" || arg === "--out" || arg === "--output") {
      const value = args[++index];
      if (!value) return { error: `Missing value for ${arg}.` };
      options.output = value;
      continue;
    }
    if (arg === "--format") {
      const value = args[++index];
      if (!value) return { error: "Missing value for --format." };
      options.format = value.toLowerCase();
      continue;
    }
    if (arg === "--title") {
      const value = args[++index];
      if (!value) return { error: "Missing value for --title." };
      options.title = value;
      continue;
    }
    if (arg === "--max-files") {
      const value = args[++index];
      if (!value) return { error: "Missing value for --max-files." };
      options.maxFiles = parseInteger(value, 500);
      continue;
    }
    if (arg === "--ignore") {
      const value = args[++index];
      if (!value) return { error: "Missing value for --ignore." };
      options.ignore.push(value);
      continue;
    }
    if (arg === "--include") {
      const value = args[++index];
      if (!value) return { error: "Missing value for --include." };
      options.include.push(value);
      continue;
    }
    if (arg.startsWith("-")) {
      return { error: `Unknown option "${arg}".` };
    }
    options.root = arg;
  }

  return { options };
}

function inferFormat(output) {
  if (!output) return "html";
  const extension = path.extname(output).toLowerCase();
  if (extension === ".json") return "json";
  if (extension === ".md") return "md";
  return "html";
}

async function writeOutput(output, content) {
  const absolute = path.resolve(output);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, content, "utf8");
}

function openFile(filePath) {
  const platform = process.platform;
  const command = platform === "darwin" ? "open" : platform === "win32" ? "cmd" : "xdg-open";
  const args = platform === "win32" ? ["/c", "start", "", filePath] : [filePath];
  const child = spawn(command, args, { detached: true, stdio: "ignore" });
  child.unref();
}

function printHelp() {
  console.log(`stacksketch ${VERSION}

Zero-config architecture maps for any codebase.

Usage:
  stacksketch [root] [options]

Options:
  -o, --output <path>     Output file. Defaults to stacksketch.html
  --format <html|md|json> Output format. Defaults to extension or html
  --json                  Write stacksketch.json
  --md, --markdown        Write stacksketch.md
  --open                  Open the HTML report after generation
  --title <title>         Report title
  --max-files <number>    Max source files to scan. Default: 500
  --ignore <pattern>      Extra ignore pattern. Repeatable
  --include <pattern>     Extra include pattern. Repeatable
  -h, --help              Show help
  -v, --version           Show version

Examples:
  stacksketch .
  stacksketch ./my-app --open
  stacksketch . --format md --output architecture.md
  stacksketch . --ignore playground --max-files 1200
`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
