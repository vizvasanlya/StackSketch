#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-patch}"

npm test
npm version "$VERSION"
npm publish --access public
git push
git push --tags
