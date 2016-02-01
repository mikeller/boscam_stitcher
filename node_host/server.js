#!/usr/bin/nodejs

var nativeMessage = require('chrome-native-messaging');
var FfmpegCommand = require('fluent-ffmpeg');
var pjson = require('./package.json');

var tmpDir = '/tmp';
var version = pjson.version;

process.stdin
  .pipe(new nativeMessage.Input())
  .pipe(new nativeMessage.Transform(function(msg, push, done) {
    var ffmpegCommand = new FfmpegCommand();

    msg.inputs.forEach(function(filename) {
      ffmpegCommand.input(filename);
    });

    ffmpegCommand
    .outputOptions(msg.outputOptions)
    .on('start', function(commandLine) {
      push({
        text: 'Spawned ffmpeg with command: ' + commandLine,
        error: false,
        processingDone: false
      });
    })
    .on('progress', function(progress) {
      push({
        progress: progress,
        error: false,
        processingDone: false
      });
    })
    .on('error', function(err) {
      push({
        text: 'An error occurred: ' + err.message,
        error: true,
        processingDone: true
      });
      done();
    })
    .on('end', function() {
      push({
        text: 'Processing finished !',
        error: false,
        processingDone: true
      });
      done();
    })
    .mergeToFile(msg.output, tmpDir);
  }))
  .pipe(new nativeMessage.Output())
  .pipe(process.stdout);
