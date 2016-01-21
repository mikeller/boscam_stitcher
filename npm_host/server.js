var nativeMessage = require('chrome-native-messaging');

process.stdin
    .pipe(new nativeMessage.Input())
    .pipe(new nativeMessage.Transform(function(msg, push, done) {
        var reply = "Got this: " + msg.text; // Implemented elsewhere by you.
        push(reply);                  // Push as many replies as you like.
        done();                       // Call when done pushing replies.
    }))
    .pipe(new nativeMessage.Output())
    .pipe(process.stdout)
;
