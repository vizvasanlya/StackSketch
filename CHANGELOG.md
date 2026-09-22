# Changelog

## Unreleased

- Added circular dependency detection (Tarjan SCC) surfaced as an `insights.cycles` report field and a dedicated Architecture Insights panel.
- Added tsconfig/jsconfig `paths` alias, `baseUrl`, and Node subpath (`#*`) import resolution for TypeScript and JavaScript.
- Added CSS/SCSS/Sass/Less `@import`, `@use`, and `@forward` extraction and resolution, including Sass partials.
- Added local import resolution for Java, Kotlin, Scala, C, C++, Ruby, PHP, Lua, C#, and Swift.
- Fixed Python `src/`-layout package resolution.
- Added Prisma, SQLAlchemy, and Celery framework detection.
- Hardened the local server: binds to 127.0.0.1 by default (overridable via `HOST`).
- Corrected project metadata; removed unrelated capability tag.
- Expanded the analyzer and graph test suites.
- Hardened `.gitignore` handling with negation support and fixed default `.git/` ignore matching.
- Improved local import resolution for Go packages, Rust `crate::` imports, and CSS assets.
- Redacted absolute local root paths from generated HTML/Markdown payloads.
- Added stricter CLI validation for formats, max file counts, and positional roots.
- Added framework detection from `requirements.txt`.
- Improved JavaScript export symbol detection and removed non-exported class/function noise.
- Added renderer safeguards to avoid mutating report data.
- Added CLI, renderer, Go, Rust, `.gitignore`, CSS import, and framework detection tests.
- Added CI, smoke checks, safer publish script, changelog, and contributing guide.

## 0.1.6

- Switched the HTML graph renderer from SVG to canvas with pan, zoom, hover, search, filters, SVG download, and Markdown copy.
- Added Dart and Flutter project support.
- Hardened scanning and report accuracy.
- Synced CLI version with npm release metadata.

## 0.1.5 and earlier

- Initial zero-dependency CLI releases.
