#!/bin/bash
set -e
cd /tmp

rm -r /tmp/Kiss || true
mkdir Kiss 
rsync -rv $1 --exclude-from $1/release.exclude.txt Kiss/ || true

google-chrome --pack-extension=Kiss --pack-extension-key=$2

mv Kiss.crx $1/

#remove update_url for chrome web store
cp Kiss/manifest.json .
cat manifest.json |grep -v update_url > Kiss/manifest.json
rm manifest.json

rm /tmp/kiss.zip || true

zip -r kiss.zip Kiss/

rm -r /tmp/Kiss

mv kiss.zip $1/kiss-chrome-release.zip
