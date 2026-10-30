#!/usr/bin/env bash
# Downloads the Broadway.js H.264 software decoder used as a fallback for
# browsers without WebCodecs. Files land in apps/web/public/broadway/.
set -euo pipefail
cd "$(dirname "$0")/../../apps/web/public"
mkdir -p broadway
BASE="https://raw.githubusercontent.com/mbebenita/Broadway/master/Player"
for f in Decoder.js avc.wasm; do
  curl -fsSL "$BASE/$f" -o "broadway/$f"
  echo "fetched broadway/$f"
done
