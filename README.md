<div align="center">

# StackSketch

**Zero-config architecture intelligence and interactive dependency maps for any codebase.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0%20Runtime-black)](package.json)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](#)

[Live Web UI](#interactive-web-application) • [Quick Start](#quick-start) • [Features](#key-capabilities) • [CLI Reference](#cli-reference) • [REST API](#rest-api) • [Programmatic API](#programmatic-api)

---

</div>

## Overview

**StackSketch** transforms any repository into an interactive, visual architecture map in seconds. It scans codebases locally, detects languages and frameworks, resolves import relationships, calculates complexity metrics, and renders a web interface alongside shareable Markdown and JSON outputs.

Built with **zero runtime dependencies**, StackSketch is completely private, local-first, and lightning-fast. It is engineered for:

- **Developer Onboarding**: Rapidly orient new contributors to codebase topologies and key files.
- **Architecture Reviews & RFCs**: Generate crisp dependency graphs and metrics for technical proposals.
- **Pull Request Context**: Embed auto-generated architecture summaries directly into PR descriptions.
- **Documentation & READMEs**: Export high-resolution SVG and PNG diagrams of your system topology.
- **AI Coding Context**: Feed compact JSON codebase graphs to LLMs and automated development agents.

---

## Interactive Web Application

StackSketch features a web-based architecture visualizer:

<div align="center">

| View | Description |
| :--- | :--- |
| **Topology Graph** | High-performance HTML5 canvas force-directed graph with pan, zoom, cluster grouping, hover inspection, and selective edge highlighting. |
| **File Matrix** | Comprehensive, sortable table of all source files with LOC, blank lines, comment density, size, and dependency counts. |
| **Architecture Insights** | Structural diagnostics identifying architectural hubs (highest centrality), circular loops, and external library surfaces. |
| **Inspector Drawer** | Deep dive into any node showing inbound dependents, outbound dependencies, exported symbols, and one-click path copying. |
| **Sample Projects** | Instant exploration of diverse architectures (e.g. Next.js 15 Monorepo, FastAPI + Celery Backend). |
| **Export Suite** | One-click export to Vector SVG, PNG Image, Markdown tables, or full JSON dataset. |
| **Theme Engine** | Accessible Dark and Light themes with persistent user preferences. |

</div>

---

## Quick Start

### 1. Launch via npx (Zero Installation)

Generate an interactive HTML report and open it in your browser:

```bash
npx stacksketch-cli . --open
```

Or run the local web server:

```bash
npm start
```
Then open `http://localhost:3000` in your browser.

### 2. Global Installation

```bash
npm install -g stacksketch-cli

# Scan any local directory
stacksketch /path/to/project --open
```

### 3. Local Development

```bash
# Clone the repository
git clone https://github.com/vizvasanlya/StackSketch.git
cd StackSketch

# Verify syntax and run tests (100% native Node.js tests)
npm run check
npm test

# Start the web server
npm run dev
```

---

## Key Capabilities

### 1. Multi-Ecosystem Language & Framework Detection
StackSketch automatically recognizes over 25+ programming languages and frameworks without configuration:

- **Languages**: TypeScript, JavaScript, Python, Go, Rust, Dart, Java, C#, PHP, Ruby, Swift, Kotlin, Scala, C/C++, HTML, CSS/SCSS, SQL, Shell, Dockerfile, Terraform, and YAML/TOML.
- **Frameworks**: Next.js, React, Vue, Nuxt, Svelte, Flutter, Express, NestJS, Fastify, FastAPI, Django, Flask, SQLAlchemy, Celery, Prisma, Tailwind CSS, Actix Web, Gin, and Spring Boot.

### 2. Local Import & Edge Resolution
Accurately maps inter-module dependencies for:
- **TypeScript & JavaScript**: ESM (`import`), CommonJS (`require`), dynamic imports, alias paths, and indexed directories.
- **Python**: Absolute, relative, and package-level module imports.
- **Go**: Package declarations and module-relative import paths.
- **Rust**: Crate-relative paths (`crate::*`) and external crate references.
- **Dart & Flutter**: Package imports (`package:foo/...`) and local relative imports.
- **CSS / SCSS**: `@import` stylesheet linkages.

### 3. Privacy-First & Zero Egress
StackSketch runs entirely on your local machine. No code, telemetry, or metadata ever leaves your system. No API keys, cloud accounts, or third-party tracking are involved.

### 4. Zero Runtime Dependencies
StackSketch relies exclusively on Node.js native core modules (`node:http`, `node:fs`, `node:path`, `node:test`). It starts in milliseconds and avoids dependency bloat or security audit friction.

---

## CLI Reference

```bash
stacksketch [root] [options]
```

### Options

| Flag | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `-o, --output <path>` | `string` | `stacksketch.html` | Destination path for output report |
| `--format <format>` | `string` | `html` | Output format: `html`, `md`, or `json` |
| `--html` | `boolean` | `true` | Generate standalone self-contained HTML visualizer |
| `--md, --markdown` | `boolean` | `false` | Generate structured Markdown summary |
| `--json` | `boolean` | `false` | Generate complete JSON architecture dataset |
| `--open` | `boolean` | `false` | Automatically launch report in default web browser |
| `--title <title>` | `string` | Directory name | Custom title for the report |
| `--max-files <number>` | `number` | `500` | Maximum number of source files to scan |
| `--ignore <pattern>` | `string` | — | Extra ignore glob pattern (repeatable) |
| `--include <pattern>` | `string` | — | Extra include glob pattern (repeatable) |
| `-v, --version` | `boolean` | — | Output StackSketch CLI version |
| `-h, --help` | `boolean` | — | Show CLI help text |

### Usage Examples

```bash
# Scan a subdirectory and output a custom HTML report
stacksketch ./src -o ./docs/architecture.html --title "Core Service Architecture"

# Generate a Markdown summary for pull request documentation
stacksketch . --format md -o ARCHITECTURE.md

# Scan a large monorepo with elevated file limits and custom ignore rules
stacksketch . --max-files 2000 --ignore "e2e/**" --ignore "legacy/**"

# Export a JSON dataset for AI context or CI tooling
stacksketch . --json -o ./artifacts/stacksketch.json
```

---

## REST API

When running the local server (`server.js`), StackSketch exposes a lightweight HTTP API:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Serves the interactive HTML5 architecture application |
| `GET` | `/api/health` | Service health status and timestamp |
| `GET` | `/api/report` | Returns the active architecture JSON payload (`?refresh=1` forces re-scan) |
| `GET` | `/api/markdown` | Returns the formatted Markdown report as plain text |
| `GET` | `/api/samples` | Lists pre-loaded sample architecture benchmark projects |
| `GET` | `/api/sample/:id` | Fetches JSON architecture data for a specific sample project |

---

## Programmatic API

StackSketch can be integrated directly into custom Node.js scripts, build pipelines, or CI/CD jobs:

```javascript
const { analyzeProject, formatMarkdown } = require("stacksketch-cli");
const { renderHtml } = require("stacksketch-cli/renderers");

async function generateArchitecture() {
  // Analyze directory
  const report = await analyzeProject(".", {
    title: "Project Architecture",
    maxFiles: 1000,
    ignore: ["dist/**", "build/**"]
  });

  console.log(`Analyzed ${report.summary.sourceFiles} source files`);
  console.log(`Total code lines: ${report.summary.totalCodeLines}`);

  // Generate self-contained HTML
  const html = renderHtml(report);

  // Generate Markdown summary
  const markdown = formatMarkdown(report);
}
```

---

## Architecture JSON Schema

The exported JSON dataset provides a clean representation of codebase structure:

```json
{
  "title": "StackSketch Architecture",
  "generatedAt": "2026-09-21T00:00:00.000Z",
  "summary": {
    "totalFiles": 34,
    "sourceFiles": 28,
    "scannedFiles": 28,
    "maxFiles": 500,
    "maxFilesReached": false,
    "totalLines": 5420,
    "totalCodeLines": 4350,
    "totalBlankLines": 620,
    "totalCommentLines": 450,
    "totalBytes": 182400,
    "importEdges": 48,
    "externalDependencies": 12,
    "languages": 3,
    "frameworks": 2
  },
  "stack": {
    "languages": [
      { "name": "JavaScript", "files": 18, "lines": 3100, "bytes": 120000, "percent": 68 }
    ],
    "frameworks": ["Node.js"]
  },
  "graph": {
    "nodes": [
      {
        "id": "src/analyzer.js",
        "path": "src/analyzer.js",
        "name": "analyzer.js",
        "language": "JavaScript",
        "loc": 650,
        "imports": ["./defaults", "./utils"],
        "exports": ["analyzeProject", "extractImports"],
        "score": 85,
        "external": false
      }
    ],
    "edges": [
      { "source": "src/analyzer.js", "target": "src/defaults.js", "kind": "local" }
    ]
  }
}
```

---

## Contributing

We welcome contributions! Please review [CONTRIBUTING.md](CONTRIBUTING.md) for details on code standards, local testing, and pull request workflows.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/awesome-feature`)
3. Run tests and lint checks (`npm run check && npm test`)
4. Commit your changes (`git commit -m 'feat: add awesome feature'`)
5. Push to the branch (`git push origin feature/awesome-feature`)
6. Open a Pull Request

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
