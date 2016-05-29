#!/bin/bash
set -e
SOURCE=$(dirname $0)
echo $SOURCE

ls $1

cd /tmp

rm -r /tmp/Negotiator || true
mkdir Negotiator
rsync -rv $SOURCE --exclude-from $SOURCE/release.exclude.txt Negotiator/ || true

#Web Extension
pushd Negotiator
zip -r $SOURCE/../Releases/Negotiator.xpi *
popd

#SilentOrbit
google-chrome --pack-extension=Negotiator --pack-extension-key=$1
mv Negotiator.crx $SOURCE/../Releases/

#Chrome Web Store
#remove update_url for chrome web store
cp Negotiator/manifest.json .
cat manifest.json |grep -v update_url > Negotiator/manifest.json
rm manifest.json

rm /tmp/Negotiator.zip || true

zip -r Negotiator.zip Negotiator/

rm -r /tmp/Negotiator

mv Negotiator.zip $1/negotiator-chrome-release.zip
