#!/bin/bash
set -e
pushd $(dirname $0)
SOURCE=`pwd`
popd > /dev/null

mkdir $SOURCE/../Releases || true
pushd $SOURCE/../Releases
REL=`pwd`
popd > /dev/null

ls $1

cd $REL

#rm -r $REL/Negotiator || true
#mkdir Negotiator
#rsync -rv $SOURCE/ --exclude-from $SOURCE/release.exclude.txt Negotiator/ || true

#Web Extension
#pushd Negotiator
#zip -r $SOURCE/../Releases/Negotiator.xpi *
#popd

#Chrome Web Store
CWSZIP=$REL/ChromeWebStore-Negotiator.zip
rm -r $REL/ChromeWebStore || true
mkdir $REL/ChromeWebStore
rsync -rv $SOURCE/ --exclude-from $SOURCE/release.exclude.txt $REL/ChromeWebStore
#remove update_url for chrome web store
cp $REL/ChromeWebStore/manifest.json cws_manifest.tmp
cat cws_manifest.tmp |grep -v update_url > $REL/ChromeWebStore/manifest.json
rm cws_manifest.tmp

rm $CWSZIP || true
cd $REL/ChromeWebStore/
zip -r $CWSZIP *

#Firefox
rm -r $REL/Firefox || true
mkdir $REL/Firefox
rsync -rv $SOURCE/ --exclude-from $SOURCE/release.exclude.txt $REL/Firefox
FFZIP=$REL/Firefox-Negotiator.zip
cd $REL/Firefox/
zip -r $FFZIP *
