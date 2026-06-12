# StackSketch

**Turn any codebase into a beautiful architecture map in one command.**

StackSketch is a zero-dependency CLI that scans a repository locally, detects languages/frameworks, extracts best-effort imports, builds a dependency graph for supported ecosystems, and exports a polished HTML report, Markdown summary, or JSON dataset.

It is designed for the moment developers love to share: new project onboarding, PR context, architecture reviews, open-source READMEs, and “look how clean this codebase is” screenshots.

## Why it exists

Most code visualization tools are either:

- tied to one language,
- locked behind a SaaS dashboard,
- heavy to install,
- or too abstract to be useful.

StackSketch takes the opposite approach:

- runs locally,
- uploads nothing,
- has no runtime dependencies,
- works across JavaScript, TypeScript, Python, Go, Rust, Java, C#, PHP, Ruby, and more for language detection, with local dependency edges for JavaScript/TypeScript, Dart, Python, Rust, Go, and CSS assets,
- produces a visual report that is useful and shareable.

## Quick start

```bash
npx stacksketch-cli .
```

This creates `stacksketch.html` in the current directory. Open it in a browser to explore the interactive architecture map.

```bash
npx stacksketch-cli ./my-app --open
```

## Install globally

```bash
npm install -g stacksketch-cli
stacksketch .
```

## Output formats

### HTML report

```bash
stacksketch . --open
```

Generates an interactive, self-contained HTML report with:

- language distribution,
- framework detection,
- import graph,
- top files,
- searchable nodes,
- local and external dependency edges,
- SVG download,
- Markdown copy button.

### Markdown report

```bash
stacksketch . --format md --output ARCHITECTURE.md
```

Useful for PRs, RFCs, onboarding docs, and README sections.

### JSON dataset

```bash
stacksketch . --format json --output stacksketch.json
```

Useful for CI, dashboards, custom renderers, or AI agent context.

## CLI reference

```bash
stacksketch [root] [options]
```

| Option | Description |
| --- | --- |
| `-o, --output <path>` | Output file. Defaults to `stacksketch.html`. |
| `--format <html\|md\|json>` | Output format. Defaults to file extension or HTML. |
| `--html` | Write `stacksketch.html`. |
| `--json` | Write `stacksketch.json`. |
| `--md, --markdown` | Write `stacksketch.md`. |
| `--open` | Open the HTML report after generation. |
| `--title <title>` | Report title. |
| `--max-files <number>` | Max source files to scan. Default: `500`. |
| `--ignore <pattern>` | Extra ignore pattern. Repeatable. |
| `--include <pattern>` | Extra include pattern. Repeatable. |
| `-h, --help` | Show help. |
| `-v, --version` | Show version. |

## Examples

Scan the current repo:

```bash
stacksketch .
```

Scan a specific repo and open the report:

```bash
stacksketch ./packages/web --open
```

Generate a Markdown architecture summary:

```bash
stacksketch . --format md --output docs/architecture.md
```

Limit the scan to a large monorepo:

```bash
stacksketch . --max-files 1500
```

Ignore generated folders:

```bash
stacksketch . --ignore generated --ignore dist
```

Include only source folders:

```bash
stacksketch . --include src --include packages
```

## What StackSketch detects

### Languages

JavaScript, TypeScript, Dart, Vue, Svelte, Python, Go, Rust, Java, C#, PHP, Ruby, Swift, Kotlin, Scala, C, C++, CSS, SCSS, HTML, JSON, YAML, TOML, Markdown, SQL, Shell, PowerShell, Dockerfile, Terraform, and Lua.

### Frameworks

React, Next.js, Vite, Nuxt, Svelte, Vue, Flutter, Express, NestJS, Fastify, Django, Flask, FastAPI, Tailwind CSS, Actix Web, Rocket, Gin, Echo, and Spring Boot.

### Graph signals

- local imports for supported languages,
- external dependency signals for supported import styles,
- top files by LOC/import/export weight,
- language distribution,
- directory structure,
- file size and line count,
- best-effort exported symbols,

## What makes it different

### Local-first

StackSketch reads files on disk and writes a static report. It does not require an API key, cloud account, browser extension, or repository upload.

### Zero runtime dependencies

The CLI is intentionally dependency-free. That makes installation fast, packaging simple, and CI usage reliable.

### Built for screenshots

The HTML report is designed to look good immediately. It is the kind of output people can drop into a README, PR, landing page, or social post without extra design work.

### Useful for AI workflows

The JSON output is a compact map of a repository that can be used as context for AI agents, codebase summarizers, onboarding bots, and architecture review pipelines.

## Development

```bash
npm install --ignore-scripts
npm run check
npm test
npm run smoke
npm start
```

`npm start` scans the StackSketch repository itself and writes `stacksketch.html`.

Before publishing, run:

```bash
npm run check
npm test
npm run smoke
npm pack --dry-run
DRY_RUN=1 ./scripts/publish.sh
```

## Packaging

```bash
npm pack
npm publish
```

The package includes the CLI source, scripts, README, changelog, contributing guide, and license.

## Current status

StackSketch is usable as a local CLI and npm package. The project is not yet a full multi-language AST parser: language detection is broad, while local dependency resolution is strongest for JavaScript/TypeScript, Dart, Python, Rust, Go, and CSS assets.

Generated HTML and Markdown reports use display-friendly project names instead of embedding absolute local filesystem paths.

## Roadmap

Planned work:

- GitHub URL input.
- Graphviz export.
- Plugin system for custom parsers.
- CI badge generation.
- Multi-repo monorepo views.
- Architecture smell detection.
- Local LLM-assisted summary mode with explicit opt-in.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development commands, test expectations, and contribution areas.

## License

MIT
