#!/bin/sh

HOST_SCRIPT_NAME=server.js

MANIFEST_NAME=ch.042.boscam_stitcher.json
MANIFEST_PATH=~/.config/chromium/NativeMessagingHosts

CURRENT_DIR=$(readlink -f "$0" | xargs dirname)
cd ${CURRENT_DIR}


# Install npm packages
npm install


# Install host app manifest
mkdir -p ${MANIFEST_PATH}

cp ${MANIFEST_NAME} ${MANIFEST_PATH}/${MANIFEST_NAME}

sed -i -E "s#^(\s*\"path\"\s*:\s*\").*(\"\s*,\s*)\$#\1${CURRENT_DIR}/${HOST_SCRIPT_NAME}\2#" ${MANIFEST_PATH}/${MANIFEST_NAME}
