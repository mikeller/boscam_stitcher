#!/bin/sh

HOST_SCRIPT_NAME=server.js
HOST_SCRIPT_PATH=/opt/boscam_stitcher

MANIFEST_NAME=ch.042.boscam_stitcher.json
MANIFEST_PATH=~/.config/chromium/NativeMessagingHosts

VERSION=0.1.3


mkdir $HOST_SCRIPT_PATH

cat << EOF > $HOST_SCRIPT_PATH/$HOST_SCRIPT_NAME
#!/usr/bin/nodejs

var nativeMessage = require('chrome-native-messaging');
var FfmpegCommand = require('fluent-ffmpeg');

process.stdin
  .pipe(new nativeMessage.Input())
  .pipe(new nativeMessage.Transform(function(msg, push, done) {
    var ffmpegCommand = new FfmpegCommand();

    msg.inputs.forEach(function(filename) {
      ffmpegCommand.mergeAdd(filename);
    });

    ffmpegCommand
    .output(msg.output)
    .outputOptions(msg.outputOptions)
    .on('start', function(commandLine) {
      push({
        text: 'Spawned ffmpeg with command: ' + commandLine,
        processingDone: false
      });
    })
    .on('progress', function(progress) {
      push({
        progress: progress,
        processingDone: false
      });
    })
    .on('error', function(err) {
      push({
        text: 'An error occurred: ' + err.message,
        processingDone: true
      });
      done();
    })
    .on('end', function() {
      push({
        text: 'Processing finished !',
        processingDone: true
      });
      done();
    })
    .run();
  }))
  .pipe(new nativeMessage.Output())
  .pipe(process.stdout);
EOF

chmod ug+x $HOST_SCRIPT_PATH/$HOST_SCRIPT_NAME


cat << EOF > $HOST_SCRIPT_PATH/package.json
{
  "name": "boscam_stitcher",
  "version": "<VERSION>",
  "private": true,
  "description": "Node host to do the heavy lifting required to stitch (and compress) video files created by a Boscam TR1 camera",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/mikeller/boscam_stitcher.git"
  },
  "keywords": [
    "video",
    "avi",
    "rc",
    "fpv"
  ],
  "author": "Michael Keller (mikeller@gmail.com)",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/mikeller/boscam_stitcher/issues"
  },
  "dependencies": {
    "chrome-native-messaging": "^0.2.0",
    "fluent-ffmpeg": "^2.0.1"
  }
}
EOF

sed -i -e "s/<VERSION>/$VERSION/" $HOST_SCRIPT_PATH/package.json


cd $HOST_SCRIPT_PATH

npm install


mkdir -p $MANIFEST_PATH

cat << EOF > $MANIFEST_PATH/$MANIFEST_NAME
{
  "name": "ch.042.boscam_stitcher",
  "description": "Boscam Stitcher",
  "path": "<HOST_SCRIPT_PATH>/server.js",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://heijiodgmgibgfnbnolojncclbahbfmc/"
  ]
}
EOF

sed -i -e "s#<HOST_SCRIPT_PATH>#$HOST_SCRIPT_PATH#g" $MANIFEST_PATH/$MANIFEST_NAME
