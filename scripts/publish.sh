#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-patch}"

if [[ "${DRY_RUN:-1}" == "1" ]]; then
  npm run check
  npm test
  npm pack --dry-run
  echo "Dry run complete. Set DRY_RUN=0 to bump, publish, and push."
  exit 0
fi

read -r -p "Publish stacksketch-cli with a ${VERSION} bump? [y/N] " confirm
if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
  echo "Publish cancelled."
  exit 1
fi

npm run check
npm test
npm version "$VERSION"
npm publish --access public
git push
git push --tags
