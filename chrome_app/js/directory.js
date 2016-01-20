(function() {
  var inputDirectory = document.getElementById('inputDirectory');
  var outputDirectory = document.getElementById('outputDirectory');
  var fileList = document.getElementById('fileList');
  var status = document.getElementById('status');

  var inputDirectoryEntry;
  var outputDirectoryEntry;

  var inputList = [];

  function updateStatus() {
    if (inputDirectoryEntry && outputDirectoryEntry) {
	document.getElementById('process').disabled = false;
    } else {
	document.getElementById('process').disabled = true;
    }
  }

  function doChooseInputDirectory() {
    chrome.fileSystem.chooseEntry( {
      type: 'openDirectory'
    }, processInputDirectory);
  }

  function doChooseOutputDirectory() {
    chrome.fileSystem.chooseEntry( {
      type: 'openDirectory'
    }, processOutputDirectory);
  }

  function processInputDirectory(directoryEntry) {
    if (directoryEntry) {
      inputDirectoryEntry = directoryEntry;
      chrome.fileSystem.getDisplayPath(directoryEntry, function(path) {
        inputDirectory.innerText = path;
        status.innerText = 'Set input path to ' + path;
      });

      var directoryReader = directoryEntry.createReader();
      directoryReader.readEntries(processInputFiles,
        function (error) {
          inputDirectoryEntry = undefined;

          status.innerText = 'Listing ' + dirPath + ' failed.';
        }
      );

      updateStatus();
    }
  }

  function processInputFiles (entries) {
    inputList.length = 0;
    fileList.innerText = '';
    var minIndex = 10000;
    var maxIndex = -1;
    entries.forEach(function(entry) {
      if (entry.isFile) {
        var inputEntry = {};
        inputEntry.fileEntry = entry;
        var fileIndex = parseInt(entry.name.substring(4, 8), 10);

        if(inputList[fileIndex] !== undefined) {
          status.innerText = 'Error, file with index ' + fileIndex + ' exists multiple times.';
          throw 'Duplicate index';
        }
	if (fileIndex < minIndex) {
          minIndex = fileIndex;
        }
        if (fileIndex > maxIndex) {
          maxIndex = fileIndex;
        }

        inputEntry.sequenceIndex = parseInt(entry.name.substring(0, 4), 10);
        inputList[fileIndex] = inputEntry;
      }
    });

    var fragment = document.createDocumentFragment();
    var lastSequenceIndex = inputList[minIndex].sequenceIndex - 3;
    for (i = minIndex; i <= maxIndex; i++) {
      if (inputList[i] !== undefined) {
        if (inputList[i].sequenceIndex !== lastSequenceIndex + 3) {
          var li = document.createElement('li');
          li.innerText = '-';
          fragment.appendChild(li);
        }
        var li = document.createElement('li');
        li.innerHTML = ['<span>', inputList[i].fileEntry.name, '</span>'].join('');

        lastSequenceIndex = inputList[i].sequenceIndex;

        fragment.appendChild(li);
      }
    }
    fileList.appendChild(fragment);
  }
    
  function processOutputDirectory(directoryEntry) {
    if (directoryEntry) {
      outputDirectoryEntry = directoryEntry;
      chrome.fileSystem.getDisplayPath(directoryEntry, function(path) {
        outputDirectory.innerText = path;
        status.innerText = 'Set output path to ' + path;
      });
      updateStatus();
    }
  }

  function doProcess() {
    var port = chrome.runtime.connectNative('ch.042.boscam_stitcher');

      port.onMessage.addListener(function(msg) {
        console.log("Received" + msg);
      });

      port.onDisconnect.addListener(function() {
        console.log("Disconnected");
      });

      port.postMessage({ text: "hello world" });
  }

  document.getElementById('chooseInputDirectory').addEventListener('click', doChooseInputDirectory);
  document.getElementById('chooseOutputDirectory').addEventListener('click', doChooseOutputDirectory);
  document.getElementById('process').addEventListener('click', doProcess);
})();

