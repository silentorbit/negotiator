#!/bin/bash
set -e
pushd $(dirname $0)
SOURCE=`pwd`
cd extension
EXTENSION=`pwd`
popd > /dev/null

mkdir Release || true
pushd Release
REL=`pwd`
popd > /dev/null

ls $1

cd $REL

#Chrome Web Store
CWSZIP=$REL/ChromeWebStore-Negotiator.zip
rm -r $REL/ChromeWebStore || true
mkdir $REL/ChromeWebStore
cp -r $EXTENSION/* $REL/ChromeWebStore
#remove update_url for chrome web store
cp $REL/ChromeWebStore/manifest.json cws_manifest.tmp
cat cws_manifest.tmp |grep -v update_url > $REL/ChromeWebStore/manifest.json
rm cws_manifest.tmp

rm $CWSZIP || true
cd $REL/ChromeWebStore/
zip -r $CWSZIP *

#Firefox
#rm -r $REL/Firefox || true
#mkdir $REL/Firefox
#cp -r $EXTENSION/* $REL/Firefox
#FFZIP=$REL/Firefox-Negotiator.zip
#cd $REL/Firefox/
#zip -r $FFZIP *
