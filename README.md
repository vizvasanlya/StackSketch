# StackSketch

**Turn any codebase into a beautiful architecture map in one command.**

StackSketch is a zero-dependency CLI that scans a repository locally, detects languages/frameworks, extracts imports, builds a dependency graph, and exports a polished HTML report, Markdown summary, or JSON dataset.

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
- works across JavaScript, TypeScript, Python, Go, Rust, Java, C#, PHP, Ruby, and more,
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

JavaScript, TypeScript, Vue, Svelte, Python, Go, Rust, Java, C#, PHP, Ruby, Swift, Kotlin, Scala, C, C++, CSS, SCSS, HTML, JSON, YAML, TOML, Markdown, SQL, Shell, PowerShell, Dockerfile, Terraform, and Lua.

### Frameworks

React, Next.js, Vite, Nuxt, Svelte, Vue, Express, NestJS, Fastify, Django, Flask, FastAPI, Tailwind CSS, Actix Web, Rocket, Gin, Echo, and Spring Boot.

### Graph signals

- local imports,
- external dependencies,
- top files by LOC/import/export weight,
- language distribution,
- directory structure,
- file size and line count,
- exported symbols.

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
npm install
npm test
npm start
```

`npm start` scans the StackSketch repository itself and writes `stacksketch.html`.

## Packaging

```bash
npm pack
npm publish
```

The package includes only the CLI source, scripts, README, and license.

## Launch checklist

Use this checklist when publishing the first version:

1. Create a GitHub repository named `stacksketch`.
2. Add the generated `stacksketch.html` from this repo as a demo screenshot.
3. Pin a short demo GIF in the README hero.
4. Post the first release on developer communities with the hook: “I built a zero-dependency CLI that turns any repo into an architecture map.”
5. Add a “Generated with StackSketch” section to your own README.
6. Submit to CLI, visualization, and developer-tool directories.
7. Invite maintainers of medium-sized open-source projects to generate and share their maps.
8. Add examples for React, Next.js, Python, Go, and Rust repos.
9. Track issues asking for language support and prioritize the most requested ecosystems.
10. Release `v0.2.0` with GitHub URL support once the local CLI has traction.

## Roadmap

- GitHub URL input.
- Mermaid and Graphviz export.
- Plugin system for custom parsers.
- CI badge generation.
- Multi-repo monorepo views.
- Architecture smell detection.
- Local LLM-assisted summary mode with explicit opt-in.

## License

MIT
