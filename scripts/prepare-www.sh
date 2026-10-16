#!/usr/bin/env bash
# Builds www/ for the iOS app from the same index.html / app.js / manifest the
# browser version uses. Only change: the two CDN scripts are served from local
# copies (so the app works fully offline) and a tiny shim makes "Export backup"
# open the iOS share sheet. app.js is copied byte-for-byte.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf www && mkdir -p www
cp index.html app.js manifest.webmanifest www/
cp -R ios-web/vendor www/vendor
cp ios-web/native-shim.js www/
perl -0pi -e 's#<script src="https://cdn\.tailwindcss\.com"></script>#<script src="./native-shim.js"></script>\n  <script src="./vendor/tailwindcss.js"></script>#; s#https://cdnjs\.cloudflare\.com/ajax/libs/tone/14\.8\.49/Tone\.js#./vendor/Tone.js#' www/index.html
if grep -nE 'src="https?://' www/index.html; then
  echo "ERROR: index.html still loads remote scripts; app would not be offline" >&2
  exit 1
fi
grep -q 'native-shim.js' www/index.html
echo "www/ ready:"; ls -R www
