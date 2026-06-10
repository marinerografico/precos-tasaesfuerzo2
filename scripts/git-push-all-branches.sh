#!/usr/bin/env bash
# Sube main a GitHub. No guardes el token en archivos.
# Uso:
#   export GITHUB_TOKEN="ghp_xxxxxxxx"
#   ./scripts/git-push-all-branches.sh
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "Define GITHUB_TOKEN con tu Personal Access Token (repo)." >&2
  exit 1
fi
OWNER_REPO="gonzalezjuandi/MoneyConfidence-tabs"
URL="https://${GITHUB_TOKEN}@github.com/${OWNER_REPO}.git"
git push -u "${URL}" main
echo "Listo: main en origin."
