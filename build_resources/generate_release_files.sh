#!/bin/sh

VERSION=$(git describe --abbrev=0 --tags)

CHROME_APP_NAME=boscam_stitcher_${VERSION}.zip
INSTALL_SCRIPT_NAME=install_boscam_stitcher_host_${VERSION}.sh

HOST_SCRIPT_NAME=server.js
MANIFEST_NAME=ch.042.boscam_stitcher.json


# Build chrome app
sed -i -E "s/^(\s*\"version\"\s*:\s*\").*(\"\s*,\s*)$/\1${VERSION}\2/" chrome_app/manifest.json 

zip -r  ${CHROME_APP_NAME} chrome_app -x \*/node_modules/\*


# Build release host app install script
sed -i -E "s/^(\s*\"version\"\s*:\s*\").*(\"\s*,\s*)$/\1${VERSION}\2/" node_host/package.json

cat node_host/installer_template/part_0 > ${INSTALL_SCRIPT_NAME}

sed -i -E "s/^(VERSION=).*$/\1"${VERSION}"/" ${INSTALL_SCRIPT_NAME}
sed -i -E "s/^(HOST_SCRIPT_NAME=).*$/\1"${HOST_SCRIPT_NAME}"/" ${INSTALL_SCRIPT_NAME}
sed -i -E "s/^(MANIFEST_NAME=).*$/\1"${MANIFEST_NAME}"/" ${INSTALL_SCRIPT_NAME}

cat node_host/${HOST_SCRIPT_NAME} >>  ${INSTALL_SCRIPT_NAME}

cat node_host/installer_template/part_1 >> ${INSTALL_SCRIPT_NAME}

cat node_host/package.json >>  ${INSTALL_SCRIPT_NAME}

cat node_host/installer_template/part_2 >> ${INSTALL_SCRIPT_NAME}

cat node_host/${MANIFEST_NAME} >>  ${INSTALL_SCRIPT_NAME}

cat node_host/installer_template/part_3 >> ${INSTALL_SCRIPT_NAME}
