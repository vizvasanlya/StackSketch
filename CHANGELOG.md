# Changelog

## Unreleased

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
