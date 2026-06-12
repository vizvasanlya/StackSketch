# Contributing to StackSketch

StackSketch is a small zero-dependency Node.js CLI, so contributions should stay lightweight and testable.

## Development

```bash
npm install --ignore-scripts
npm run check
npm test
npm run smoke
```

Useful commands:

```bash
npm start
npm pack --dry-run
DRY_RUN=1 ./scripts/publish.sh
```

## Pull request checklist

- Add or update tests for analyzer, CLI, or renderer behavior.
- Keep the CLI dependency-free unless a new dependency is absolutely necessary.
- Avoid leaking absolute local paths in generated reports.
- Update the README and changelog when behavior changes.
- Run `npm run check`, `npm test`, `npm run smoke`, and `npm pack --dry-run` before opening a PR.

## Contribution areas

Good first areas include:

- language-specific import resolvers,
- framework detection improvements,
- renderer accessibility and performance,
- CLI UX and validation,
- documentation examples for real repositories.
