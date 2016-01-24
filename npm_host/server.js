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
      push('Spawned Ffmpeg with command: ' + commandLine);
    })
    .on('error', function(err) {
      push('An error occurred: ' + err.message);
    })
    .on('end', function() {
      push('Processing finished !');
      done();
    })
    .run();
  }))
  .pipe(new nativeMessage.Output())
  .pipe(process.stdout)
;
