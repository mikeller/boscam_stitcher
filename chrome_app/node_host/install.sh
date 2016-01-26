#!/bin/bash

HOST_CONFIG=ch.042.boscam_stitcher.json
HOST_SCRIPT=server.js

INSTALL_PATH=~/.config/chromium/NativeMessagingHosts

SCRIPT_PATH=$(readlink -f "$0" | xargs dirname)

cd $SCRIPT_PATH

npm install

chmod ug+x $SCRIPT_PATH/$SERVER_SCRIPT

mkdir -p $INSTALL_PATH
cp ./$HOST_CONFIG $INSTALL_PATH/$HOST_CONFIG

sed -i -e "s#<script_path>#$SCRIPT_PATH#g" $INSTALL_PATH/$HOST_CONFIG
