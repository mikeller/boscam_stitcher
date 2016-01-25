var nativeMessage = require('chrome-native-messaging');
var FfmpegCommand = require('fluent-ffmpeg');

process.stdin
  .pipe(new nativeMessage.Input())
  .pipe(new nativeMessage.Transform(function(msg, push, done) {
    var ffmpegCommand = new FfmpegCommand();

    msg.inputs.forEach(function(filename) {
      ffmpegCommand.mergeAdd(filename);
    });

    ffmpegCommand.output(msg.output)
    .on('start', function(commandLine) {
      push({
        text: 'Spawned Ffmpeg with command: ' + commandLine,
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
  .pipe(process.stdout)
;
