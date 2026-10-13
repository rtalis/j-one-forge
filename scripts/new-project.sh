#!/usr/bin/env bash
# Scaffold a new tool from this base.
# Usage: ./scripts/new-project.sh <target-dir> "<App Name>" <slug> <app-id> [basepath]
# Example: ./scripts/new-project.sh ../estoque "Estoque" estoque 21 /estoque
set -euo pipefail

if [ $# -lt 4 ]; then
  echo "Usage: $0 <target-dir> \"<App Name>\" <slug> <app-id> [basepath]" >&2
  exit 1
fi

TARGET="$1"; NAME="$2"; SLUG="$3"; APPID="$4"; BASEPATH="${5:-}"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -e "$TARGET" ] && [ -n "$(ls -A "$TARGET" 2>/dev/null)" ]; then
  echo "Target $TARGET already exists and is not empty." >&2; exit 1
fi
mkdir -p "$TARGET"

tar -C "$SRC" \
  --exclude=node_modules --exclude=dist --exclude=.git --exclude=.tanstack \
  --exclude=.output --exclude=.env --exclude=src/routeTree.gen.ts -cf - . | tar -C "$TARGET" -xf -

cd "$TARGET"
sed -i "s|\"name\": \"ruah-base\"|\"name\": \"$SLUG\"|" package.json
sed -i "s|name: \"Ruah Base\"|name: \"$NAME\"|; s|storageKey: \"ruah_base_token\"|storageKey: \"ruah_${SLUG//-/_}_token\"|; s|defaultAppId: 1,|defaultAppId: $APPID,|" src/app.config.ts
sed -i "s|loginTagline: \"Nova Ferramenta\"|loginTagline: \"$NAME\"|" src/app.config.ts
sed -i "s|^VITE_APP_ID=.*|VITE_APP_ID=$APPID|; s|^VITE_BASEPATH=.*|VITE_BASEPATH=$BASEPATH|" .env.example
cp .env.example .env
[ -n "$BASEPATH" ] && sed -i "s|/public_html/app|/public_html${BASEPATH}|" .github/workflows/deploy.yml || true
git init -q 2>/dev/null || true

echo "Done. Next:"
echo "  cd $TARGET && npm install && npm run dev"
echo "Edit src/app.config.ts (branding), src/components/app-sidebar.tsx (menu), src/routes/* (pages)."
