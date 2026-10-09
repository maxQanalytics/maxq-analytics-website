#!/bin/sh
# Renders the link-preview card (1200 x 630) and the square logo used in the
# organisation markup, from the HTML in scripts/og/, with headless Chrome.
#   sh scripts/render-share-image.sh
set -e
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --window-size=1200,630 --screenshot="$PWD/public/og/maxq-analytics.png" "file://$PWD/scripts/og/share-card.html" 2>/dev/null
"$CHROME" --headless --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --window-size=512,512 --screenshot="$PWD/public/og/maxq-analytics-logo-512.png" "file://$PWD/scripts/og/logo-square.html" 2>/dev/null
ls -la public/og
