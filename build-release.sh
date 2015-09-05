#!/bin/bash
set -e
cd /tmp

rm -r /tmp/Negotiator || true
mkdir Negotiator
rsync -rv $1 --exclude-from $1/release.exclude.txt Negotiator/ || true

#Web Extension
pushd Negotiator
zip -r $1/Negotiator.xpi *
popd

#SilentOrbit
google-chrome --pack-extension=Negotiator --pack-extension-key=$2
mv Negotiator.crx $1/

#Chrome Web Store
#remove update_url for chrome web store
cp Negotiator/manifest.json .
cat manifest.json |grep -v update_url > Negotiator/manifest.json
rm manifest.json

rm /tmp/Negotiator.zip || true

zip -r Negotiator.zip Negotiator/

rm -r /tmp/Negotiator

mv Negotiator.zip $1/negotiator-chrome-release.zip
